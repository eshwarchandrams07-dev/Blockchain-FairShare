import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  QrCode, 
  ArrowRight, 
  PlusCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Hash, 
  User 
} from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

export default function PrivateGroupGate({
  currentGroup,
  groups = [],
  onUnlock,
  onOpenCreateGroup,
  onCreateGroup,
  onSelectGroup
}) {
  const [ledgerIdInput, setLedgerIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state for creating a new group while locked
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const matchingGroup = (groups || []).find(g => {
    if (!g.ledgerId) return false;
    const gClean = g.ledgerId.trim().toUpperCase();
    const inputClean = ledgerIdInput.trim().toUpperCase();
    return gClean === inputClean || gClean.replace(/[^A-Z0-9]/g, '') === inputClean.replace(/[^A-Z0-9]/g, '');
  }) || currentGroup;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = ledgerIdInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim();

    if (!cleanId) {
      setErrorMsg('Please enter the Private Ledger ID.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Please enter the Security Password for this private ledger.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        const res = await onUnlock(
          matchingGroup?.id || currentGroup?.id,
          cleanPass,
          cleanId,
          displayNameInput.trim()
        );
        setIsSubmitting(false);

        if (res && res.pending) {
          setErrorMsg(res.message || 'Connecting to cloud database & peer host to synchronize private ledger...');
        } else if (res && !res.success) {
          setErrorMsg(res.error || 'Incorrect Ledger ID or Password. Access denied.');
        }
      } catch (err) {
        setIsSubmitting(false);
        setErrorMsg('Error: ' + (err.message || 'Unknown network error'));
      }
    }, 150);
  };



  return (
    <div className="private-gate-container">
      <div className="private-gate-card">
        {/* Glowing Shield Icon Header */}
        <div className="private-gate-icon-wrapper">
          <div className="private-gate-icon-pulse"></div>
          <div className="private-gate-icon">
            <Lock size={32} />
          </div>
        </div>

        <div className="private-gate-header">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-pending">
              🔒 Private Consensus Block
            </span>
            <span className="badge badge-neutral mono">
              ID: {targetLedgerId}
            </span>
          </div>
          <h2 className="private-gate-title">
            🔒 {targetGroupName}
          </h2>
          <p className="private-gate-subtitle">
            This decentralized sovereign vault is protected by 2-Factor Authentication (Ledger ID + Security Password). 
            Devices added via QR code or link must enter the correct credentials set at creation.
          </p>
        </div>

        {errorMsg && (
          <div className="private-gate-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2FA Form: Ledger ID + Security Password + Optional Device Name */}
        <form onSubmit={handleSubmit} className="private-gate-form">
          {/* Field 1: Ledger ID */}
          <div style={{ marginBottom: '14px', textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Hash size={14} style={{ color: 'var(--color-primary-light)' }} />
              <span>Ledger Access ID *</span>
            </label>
            <input 
              type="text"
              value={ledgerIdInput}
              onChange={(e) => {
                setLedgerIdInput(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder={`e.g. ${targetLedgerId}`}
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
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} style={{ color: 'var(--color-amber)' }} />
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
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Enter security password set at creation"
              className="form-input mono"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: showPassword ? '1px' : '3px'
              }}
            />
          </div>

          {/* Field 3: Optional Device Display Name */}
          <div style={{ marginBottom: '18px', textAlign: 'left' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--color-cyan)' }} />
                <span>Device / Member Name (Optional)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-assigned if empty</span>
            </label>
            <input 
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Sam's iPhone, Priya"
              className="form-input"
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', height: '42px', fontSize: '14px', gap: '8px', justifyContent: 'center' }}
          >
            <span>{isSubmitting ? 'Verifying 2FA Credentials...' : 'Verify & Unlock Ledger'}</span>
            <ArrowRight size={16} />
          </button>
        </form>



        {/* Alternative: QR Code instruction */}
        <div className="private-gate-alt-box" style={{ marginTop: '16px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700, fontSize: '13px' }}>
            <QrCode size={16} style={{ color: 'var(--color-emerald)' }} />
            <span>Adding from Another Device via QR Code?</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Scan the QR code shown under <strong>"Connect Devices"</strong> or <strong>"QR Code & Invite"</strong> from the host screen. To prevent unauthorized outsiders from joining, your device verifies the correct Ledger ID and Password before entering.
          </div>
        </div>

        {/* Options to Switch Group or Create New Group */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (onOpenCreateGroup) {
                onOpenCreateGroup();
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            style={{ gap: '6px' }}
          >
            <PlusCircle size={14} />
            <span>Deploy New Ledger</span>
          </button>

          {groups && groups.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Switch:</span>
              <select 
                value={currentGroup?.id || ''} 
                onChange={(e) => onSelectGroup && onSelectGroup(Number(e.target.value))}
                className="form-input"
                style={{ height: '30px', fontSize: '11px', padding: '2px 8px', width: 'auto' }}
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    #{g.id} {(g.name || '').split('•')[0].trim()} {g.isPrivate ? '(🔒)' : '(🌐)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Create New Group Modal inside Gate */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={(data) => {
          onCreateGroup(data);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
