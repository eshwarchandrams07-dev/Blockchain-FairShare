import React, { useState } from 'react';
import { 
  KeyRound, 
  Lock, 
  Hash, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  X, 
  ShieldCheck
} from 'lucide-react';

export default function EnterLedgerModal({
  isOpen,
  onClose,
  onEnterLedger,
  _groups = []
}) {
  const [ledgerId, setLedgerId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = ledgerId.trim().toUpperCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg('Please enter the Private Ledger ID (e.g. APT-402).');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Please enter the Security Password for this private ledger.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        const res = await onEnterLedger(cleanId, cleanPass, displayName.trim());
        setIsSubmitting(false);

        if (res && res.pending) {
          setErrorMsg(res.message || 'Connecting to cloud database & network peers to synchronize private ledger...');
        } else if (res && !res.success) {
          setErrorMsg(res.error || 'Incorrect Ledger ID or Password. Access denied.');
        } else if (res && res.success) {
          onClose();
        }
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg('Error verifying credentials: ' + (err.message || 'Unknown network error'));
      }
    }, 150);
  };



  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
              }}
            >
              <KeyRound size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0 }}>
                  Enter Private Ledger
                </h3>
                <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                  🔒 2FA Verification
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Access decentralized ledger with Private Ledger ID & Password
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Informational Callout */}
        <div 
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--text-main)',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <ShieldCheck size={18} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            If a host or peer shared a <strong>Private Ledger ID</strong> and <strong>Security Password</strong> with you, enter them below to decrypt and enter that ledger on this device.
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div 
            className="private-gate-error"
            style={{ marginBottom: '16px' }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          {/* Field 1: Private Ledger ID */}
          <div style={{ marginBottom: '14px', textAlign: 'left' }}>
            <label 
              className="form-label" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={14} style={{ color: 'var(--color-primary-light)' }} />
                <span>Private Ledger ID *</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>e.g. APT-402, GOA-2026</span>
            </label>
            <input 
              type="text"
              value={ledgerId}
              onChange={(e) => {
                setLedgerId(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder="e.g. APT-402"
              className="form-input mono"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
              autoFocus
            />
          </div>

          {/* Field 2: Security Password */}
          <div style={{ marginBottom: '14px', textAlign: 'left' }}>
            <label 
              className="form-label" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} style={{ color: 'var(--color-amber)' }} />
                <span>Security Password *</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </label>
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Enter security password"
              className="form-input mono"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: showPassword ? '1px' : '3px'
              }}
            />
          </div>

          {/* Field 3: Device / Member Name */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label 
              className="form-label" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--color-cyan)' }} />
                <span>Device / Member Name (Optional)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-assigned if empty</span>
            </label>
            <input 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sam's iPhone, Priya"
              className="form-input"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Confidentiality Notice */}
          <div 
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left'
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
            <span>Private ledgers are hidden from the public groups list. You must provide the exact Ledger ID and Password to view or join.</span>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '170px', gap: '8px', justifyContent: 'center' }}
            >
              <KeyRound size={16} />
              <span>{isSubmitting ? 'Verifying...' : 'Unlock & Enter Ledger'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
