import React, { useState } from 'react';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { dollarsToCents } from '../utils/cryptoUtils';
import { SPLIT_TYPES } from '../services/blockchainState';

export default function ExpenseCorrectModal({
  isOpen,
  onClose,
  expense,
  _currentGroup,
  onConfirmCorrection,
}) {
  if (!isOpen || !expense) return null;

  return (
    <ExpenseCorrectModalContent
      onClose={onClose}
      expense={expense}
      onConfirmCorrection={onConfirmCorrection}
    />
  );
}

function ExpenseCorrectModalContent({ onClose, expense, onConfirmCorrection }) {
  const [title, setTitle] = useState(() => expense.title || '');
  const [amountStr, setAmountStr] = useState(() => ((expense.totalAmount || 0) / 100).toFixed(2));
  const [reason, setReason] = useState(() => `Correction of previous entry #${expense.id} with adjusted details.`);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalCents = dollarsToCents(amountStr);

    if (!title.trim()) {
      setError('Title cannot be blank');
      return;
    }
    if (totalCents <= 0) {
      setError('Amount must be greater than ₹0');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for correction to preserve auditability');
      return;
    }

    // Compute new shares while preserving custom split proportions if applicable
    const prevTotal = expense.totalAmount || 1;
    let newShares;

    if (expense.splitType !== SPLIT_TYPES.EQUAL && expense.shares && expense.shares.length > 0) {
      let allocated = 0;
      newShares = expense.shares.map((s, idx) => {
        const ratio = s.amount / prevTotal;
        let amt = Math.round(totalCents * ratio);
        if (idx === expense.shares.length - 1) {
          amt = Math.max(0, totalCents - allocated);
        } else {
          allocated += amt;
        }
        return {
          ...s,
          amount: amt,
        };
      });
    } else {
      const count = expense.shares.length;
      const baseShare = Math.floor(totalCents / count);
      let remainder = totalCents % count;

      newShares = expense.shares.map((s) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        return {
          ...s,
          amount: baseShare + extra,
        };
      });
    }

    try {
      onConfirmCorrection(expense.groupId, expense.id, {
        title: title.trim(),
        category: expense.category,
        totalAmount: totalCents,
        splitType: expense.splitType || SPLIT_TYPES.EQUAL,
        shares: newShares,
        receiptHash: expense.receiptHash,
        receiptFileName: expense.receiptFileName,
        ipfsCid: expense.ipfsCid,
        notes: `Correction linked to #${expense.id}`,
      }, reason.trim());

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit correction');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} style={{ color: 'var(--color-cyan)' }} />
            <span>Submit Immutable Correction for #{expense.id}</span>
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(14, 116, 144, 0.35)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '18px', fontSize: '13px', color: 'var(--text-main)' }}>
          💡 <strong style={{ color: 'var(--color-cyan)' }}>Blockchain Non-Deletion Guarantee:</strong> Unlike Web2 apps that silently overwrite or delete records, FairShare creates an immutable link between Expense #{expense.id} and the new corrected record. The previous record remains preserved in the audit log.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Corrected Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corrected Total Amount (₹ INR)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Revision (Required for Audit Trail)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Corrected sales tax calculation or excluded item bought for personal use..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              rows="3"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Anchor Correction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
