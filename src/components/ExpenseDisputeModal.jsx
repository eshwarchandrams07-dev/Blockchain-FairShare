import React, { useState } from 'react';
import { X, AlertTriangle, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { formatCents } from '../utils/cryptoUtils';

export default function ExpenseDisputeModal({
  isOpen,
  onClose,
  expense,
  isResolving = false,
  onConfirmDispute,
  onConfirmResolve,
}) {
  const [reason, setReason] = useState('Incorrect share split or participant included in error');
  const [customText, setCustomText] = useState('');
  const [adminDecision, setAdminDecision] = useState(true); // true = accept/approve, false = reject
  const [resolutionNotes, setResolutionNotes] = useState('Reviewed receipt and agreed with original claim.');
  const [error, setError] = useState('');

  if (!isOpen || !expense) return null;

  const handleDisputeSubmit = (e) => {
    e.preventDefault();
    const fullReason = customText.trim() ? `${reason}: ${customText.trim()}` : reason;
    try {
      onConfirmDispute(expense.id, fullReason);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register dispute.');
    }
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    try {
      onConfirmResolve(expense.id, adminDecision, resolutionNotes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to resolve dispute.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isResolving ? (
              <>
                <ShieldCheck size={20} style={{ color: 'var(--color-primary-light)' }} />
                <span>Arbitrate Disputed Expense #{expense.id}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={20} style={{ color: 'var(--color-rose)' }} />
                <span>Flag Dispute on Expense #{expense.id}</span>
              </>
            )}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Expense Summary Box */}
        <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '18px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{expense.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Total: <strong>{formatCents(expense.totalAmount)}</strong> • Paid by {expense.payerName}
          </div>
        </div>

        {!isResolving ? (
          /* Form for Member Flagging Dispute */
          <form onSubmit={handleDisputeSubmit}>
            <div className="form-group">
              <label className="form-label">Primary Reason for Dispute</label>
              <select
                className="form-select"
                value={reason}
                onChange={e => setReason(e.target.value)}
              >
                <option value="Incorrect share split or participant included in error">Incorrect share split or participant included in error</option>
                <option value="Personal expense claimed as shared group expense">Personal expense claimed as shared group expense</option>
                <option value="Receipt total does not match claimed amount">Receipt total does not match claimed amount</option>
                <option value="Duplicate expense already recorded">Duplicate expense already recorded</option>
                <option value="Unauthorized or unapproved charge">Unauthorized or unapproved charge</option>
                <option value="Other discrepancy">Other discrepancy</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Explanation for Group Audit</label>
              <textarea
                className="form-textarea"
                placeholder="Explain the discrepancy clearly for all group members and administrators..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                required
                rows="3"
              />
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--color-rose)' }}>
              ⚠️ <strong style={{ color: 'var(--text-main)' }}>Smart Contract Notice:</strong> Flagging this dispute will immediately freeze this expense's balance impact on the ledger until an administrator arbitrates.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Flag Dispute On-Chain
              </button>
            </div>
          </form>
        ) : (
          /* Form for Admin Resolving Dispute */
          <form onSubmit={handleResolveSubmit}>
            <div className="form-group">
              <label className="form-label">Dispute Reason Raised</label>
              <div style={{ background: 'var(--bg-canvas)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
                {expense.disputeReason || 'Disputed by group member'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Determination</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${adminDecision ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => {
                    setAdminDecision(true);
                    setResolutionNotes('Approved after verifying receipt and confirming shared utility.');
                  }}
                >
                  <CheckCircle size={16} />
                  <span>Uphold & Approve</span>
                </button>
                <button
                  type="button"
                  className={`btn ${!adminDecision ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => {
                    setAdminDecision(false);
                    setResolutionNotes('Rejected due to invalid or unverified group participation.');
                  }}
                >
                  <XCircle size={16} />
                  <span>Reject Expense</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Arbitration Notes (Anchored to Audit Log)</label>
              <textarea
                className="form-textarea"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                required
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Finalize Decision On-Chain
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
