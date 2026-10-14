import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Copy, 
  Check, 
  X, 
  Radio, 
  Sparkles,
  QrCode,
  Lock,
  Globe,
  KeyRound,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import { fetchDetectedLanIp, saveLanIp, getEffectiveHost } from '../utils/networkUtils';

export default function ConnectDevicesModal({
  isOpen,
  onClose,
  groupId = 1,
  groupName = 'Ledger',
  inviteCode = 'FS-4020',
  currentGroup,
  activePersona
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showIpEdit, setShowIpEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strict2FaMode, setStrict2FaMode] = useState(false); // false = embed pass for 1-tap, true = prompt phone to type pass

  // Compute origin and mobile URL
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const [lanIp, setLanIp] = useState(isLocalhost ? '' : currentHost);
  const hasFetchedIp = React.useRef(false);

  // Auto-detect LAN IP when modal opens
  useEffect(() => {
    if (isOpen && isLocalhost && !hasFetchedIp.current) {
      hasFetchedIp.current = true;
      fetchDetectedLanIp().then(ip => {
        if (ip && ip !== 'localhost') {
          setLanIp(ip);
        }
      });
    }
  }, [isOpen, isLocalhost]);

  if (!isOpen) return null;

  const isPrivate = currentGroup?.isPrivate !== false;
  const ledgerId = currentGroup?.ledgerId || 'APT-402';
  const password = currentGroup?.password || currentGroup?.inviteCode || inviteCode || 'FS-4020';

  const effectiveHost = getEffectiveHost(lanIp);
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  let mobileJoinUrl = '';
  if (!isPrivate) {
    // Public group: open join without credentials
    mobileJoinUrl = `${protocol}//${effectiveHost}/?joinGroup=${groupId}`;
  } else if (strict2FaMode) {
    // Strict 2FA mode: only pass group ID and ledger ID; phone must enter password
    mobileJoinUrl = `${protocol}//${effectiveHost}/?joinGroup=${groupId}&ledgerId=${encodeURIComponent(ledgerId)}`;
  } else {
    // 1-Tap quick mode: embeds both ID and Password
    mobileJoinUrl = `${protocol}//${effectiveHost}/?joinGroup=${groupId}&ledgerId=${encodeURIComponent(ledgerId)}&key=${encodeURIComponent(password)}`;
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(mobileJoinUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(ledgerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyPass = () => {
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
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
                background: isPrivate ? 'var(--grad-primary)' : 'var(--grad-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0 }}>
                  Add Device via QR Code / Link
                </h3>
                <span className={`badge ${isPrivate ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '10px' }}>
                  {isPrivate ? '🔒 Private 2FA' : '🌐 Public Audit'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                {groupName} • Group #{groupId}
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

        {/* Mode Selector for Private Ledgers */}
        {isPrivate ? (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              marginBottom: '16px',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} style={{ color: 'var(--color-primary-light)' }} />
              <span>QR Security Mode:</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${!strict2FaMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStrict2FaMode(false)}
                style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                title="Embeds password into link for 1-tap testing"
              >
                ⚡ 1-Tap Quick QR
              </button>
              <button
                type="button"
                className={`btn btn-sm ${strict2FaMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStrict2FaMode(true)}
                style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                title="Phone scanning must manually enter password for strict security"
              >
                🛡️ Strict 2FA (Enter Password)
              </button>
            </div>
          </div>
        ) : (
          <div 
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--color-emerald-light)'
            }}
          >
            <Globe size={16} />
            <span><strong>Public Transparency Ledger:</strong> Anyone can scan or click the link to inspect expenses and balances freely without requiring a password.</span>
          </div>
        )}

        {/* SCAN-TO-JOIN QR CODE HERO CONTAINER */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 116, 144, 0.08) 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '16px',
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
                background: strict2FaMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(21, 128, 61, 0.15)',
                color: strict2FaMode ? 'var(--color-amber)' : 'var(--color-emerald)',
                border: strict2FaMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(21, 128, 61, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700
              }}
            >
              {strict2FaMode ? 'Password Required on Phone' : '1-Tap Fast Pair'}
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
              marginBottom: '12px',
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

          <div style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px', maxWidth: '520px', wordBreak: 'break-all' }}>
            Opens: <code className="mono" style={{ color: 'var(--color-primary-light)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '4px' }}>{mobileJoinUrl}</code>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
            No app store download needed. Opens in Safari or Chrome on iPhone/Android and assigns a cryptographic wallet identity.
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
                    onChange={e => { const v = e.target.value.trim(); setLanIp(v); saveLanIp(v); }}
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

        {/* 2-Factor Credentials Display for Private Ledgers */}
        {isPrivate && (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            {/* Credential 1: Ledger ID */}
            <div 
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hash size={13} style={{ color: 'var(--color-primary-light)' }} />
                  <span>Ledger Access ID</span>
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyId}
                  style={{ height: '24px', fontSize: '10px', padding: '0 6px' }}
                >
                  {copiedId ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div 
                className="mono"
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--color-primary-light)',
                  letterSpacing: '1px'
                }}
              >
                {ledgerId}
              </div>
            </div>

            {/* Credential 2: Security Password */}
            <div 
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <KeyRound size={13} style={{ color: 'var(--color-amber)' }} />
                  <span>Security Password</span>
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '11px'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyPass}
                    style={{ height: '24px', fontSize: '10px', padding: '0 6px' }}
                  >
                    {copiedPass ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <div 
                className="mono"
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--color-amber)',
                  letterSpacing: showPassword ? '1px' : '2px'
                }}
              >
                {showPassword ? password : '••••••••'}
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Group Invite Link Box */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--color-primary-light)' }} />
            <span>Copy Direct Link for Peer Device (Group #{groupId})</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              readOnly 
              value={mobileJoinUrl} 
              className="form-input mono"
              style={{ fontSize: '12px', background: 'var(--bg-surface)' }}
              onClick={e => e.target.select()}
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
            padding: '14px 16px',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} style={{ color: 'var(--color-cyan)' }} />
            <span>How to test adding from a different device right now:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Option A: Phone on same Wi-Fi */}
            <div 
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>
                <Smartphone size={15} style={{ color: 'var(--color-primary-light)' }} />
                <span>On your Mobile Phone:</span>
              </div>
              <ol style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '16px', margin: 0, lineHeight: 1.5 }}>
                <li>Connect your phone to the same Wi-Fi as your laptop.</li>
                <li>Point your phone camera at the QR code above.</li>
                <li>{isPrivate ? 'Enter the Ledger ID & Password on your phone.' : 'Tap to open the live public ledger instantly!'}</li>
                <li>Your phone gets its own cryptographic identity!</li>
              </ol>
            </div>

            {/* Option B: Second browser tab / Incognito */}
            <div 
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 600, fontSize: '12px' }}>
                <Laptop size={15} style={{ color: 'var(--color-cyan)' }} />
                <span>Instant Multi-Tab / Incognito Test:</span>
              </div>
              <ol style={{ fontSize: '11px', color: 'var(--text-muted)', paddingLeft: '16px', margin: 0, lineHeight: 1.5 }}>
                <li>Open an <strong>Incognito window</strong> or Safari/Firefox.</li>
                <li>Paste the copied invite link into that window.</li>
                <li>{isPrivate ? 'Enter the ID & Password to authenticate.' : 'Inspect the public records instantly.'}</li>
                <li>Add expenses or vote to see real-time peer syncing!</li>
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
            padding: '10px 14px',
            fontSize: '12px'
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
