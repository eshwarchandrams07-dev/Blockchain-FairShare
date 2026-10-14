import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  FileCheck2, 
  Edit3, 
  Search, 
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { formatCents, shortenAddress } from '../utils/cryptoUtils';
import { STATUS_LABELS, EXPENSE_STATUS } from '../services/blockchainState';
import ConsensusBlock from './ConsensusBlock';

export default function ExpenseList({
  expenses,
  currentGroup,
  currentAccount,
  onOpenDispute,
  onOpenResolveDispute,
  onOpenCorrection,
  onInspectReceipt,
  onOpenSignModal,
}) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState({}); // expenseId => boolean

  const toggleConsensusBlock = (id) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter expenses for current group
  const groupExpenses = expenses.filter(e => e.groupId === currentGroup.id);

  // Apply status filter
  const filteredByStatus = groupExpenses.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return e.status === EXPENSE_STATUS.PENDING_APPROVAL;
    if (filter === 'APPROVED') return e.status === EXPENSE_STATUS.APPROVED;
    if (filter === 'DISPUTED') return e.status === EXPENSE_STATUS.DISPUTED;
    if (filter === 'CORRECTED') return e.status === EXPENSE_STATUS.CORRECTED;
    return true;
  });

  // Apply search query
  const displayedExpenses = filteredByStatus.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.payerName.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  // Counts for pills
  const pendingCount = groupExpenses.filter(e => e.status === EXPENSE_STATUS.PENDING_APPROVAL).length;
  const disputedCount = groupExpenses.filter(e => e.status === EXPENSE_STATUS.DISPUTED).length;

  const currentMember = (currentGroup?.members || []).find(m => m && m.address && currentAccount && m.address.toLowerCase() === currentAccount.toLowerCase());
  const isAdmin = currentMember?.role === 'ADMIN';

  return (
    <div>
      {/* Filter and Search Bar */}
      <div className="expenses-filter-bar">
        <div className="filter-pills">
          <button 
            className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All ({groupExpenses.length})
          </button>
          <button 
            className={`filter-pill ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button 
            className={`filter-pill ${filter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setFilter('APPROVED')}
          >
            Approved
          </button>
          <button 
            className={`filter-pill ${filter === 'DISPUTED' ? 'active' : ''}`}
            onClick={() => setFilter('DISPUTED')}
          >
            Disputed {disputedCount > 0 && `(${disputedCount})`}
          </button>
          <button 
            className={`filter-pill ${filter === 'CORRECTED' ? 'active' : ''}`}
            onClick={() => setFilter('CORRECTED')}
          >
            Corrected
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '13px' }}
            placeholder="Search expenses, tags, payers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Expenses Cards */}
      {displayedExpenses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <FileText size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '18px', marginBottom: '6px' }}>No expenses found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {searchQuery ? 'Try adjusting your search criteria' : 'Submit a new expense to get started with transparent splitting.'}
          </p>
        </div>
      ) : (
        displayedExpenses.map(exp => {
          const isPayer = (exp.payer || '').toLowerCase() === (currentAccount || '').toLowerCase();
          const isPending = exp.status === EXPENSE_STATUS.PENDING_APPROVAL;
          const isApproved = exp.status === EXPENSE_STATUS.APPROVED;
          const isDisputed = exp.status === EXPENSE_STATUS.DISPUTED;
          const isCorrected = exp.status === EXPENSE_STATUS.CORRECTED;
          const myVote = exp.votes?.find(v => (v?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
          const myShare = exp.shares?.find(s => (s?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
          const canVote = isPending && myShare && (!myVote || myVote.status === 'PENDING');

          // Status Badge Class
          let statusBadgeClass = 'badge-pending';
          if (isApproved) statusBadgeClass = 'badge-approved';
          if (isDisputed) statusBadgeClass = 'badge-disputed';
          if (isCorrected) statusBadgeClass = 'badge-corrected';
          if (exp.status === EXPENSE_STATUS.REJECTED) statusBadgeClass = 'badge-rejected';

          return (
            <div key={exp.id} className="glass-panel expense-card">
              {/* Header */}
              <div className="expense-header">
                <div className="expense-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
                      #{exp.id}
                    </span>
                    <span className={`badge ${statusBadgeClass}`}>
                      {STATUS_LABELS[exp.status]}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {exp.category}
                    </span>
                    {exp.previousExpenseId > 0 && (
                      <span className="badge badge-corrected" style={{ fontSize: '11px' }}>
                        Linked to #{exp.previousExpenseId}
                      </span>
                    )}
                  </div>

                  <h4>{exp.title}</h4>

                  <div className="expense-meta">
                    <span>
                      Paid by <strong>{exp.payerName}</strong> ({shortenAddress(exp.payer)})
                    </span>
                    <span>•</span>
                    <span>{new Date(exp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="expense-amount-box">
                  <div className="expense-amount">{formatCents(exp.totalAmount)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    {exp.shares.length} participants
                  </div>
                </div>
              </div>

              {/* Shares Breakdown */}
              <div className="expense-shares-list">
                {(exp.shares || []).map(s => {
                  const isCurrent = Boolean(s?.participant && currentAccount && s.participant.toLowerCase() === currentAccount.toLowerCase());
                  return (
                    <div key={s.participant} className="share-item">
                      <span className="share-participant">
                        {s.name} {isCurrent && '(You)'}
                      </span>
                      <span className="share-amount mono">{formatCents(s.amount)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {exp.notes && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-canvas)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Notes:</strong> {exp.notes}
                </div>
              )}

              {/* Dispute Warning Box */}
              {isDisputed && (
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(126, 34, 206, 0.35)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-purple)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    <AlertTriangle size={16} />
                    <span>Active Dispute Pending Arbitration</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '4px 0' }}>
                    {exp.disputeReason}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Balance effect suspended until admin resolves.
                  </p>
                </div>
              )}

              {/* Correction Audit Link Box */}
              {isCorrected && (
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(14, 116, 144, 0.35)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 500 }}>
                    ℹ️ <strong style={{ color: 'var(--text-main)' }}>Immutable Audit Trail:</strong> This expense was revised via an on-chain correction. The original record remains preserved for auditing.
                    {exp.correctionReason && <span style={{ color: 'var(--text-main)' }}> Reason: "{exp.correctionReason}"</span>}
                  </div>
                </div>
              )}

              {/* Footer / Actions */}
              <div className="expense-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Receipt Proof button */}
                  {exp.receiptHash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onInspectReceipt(exp)}
                        title="Inspect SHA-256 cryptographic document hash and IPFS CID on chain"
                      >
                        <FileCheck2 size={14} style={{ color: 'var(--color-cyan)' }} />
                        <span>Receipt</span>
                      </button>
                      {exp.isPinnedLive && (
                        <span 
                          className="badge badge-approved" 
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                          title="Pinned to Pinata Cloud IPFS"
                        >
                          IPFS ⚡
                        </span>
                      )}
                    </div>
                  )}

                  {/* Consensus Block Toggle Button */}
                  <button
                    className={`btn btn-sm ${expandedBlocks[exp.id] ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toggleConsensusBlock(exp.id)}
                    title="Inspect participant agreement block, PIN signatures, and quorum"
                  >
                    <Fingerprint size={14} />
                    <span>Consensus Block ({exp.votes ? exp.votes.filter(v => v.status === 'AGREED').length : exp.approvals.length}/{exp.shares.length})</span>
                  </button>
                </div>

                {/* Actions Buttons */}
                <div className="expense-actions">
                  {/* Pending Approval Votes - Prompts PIN signature */}
                  {canVote && (
                    <>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          onOpenSignModal({
                            expense: exp,
                            voter: { address: currentAccount, name: myShare?.name || 'You', avatar: '👤' },
                            initialAgreed: true,
                          });
                        }}
                        title="Sign agreement with your 4-digit security PIN"
                      >
                        <CheckCircle size={14} />
                        <span>Agree (PIN Sign)</span>
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          onOpenSignModal({
                            expense: exp,
                            voter: { address: currentAccount, name: myShare?.name || 'You', avatar: '👤' },
                            initialAgreed: false,
                          });
                        }}
                        title="Reject payment with objection reason and PIN"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {/* Explicit Badge if active account already voted on pending expense */}
                  {isPending && myVote && myVote.status === 'AGREED' && (
                    <span className="badge badge-approved" style={{ fontSize: '11px', padding: '4px 8px' }}>
                      <CheckCircle size={12} />
                      <span>You Agreed & Signed</span>
                    </span>
                  )}
                  {isPending && myVote && myVote.status === 'REJECTED' && (
                    <span className="badge badge-rejected" style={{ fontSize: '11px', padding: '4px 8px' }}>
                      <XCircle size={12} />
                      <span>You Rejected</span>
                    </span>
                  )}

                  {/* Dispute Action (if not already disputed or corrected) */}
                  {(isApproved || isPending) && !isDisputed && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenDispute(exp)}
                      title="Flag discrepancy or unauthorized charge for group review"
                    >
                      <AlertTriangle size={14} style={{ color: 'var(--color-amber)' }} />
                      <span>Dispute</span>
                    </button>
                  )}

                  {/* Resolve Dispute (Admin Only) */}
                  {isDisputed && isAdmin && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenResolveDispute(exp)}
                    >
                      <ShieldCheck size={14} />
                      <span>Resolve Dispute</span>
                    </button>
                  )}

                  {/* Submit Correction (Payer or Admin, and not already corrected) */}
                  {!isCorrected && (isPayer || isAdmin) && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenCorrection(exp)}
                      title="Submit transparent correction linked to this expense ID"
                    >
                      <Edit3 size={14} />
                      <span>Correct</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Expanded Consensus Block */}
              {expandedBlocks[exp.id] && (
                <div style={{ marginTop: '8px' }}>
                  <ConsensusBlock
                    expense={exp}
                    currentGroup={currentGroup}
                    currentAccount={currentAccount}
                    onOpenSignModal={onOpenSignModal}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
