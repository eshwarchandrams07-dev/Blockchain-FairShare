import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  AlertTriangle
} from 'lucide-react';
import { formatCents, shortenAddress } from '../utils/cryptoUtils';
import { POLICY_LABELS } from '../services/blockchainState';

export default function ConsensusBlock({
  expense,
  currentGroup,
  currentAccount,
  onOpenSignModal,
}) {
  if (!expense) return null;

  const votes = expense.votes || (expense.shares || []).map(s => {
    const isPayer = Boolean(
      s?.participant && 
      expense?.payer && 
      s.participant.toLowerCase() === expense.payer.toLowerCase()
    );
    return {
      participant: s?.participant || '',
      name: s?.name || 'Member',
      amount: s?.amount || 0,
      status: isPayer ? 'AGREED' : 'PENDING',
      reason: isPayer ? 'Payer submission' : '',
      signature: isPayer ? expense.receiptHash : null,
      timestamp: expense.createdAt,
      pinVerified: true,
    };
  });

  const totalParticipants = votes.length;
  const agreedCount = votes.filter(v => v.status === 'AGREED').length;
  const pendingCount = votes.filter(v => v.status === 'PENDING').length;

  const isSealed = expense.status === 1; // APPROVED
  const isRejected = expense.status === 2; // REJECTED
  const isDisputed = expense.status === 3; // DISPUTED
  const isPending = expense.status === 0; // PENDING_APPROVAL

  const quorumPercentage = Math.round((agreedCount / totalParticipants) * 100);

  // Status Badge details
  let blockBadge = { text: 'Awaiting Quorum', class: 'badge-pending', icon: Clock };
  if (isSealed) blockBadge = { text: 'Consensus Block Sealed', class: 'badge-approved', icon: ShieldCheck };
  if (isRejected) blockBadge = { text: 'Consensus Block Rejected', class: 'badge-rejected', icon: XCircle };
  if (isDisputed) blockBadge = { text: 'Consensus Block Contested', class: 'badge-disputed', icon: AlertTriangle };

  const BadgeIcon = blockBadge.icon;

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '20px', 
        border: isSealed 
          ? '1px solid rgba(16, 185, 129, 0.35)' 
          : isRejected || isDisputed 
          ? '1px solid rgba(244, 63, 94, 0.35)' 
          : '1px solid rgba(99, 102, 241, 0.35)',
        background: 'var(--bg-surface)',
        marginBottom: '16px'
      }}
    >
      {/* Block Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)' }}>
            <Fingerprint size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Consensus Block #{expense.id}</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                ({expense.title})
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Payer: {expense.payerName} • Total Amount: <strong>{formatCents(expense.totalAmount)}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${blockBadge.class}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
            <BadgeIcon size={14} />
            <span>{blockBadge.text}</span>
          </span>
        </div>
      </div>

      {/* Quorum Progress Bar */}
      <div style={{ marginBottom: '18px', background: 'var(--bg-surface-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Consensus Progress: <strong>{agreedCount} of {totalParticipants} agreed ({quorumPercentage}%)</strong>
          </span>
          <span style={{ color: 'var(--text-dim)' }}>
            Policy: {POLICY_LABELS[currentGroup?.approvalPolicy ?? 0] || 'Majority Vote'}
          </span>
        </div>

        {/* Progress meter */}
        <div style={{ height: '8px', background: 'var(--bg-canvas)', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${quorumPercentage}%`, 
              background: isSealed ? 'var(--grad-success)' : isRejected ? 'var(--grad-danger)' : 'var(--grad-primary)',
              transition: 'width 0.4s ease'
            }} 
          />
        </div>
      </div>

      {/* Participant Consensus Roster Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        {votes.map((v) => {
          const isCurrentActiveUser = Boolean(
            v?.participant && 
            currentAccount && 
            v.participant.toLowerCase() === currentAccount.toLowerCase()
          );
          const isAgreed = v.status === 'AGREED';
          const isRejectedVote = v.status === 'REJECTED';
          const isPendingVote = v.status === 'PENDING';

          return (
            <div 
              key={v.participant}
              style={{
                background: isCurrentActiveUser ? 'var(--bg-surface-elevated)' : 'var(--bg-canvas)',
                border: isAgreed 
                  ? '1px solid rgba(16, 185, 129, 0.4)' 
                  : isRejectedVote 
                  ? '1px solid rgba(244, 63, 94, 0.4)' 
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{v.name}</span>
                      {isCurrentActiveUser && <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>YOU</span>}
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {shortenAddress(v.participant)}
                    </div>
                  </div>
                </div>

                <div className="mono" style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-emerald-light)' }}>
                  {formatCents(v.amount)}
                </div>
              </div>

              {/* Status & Signature Proof */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  {isAgreed && (
                    <span className="badge badge-approved" style={{ fontSize: '10px' }}>
                      <CheckCircle2 size={11} />
                      <span>Agreed & Signed</span>
                    </span>
                  )}
                  {isRejectedVote && (
                    <span className="badge badge-rejected" style={{ fontSize: '10px' }}>
                      <XCircle size={11} />
                      <span>Rejected</span>
                    </span>
                  )}
                  {isPendingVote && (
                    <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                      <Clock size={11} />
                      <span>Pending Decision</span>
                    </span>
                  )}
                </div>

                {v.signature && (
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--color-cyan)', title: `ECDSA Signature: ${v.signature}` }}>
                    Sig: {shortenAddress(v.signature)}
                  </span>
                )}
              </div>

              {/* Objection Reason if Rejected */}
              {isRejectedVote && v.reason && (
                <div style={{ fontSize: '11px', color: 'var(--color-rose)', background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244,63,94,0.3)', padding: '6px 10px', borderRadius: '4px' }}>
                  <strong>Objection:</strong> "{v.reason}"
                </div>
              )}

              {/* Interactive Action Buttons for active user */}
              {isPendingVote && isCurrentActiveUser && isPending && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button 
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '12px' }}
                    onClick={() => onOpenSignModal && onOpenSignModal({ expense, voter: { ...v, address: v.participant }, initialAgreed: true })}
                    title="Enter your secret PIN to sign agreement to this payment"
                  >
                    <CheckCircle2 size={13} />
                    <span>Agree (Sign)</span>
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    style={{ flex: 1, padding: '5px 8px', fontSize: '12px' }}
                    onClick={() => onOpenSignModal && onOpenSignModal({ expense, voter: { ...v, address: v.participant }, initialAgreed: false })}
                    title="Enter objection reason and PIN to reject this payment"
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {/* Other pending participants: votes can only be signed from that member's device */}
              {isPendingVote && !isCurrentActiveUser && isPending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)', background: 'var(--bg-canvas)', padding: '4px 8px', borderRadius: '4px' }}>
                  <Clock size={12} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
                  <span>Awaiting signature from {v.name}'s device</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Anti-Cheat Guarantee Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-dim)', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={13} style={{ color: 'var(--color-primary)' }} />
          <span>Anti-Cheat Protection: Votes require ECDSA cryptographic authentication with user's secret PIN.</span>
        </div>

        {isSealed ? (
          <span style={{ color: 'var(--color-emerald-light)', fontWeight: 600 }}>
            ✓ Block Sealed & Balances Applied
          </span>
        ) : (
          <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
            ⏳ Awaiting {pendingCount} participant signature{pendingCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
