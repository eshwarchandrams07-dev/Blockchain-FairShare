/**
 * LiveSyncService
 * Multi-device and multi-tab real-time synchronization engine for FairShare.
 *
 * Supports:
 * 1. BroadcastChannel API for instantaneous multi-tab sync on the same device.
 * 2. WebSocket Relay for multi-device sync across phones/laptops on local Wi-Fi or LAN.
 * 3. Supabase Realtime / Cloud Relay (optional fallback for remote internet connections).
 */

class LiveSyncService {
  constructor() {
    this.broadcastChannel = null;
    this.ws = null;
    this.listeners = new Set();
    this.status = 'DISCONNECTED'; // 'CONNECTED' | 'CONNECTING' | 'LOCAL_ONLY' | 'DISCONNECTED'
    this.lastReceivedTimestamp = 0;
    this.deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    this._onceConnectedCallbacks = []; // Queued callbacks to fire when WebSocket first connects

    this.initBroadcastChannel();
    this.initWebSocket();
    this.fetchServerCachedState();
    this.startHttpPolling();
  }

  startHttpPolling() {
    if (typeof window === 'undefined') return;
    if (this._pollingInterval) clearInterval(this._pollingInterval);
    this._pollingInterval = setInterval(() => {
      // If WebSocket is not actively connected (as on Vercel), continuously sync via HTTP
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.fetchServerCachedState();
      }
    }, 3500);
  }

  fetchServerCachedState() {
    if (typeof window === 'undefined') return;
    try {
      fetch('/api/ledger-state')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.state) {
            this.handleIncomingMessage({
              type: 'STATE_UPDATED',
              state: data.state,
              fromServerHttp: true,
            }, 'HTTP_HYDRATION');
            if (this.status === 'DISCONNECTED' || this.status === 'LOCAL_ONLY') {
              this.status = 'CONNECTED';
              this.notifyStatusChange();
            }
          }
        })
        .catch(() => {});
    } catch {}
  }

  initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('fairshare_live_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data, 'BROADCAST_CHANNEL');
        };
        this.status = 'LOCAL_ONLY';
      } catch (err) {
        console.warn('BroadcastChannel not supported:', err);
      }
    }
  }

  initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/fairshare-sync`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.status = 'CONNECTED';
        this.wsRetryAttempts = 0;
        this.notifyStatusChange();
        // Fire any queued onceConnected callbacks
        const cbs = this._onceConnectedCallbacks.splice(0);
        for (const cb of cbs) {
          try { cb(); } catch (e) { console.warn('onceConnected callback error:', e); }
        }
        // Request state sync from peers
        this.broadcast({
          type: 'REQUEST_SYNC',
          senderDeviceId: this.deviceId,
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data, 'WEBSOCKET');
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.status = this.broadcastChannel ? 'LOCAL_ONLY' : 'DISCONNECTED';
        this.notifyStatusChange();
        this.wsRetryAttempts = (this.wsRetryAttempts || 0) + 1;
        // Fast retries (4s) for first 3 attempts, then exponential backoff up to 45s
        if (this.wsRetryAttempts <= 8) {
          const delay = this.wsRetryAttempts <= 3 
            ? 4000 
            : Math.min(45000, 5000 * Math.pow(1.5, this.wsRetryAttempts - 3));
          setTimeout(() => this.initWebSocket(), delay);
        }
      };

      this.ws.onerror = () => {
        this.status = this.broadcastChannel ? 'LOCAL_ONLY' : 'DISCONNECTED';
        this.notifyStatusChange();
      };
    } catch (err) {
      console.warn('WebSocket connection not available:', err);
      this.status = this.broadcastChannel ? 'LOCAL_ONLY' : 'DISCONNECTED';
    }
  }

  handleIncomingMessage(data, source) {
    if (!data || data.senderDeviceId === this.deviceId) return;

    // Trigger registered listeners
    for (const listener of this.listeners) {
      try {
        listener(data, source);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    }
  }

  broadcast(message) {
    const payload = {
      ...message,
      senderDeviceId: this.deviceId,
      timestamp: Date.now(),
    };

    // 1. Broadcast locally to other tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Broadcast across network via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('WebSocket send error:', e);
      }
    }

    // 3. Backup to server memory state endpoint
    if (payload.type === 'STATE_UPDATED' && payload.state && typeof window !== 'undefined') {
      try {
        fetch('/api/ledger-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {}
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyStatusChange() {
    for (const listener of this.listeners) {
      try {
        listener({ type: 'SYNC_STATUS_CHANGE', status: this.status });
      } catch {}
    }
  }

  /**
   * Register a callback to fire once when the WebSocket connects.
   * If already connected, fires immediately.
   */
  onceConnected(callback) {
    if (this.status === 'CONNECTED') {
      try { callback(); } catch {}
    } else {
      this._onceConnectedCallbacks.push(callback);
    }
  }

  getStatus() {
    return this.status;
  }
}

/**
 * Web Audio API synthesizer for pleasant micro-chimes on mobile and desktop
 */
export function playChimeSound(type = 'notification') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'notification') {
      // Two-tone attention chime: D5 (587Hz) -> A5 (880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'success') {
      // Ascending chord: C5 -> E5 -> G5
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.22);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'alert') {
      // Disagreement / Dispute warning: 440Hz -> 330Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.18);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Ignore silent audio block
  }
}

export const liveSync = new LiveSyncService();
