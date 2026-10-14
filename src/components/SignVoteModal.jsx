import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lock,
  Zap
} from 'lucide-react';
import { formatCents, shortenAddress } from '../utils/cryptoUtils';
import { blockchainService } from '../services/blockchainState';

export default function SignVoteModal(props) {
  if (!props.isOpen || !props.expense || !props.voter) return null;
  return <SignVoteModalContent {...props} />;
}

function SignVoteModalContent({
  onClose,
  expense,
  voter,
  initialAgreed = true,
  onConfirmVote,
}) {
  const [agreed, setAgreed] = useState(initialAgreed !== undefined ? initialAgreed : true);
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Normalize voter address (handles both voter.address and voter.participant)
  const voterAddress = voter?.address || voter?.participant || '';
  
  // Lookup device profile or member
  const myProfile = blockchainService.getMyProfile();
  const isMyDevice = Boolean(
    voterAddress && 
    myProfile?.address && 
    voterAddress.toLowerCase() === myProfile.address.toLowerCase()
  );
  const expectedPin = isMyDevice ? (myProfile?.pin || '1234') : (voter?.pin || '1234');
  const voterName = isMyDevice ? (myProfile?.name || 'User') : (voter?.name || shortenAddress(voterAddress));
  const voterAvatar = isMyDevice ? (myProfile?.avatar || '👤') : (voter?.avatar || '👤');

  // Safe lookup for share amount
  const shareObj = (expense?.shares || []).find(s => 
    s?.participant && 
    voterAddress && 
    s.participant.toLowerCase() === voterAddress.toLowerCase()
  );
  const shareAmount = shareObj ? shareObj.amount : (voter?.amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!voterAddress) {
      setError('Invalid voter account address.');
      return;
    }

    if (!isMyDevice) {
      setError(`Device Security: This device can only sign consensus votes for its own user account (${myProfile.name}). Each device has only one user.`);
      return;
    }

    if (!pin.trim()) {
      setError('Please enter your 4-digit security PIN to sign.');
      return;
    }

    if (!agreed && !reason.trim()) {
      setError('Please provide a reason for rejecting this payment.');
      return;
    }

    try {
      onConfirmVote({
        groupId: expense.groupId,
        expenseId: expense.id,
        voterAddress: voterAddress,
        pin: pin.trim(),
        agreed,
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Signature verification failed.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} style={{ color: 'var(--color-primary-light)' }} />
            <span>Cryptographic Consensus Signature</span>
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Anti-Cheat Notice */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-main)' }}>
          🛡️ <strong style={{ color: 'var(--color-primary)' }}>Anti-Cheat Protection:</strong> In FairShare, no user can secretly sign or vote on another roommate's behalf. Your vote requires your private security PIN to generate a verifiable ECDSA signature.
        </div>

        {/* Signing Persona & Expense Summary */}
        <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>{voterAvatar}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{voterName}</div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {shortenAddress(voterAddress)}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Your Allocated Share</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-emerald-light)' }}>
                {formatCents(shareAmount)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
            Expense #{expense.id}: <strong>{expense.title}</strong> (Total: {formatCents(expense.totalAmount)})
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Decision Choice: Agree vs Reject */}
          <div className="form-group">
            <label className="form-label">Your Determination</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${agreed ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setAgreed(true)}
              >
                <CheckCircle2 size={16} />
                <span>Agree to Share</span>
              </button>
              <button
                type="button"
                className={`btn ${!agreed ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setAgreed(false)}
              >
                <XCircle size={16} />
                <span>Reject & Object</span>
              </button>
            </div>
          </div>

          {/* Reason for rejection if rejecting */}
          {!agreed && (
            <div className="form-group">
              <label className="form-label">Reason for Objection (Recorded on Ledger)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Incorrect share split, was not present, or already paid cash"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>
          )}

          {/* 4-Digit Security PIN Input */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Enter Secret Security PIN
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  PIN for {voterName.split(' ')[0]}:
                </span>
                <button
                  type="button"
                  onClick={() => setPin(expectedPin)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Click to automatically fill demo PIN"
                >
                  <Zap size={11} />
                  <span>Use {expectedPin}</span>
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                maxLength="6"
                className="form-input mono"
                style={{ paddingLeft: '38px', fontSize: '16px', letterSpacing: '0.2em' }}
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Simulates Web3 wallet private key signature authorization.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={agreed ? "btn btn-primary" : "btn btn-danger"}
            >
              <ShieldCheck size={16} />
              <span>{agreed ? 'Sign Agreement' : 'Sign Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
