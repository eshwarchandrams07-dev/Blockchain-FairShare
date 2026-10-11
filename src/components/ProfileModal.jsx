import React, { useState } from 'react';
import { 
  X, 
  User, 
  Wallet, 
  Sparkles, 
  Check, 
  Copy
} from 'lucide-react';

const AVATAR_OPTIONS = ['🧑‍💻', '👩‍💻', '👤', '👨‍🎨', '👩‍🔬', '👨‍🚀', '🦁', '🦊', '⚡', '💎', '🌟', '🎯'];

export default function ProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  onConnectMetaMask,
  isMetaMaskConnected,
}) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || '👤');
  const [pin, setPin] = useState(currentProfile?.pin || '1234');
  const [upiId, setUpiId] = useState(currentProfile?.upiId || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Your Device Identity</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Customize your name and signature PIN for this device
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 0 0 0' }}>
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
