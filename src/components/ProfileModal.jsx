import React, { useState } from 'react';
import { 
  X, 
  User, 
  Wallet, 
  Sparkles, 
  Check, 
  Copy,
  LogOut
} from 'lucide-react';

const AVATAR_OPTIONS = ['🧑‍💻', '👩‍💼', '👨‍💻', '👩‍🎨', '👑', '🦁', '⚡', '💎', '🌟', '🎯'];

export default function ProfileModal(props) {
  if (!props.isOpen) return null;
  return <ProfileModalContent {...props} />;
}

function ProfileModalContent({
  onClose,
  currentProfile,
  currentUser,
  onSaveProfile,
  onConnectMetaMask,
  isMetaMaskConnected,
  onLogout,
}) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || '👤');
  const [pin, setPin] = useState(currentProfile?.pin || '1234');
  const [upiId, setUpiId] = useState(currentProfile?.upiId || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopyAddress = () => {
    if (currentProfile?.address) {
      navigator.clipboard.writeText(currentProfile.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!pin || pin.length < 4) {
      setError('Please choose a 4-digit security PIN for signing consensus votes.');
      return;
    }

    onSaveProfile({
      name: name.trim(),
      avatar,
      pin: pin.trim(),
      upiId: upiId.trim() || undefined,
    });

    onClose();
  };

  const userEmail = currentUser?.email || currentProfile?.email;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '90%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'rgba(99, 102, 241, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-primary-light)'
            }}>
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Account & Identity</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Google authenticated Web3 profile on FairShare
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Google Authentication Card */}
        {userEmail && (
          <div style={{
            margin: '16px 0 6px 0',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(66, 133, 244, 0.06)',
            border: '1px solid rgba(66, 133, 244, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                flexShrink: 0
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                  {userEmail}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Google Verified • Vercel Cloud Synced
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '11px',
                  padding: '5px 10px',
                  color: '#dc2626',
                  borderColor: 'rgba(220, 38, 38, 0.3)',
                  gap: '4px'
                }}
                title="Sign out or switch to another Google account"
              >
                <LogOut size={12} />
                <span>Switch / Sign Out</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '14px 0 0 0' }}>
          {error && (
            <div style={{ 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid rgba(244, 63, 94, 0.4)', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              fontSize: '13px', 
              color: 'var(--color-rose)', 
              marginBottom: '16px',
              fontWeight: 600
            }}>
              {error}
            </div>
          )}

          {/* Avatar Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Choose Your Avatar
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  style={{
                    fontSize: '22px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: avatar === emoji ? 'var(--palette-clay)' : 'var(--bg-canvas)',
                    border: avatar === emoji ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Display Name Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-muted)' }}>
              Your Display Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex, Rahul, Roommate 1..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                style={{ width: '100%', padding: '12px 14px' }}
                autoFocus
              />
            </div>
          </div>

          {/* Security PIN */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Security Signature PIN (4 Digits)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-amber)', fontWeight: 600 }}>
                Used to sign votes on this device
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input mono"
                placeholder="1234"
                value={pin}
                onChange={e => setPin(e.target.value)}
                maxLength={8}
                style={{ width: '100%', padding: '12px 14px', letterSpacing: '4px', fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Receiving UPI ID for Real Payments */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Your Receiving UPI ID / VPA
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 600 }}>
                For GPay / PhonePe settlements
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input mono"
                placeholder="e.g. rahul@oksbi or yourname@paytm"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                maxLength={45}
                style={{ width: '100%', padding: '12px 14px', fontSize: '14px' }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Roommates scanning your settlement QR code will send money directly to this UPI address.
            </div>
          </div>

          {/* Wallet Address Information */}
          <div style={{ 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: '12px', 
            padding: '14px', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={14} />
                <span>Device EVM Address</span>
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: copied ? 'var(--color-emerald-light)' : 'var(--text-muted)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="mono" style={{ fontSize: '12px', color: 'var(--text-main)', wordBreak: 'break-all' }}>
              {currentProfile?.address}
            </div>

            {!isMetaMaskConnected && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Have MetaMask installed?
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    onConnectMetaMask();
                    onClose();
                  }}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  <Sparkles size={12} />
                  <span>Bind MetaMask</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
