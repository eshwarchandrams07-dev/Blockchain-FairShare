import React, { useState } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  X, 
  Radio, 
  Sparkles,
  QrCode
} from 'lucide-react';

export default function ConnectDevicesModal({
  isOpen,
  onClose,
  groupId = 1,
  inviteCode = 'FS-4020',
  activePersona
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showIpEdit, setShowIpEdit] = useState(false);

  // Compute origin and mobile URL
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const [lanIp, setLanIp] = useState(isLocalhost ? '172.20.161.113' : currentHost);

  if (!isOpen) return null;

  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ':5173';
  const effectiveHost = isLocalhost ? `${lanIp}${port}` : (typeof window !== 'undefined' ? window.location.host : '172.20.161.113:5173');
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const mobileJoinUrl = `${protocol}//${effectiveHost}/?joinGroup=${groupId}&key=${encodeURIComponent(inviteCode)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(mobileJoinUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--grad-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '19px', fontWeight: 800 }}>Scan-to-Join Live Ledger</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Point phone camera to join #{groupId} as an independent validator node
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Live Relay Status Banner */}
        <div 
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sync-dot-pulse"></div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald-light)' }}>
                Multi-Device Wi-Fi Relay Ready
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Devices on same Wi-Fi instantly sync expenses, UPI settlements & votes in real-time.
              </div>
            </div>
          </div>
          <span 
            className="badge badge-approved"
            style={{ fontSize: '10px', textTransform: 'uppercase' }}
          >
            Connected
          </span>
        </div>

        {/* SCAN-TO-JOIN QR CODE HERO CONTAINER */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 116, 144, 0.08) 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>📷</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              Scan with Phone Camera
            </span>
            <span 
              style={{
                fontSize: '11px',
                background: 'rgba(21, 128, 61, 0.15)',
                color: 'var(--color-emerald)',
                border: '1px solid rgba(21, 128, 61, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700
              }}
            >
              1-Second Pairing
            </span>
          </div>

          {/* QR Card Container */}
          <div 
            style={{
              background: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '14px',
              display: 'inline-block'
            }}
          >
            <img 
              src={qrCodeUrl}
              alt="Scan to join group ledger"
              style={{
                width: '180px',
                height: '180px',
                display: 'block',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px' }}>
            Opens: <code className="mono" style={{ color: 'var(--color-primary-light)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px' }}>{mobileJoinUrl}</code>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
            No app store download needed. Opens directly in Safari or Chrome on your iPhone/Android and assigns a cryptographic wallet identity.
          </div>

          {/* Wi-Fi IP Adjustment if needed */}
          {isLocalhost && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Wi-Fi IP detected: <strong>{lanIp}</strong>. </span>
              <button 
                type="button"
                onClick={() => setShowIpEdit(!showIpEdit)}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '11px' }}
              >
                {showIpEdit ? 'Hide IP setting' : 'Change Wi-Fi IP'}
              </button>
              {showIpEdit && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'center' }}>
                  <input 
                    type="text" 
                    value={lanIp} 
                    onChange={e => setLanIp(e.target.value.trim())}
                    className="form-input mono"
                    style={{ width: '150px', padding: '4px 8px', fontSize: '11px', height: '28px' }}
                    placeholder="e.g. 192.168.1.10"
                  />
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setShowIpEdit(false)}
                    style={{ height: '28px', fontSize: '11px' }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Outsider Shield & Private Passkey Card */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.07)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                🛡️ Outsider Barrier Active
              </span>
              <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                Private Group
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Outsiders cannot enter without this QR code or secret passkey:
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="mono"
              style={{
                fontSize: '15px',
                fontWeight: 900,
                letterSpacing: '1px',
                background: 'var(--bg-card)',
                color: 'var(--color-primary-light)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px dashed var(--color-primary)'
              }}
            >
              {inviteCode}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopyCode}
              title="Copy Private Passkey"
              style={{ height: '32px' }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Group Invite Link Box */}
        <div style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--color-primary-light)' }} />
            <span>Or Copy Direct Link with Embedded Key (Group #{groupId})</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              readOnly 
              value={mobileJoinUrl} 
              className="form-input mono"
              style={{ fontSize: '12px', background: 'var(--bg-surface)' }}
            />
            <button 
              className="btn btn-primary"
              onClick={handleCopyLink}
              style={{ minWidth: '130px' }}
            >
              {copiedLink ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* How to Connect 2+ Devices Guide */}
        <div 
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 18px',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} style={{ color: 'var(--color-cyan)' }} />
            <span>How to test with Multiple Devices right now:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Option A: Phone on same Wi-Fi */}
            <div 
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600 }}>
                <Smartphone size={16} style={{ color: 'var(--color-primary-light)' }} />
                <span>On your Mobile Phone:</span>
              </div>
              <ol style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Make sure your phone is connected to the same Wi-Fi.</li>
                <li>In your laptop terminal, run: <code style={{ color: 'var(--color-emerald-light)' }}>npm run dev:host</code></li>
                <li>Open the Network URL shown in the terminal (or paste the copied link).</li>
                <li>Your phone gets its own EVM identity automatically!</li>
              </ol>
            </div>

            {/* Option B: Second browser tab / Incognito */}
            <div 
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600 }}>
                <Laptop size={16} style={{ color: 'var(--color-cyan)' }} />
                <span>Instant Multi-Tab Test:</span>
              </div>
              <ol style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Open an <strong>Incognito window</strong> or a second browser (Safari / Firefox).</li>
                <li>Paste the invite link above into that window.</li>
                <li>Add an expense on one tab — listen to the chime and watch the verification pop-up on the other tab!</li>
                <li>Cast votes to seal the block live.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Your Current Device Identity */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{activePersona?.avatar || '👤'}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                This Device: {activePersona?.name || 'Device'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                PIN: {activePersona?.pin || '1234'} • Wallet: {activePersona?.address?.substring(0, 10)}...
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
