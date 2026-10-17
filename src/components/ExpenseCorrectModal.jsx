import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  AlertCircle, 
  Users, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { dollarsToCents, formatCents } from '../utils/cryptoUtils';
import { SPLIT_TYPES } from '../services/blockchainState';

export default function ExpenseCorrectModal({
  isOpen,
  onClose,
  expense,
  currentGroup,
  onConfirmCorrection,
}) {
  if (!isOpen || !expense) return null;

  return (
    <ExpenseCorrectModalContent
      onClose={onClose}
      expense={expense}
      currentGroup={currentGroup}
      onConfirmCorrection={onConfirmCorrection}
    />
  );
}

function ExpenseCorrectModalContent({ onClose, expense, currentGroup, onConfirmCorrection }) {
  const [title, setTitle] = useState(() => expense.title || '');
  const [amountStr, setAmountStr] = useState(() => ((expense.totalAmount || 0) / 100).toFixed(2));
  const [reason, setReason] = useState(() => `Correction of previous entry #${expense.id} with adjusted split details.`);
  const [splitType, setSplitType] = useState(() => expense.splitType ?? SPLIT_TYPES.EQUAL);
  const [error, setError] = useState('');

  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address);

  // Initial participants
  const [selectedParticipants, setSelectedParticipants] = useState(() => {
    if (expense.shares && Array.isArray(expense.shares) && expense.shares.length > 0) {
      return expense.shares.map(s => s.participant).filter(Boolean);
    }
    return verifiedMembers.map(m => m.address).filter(Boolean);
  });

  // Custom percentages and amounts
  const [customPercentages, setCustomPercentages] = useState(() => {
    const pcts = {};
    const totalCents = expense.totalAmount || 1;
    if (expense.shares && Array.isArray(expense.shares)) {
      expense.shares.forEach(s => {
        if (s.participant) {
          const pct = s.percentage !== undefined 
            ? s.percentage 
            : ((s.amount / totalCents) * 100);
          pcts[s.participant] = Number(pct).toFixed(1);
        }
      });
    }
    return pcts;
  });

  const [customAmounts, setCustomAmounts] = useState(() => {
    const amts = {};
    if (expense.shares && Array.isArray(expense.shares)) {
      expense.shares.forEach(s => {
        if (s.participant) {
          amts[s.participant] = ((s.amount || 0) / 100).toFixed(2);
        }
      });
    }
    return amts;
  });

  // Toggle member inclusion in split
  const toggleParticipant = (addr) => {
    if (!addr) return;
    setError('');
    if (selectedParticipants.includes(addr)) {
      if (selectedParticipants.length <= 1) {
        setError('At least one participant must be included in the split.');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter(a => a.toLowerCase() !== addr.toLowerCase()));
    } else {
      const nextParticipants = [...selectedParticipants, addr];
      setSelectedParticipants(nextParticipants);

      // Default distribution for newly added participant
      if (splitType === SPLIT_TYPES.PERCENTAGE && !customPercentages[addr]) {
        const evenPct = (100 / nextParticipants.length).toFixed(1);
        const updated = {};
        nextParticipants.forEach(a => { updated[a] = evenPct; });
        setCustomPercentages(updated);
      } else if (splitType === SPLIT_TYPES.EXACT && !customAmounts[addr]) {
        const totalCents = dollarsToCents(amountStr);
        const evenAmt = (totalCents / nextParticipants.length / 100).toFixed(2);
        const updated = {};
        nextParticipants.forEach(a => { updated[a] = evenAmt; });
        setCustomAmounts(updated);
      }
    }
  };

  // Calculate shares based on current split configuration
  const calculateShares = () => {
    const totalCents = dollarsToCents(amountStr);
    const count = selectedParticipants.length;
    if (count === 0 || totalCents <= 0) return [];

    if (splitType === SPLIT_TYPES.EQUAL) {
      const baseShare = Math.floor(totalCents / count);
      let remainder = totalCents % count;

      return selectedParticipants.map((addr) => {
        const m = verifiedMembers.find(x => x.address.toLowerCase() === addr.toLowerCase());
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;

        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: baseShare + extra,
          percentage: Number(((baseShare + extra) / totalCents * 100).toFixed(2)),
        };
      });
    }

    if (splitType === SPLIT_TYPES.EXACT) {
      return selectedParticipants.map((addr) => {
        const m = verifiedMembers.find(x => x.address.toLowerCase() === addr.toLowerCase());
        const valCents = dollarsToCents(customAmounts[addr] || '0');
        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: valCents,
          percentage: totalCents > 0 ? Number((valCents / totalCents * 100).toFixed(2)) : 0,
        };
      });
    }

    if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const sumPct = selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
      let allocatedCents = 0;

      return selectedParticipants.map((addr, idx) => {
        const m = verifiedMembers.find(x => x.address.toLowerCase() === addr.toLowerCase());
        const rawPct = parseFloat(customPercentages[addr] || '0');
        const pct = rawPct / 100;
        let shareAmt = Math.round(totalCents * pct);

        // Eliminate rounding discrepancy on last participant if sum equals 100%
        if (idx === selectedParticipants.length - 1 && Math.abs(sumPct - 100) < 0.1) {
          shareAmt = Math.max(0, totalCents - allocatedCents);
        } else {
          allocatedCents += shareAmt;
        }

        return {
          participant: addr,
          name: m ? m.name : 'Member',
          amount: shareAmt,
          percentage: rawPct,
        };
      });
    }

    return [];
  };

  const calculatedShares = calculateShares();
  const currentSharesSum = calculatedShares.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalCents = dollarsToCents(amountStr);
  const isBalanced = currentSharesSum === totalCents && totalCents > 0;

  // Switch split type
  const handleSwitchSplitType = (newType) => {
    setSplitType(newType);
    setError('');
    const count = selectedParticipants.length;
    if (count === 0 || totalCents <= 0) return;

    if (newType === SPLIT_TYPES.EXACT) {
      const baseRupees = (parseFloat(amountStr || '0') / count).toFixed(2);
      const newAmounts = {};
      selectedParticipants.forEach(addr => {
        newAmounts[addr] = baseRupees;
      });
      setCustomAmounts(newAmounts);
    } else if (newType === SPLIT_TYPES.PERCENTAGE) {
      const basePct = (100 / count).toFixed(1);
      const newPcts = {};
      selectedParticipants.forEach(addr => {
        newPcts[addr] = basePct;
      });
      setCustomPercentages(newPcts);
    }
  };

  // Auto-balance remaining discrepancy
  const handleAutoBalanceRemainder = () => {
    if (totalCents <= 0 || selectedParticipants.length === 0) return;

    const diffCents = totalCents - currentSharesSum;
    const targetAddr = selectedParticipants[0];

    if (splitType === SPLIT_TYPES.EXACT) {
      const currentValCents = dollarsToCents(customAmounts[targetAddr] || '0');
      const newValCents = Math.max(0, currentValCents + diffCents);
      setCustomAmounts({
        ...customAmounts,
        [targetAddr]: (newValCents / 100).toFixed(2),
      });
    } else if (splitType === SPLIT_TYPES.PERCENTAGE) {
      const currentSumPct = selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0);
      const diffPct = 100 - currentSumPct;
      const currentPct = parseFloat(customPercentages[targetAddr] || '0');
      const newPct = Math.max(0, +(currentPct + diffPct).toFixed(1));
      setCustomPercentages({
        ...customPercentages,
        [targetAddr]: newPct.toString(),
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

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
    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant in the split');
      return;
    }
    if (!isBalanced) {
      setError(`Shares are not balanced! Allocated ${formatCents(currentSharesSum)} does not match total ${formatCents(totalCents)}. Click Auto-Balance or adjust values.`);
      return;
    }

    try {
      onConfirmCorrection(expense.groupId, expense.id, {
        title: title.trim(),
        category: expense.category,
        totalAmount: totalCents,
        splitType,
        shares: calculatedShares,
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
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} style={{ color: 'var(--color-cyan)' }} />
            <span>Submit Immutable Correction for #{expense.id}</span>
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
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

          {/* Split Mode & Participants Workspace */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '18px', border: '1px solid rgba(0, 82, 255, 0.25)', background: 'rgba(0, 82, 255, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: 'var(--color-primary-light)' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Split Allocation &amp; Participants</strong>
              </div>

              {/* Split Type Selector */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${splitType === SPLIT_TYPES.EQUAL ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSwitchSplitType(SPLIT_TYPES.EQUAL)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Equal
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${splitType === SPLIT_TYPES.PERCENTAGE ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSwitchSplitType(SPLIT_TYPES.PERCENTAGE)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${splitType === SPLIT_TYPES.EXACT ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSwitchSplitType(SPLIT_TYPES.EXACT)}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  Exact (₹)
                </button>
              </div>
            </div>

            {/* Participants list with checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {verifiedMembers.map(m => {
                const isSelected = selectedParticipants.some(a => a.toLowerCase() === m.address.toLowerCase());
                const shareObj = calculatedShares.find(s => s?.participant && s.participant.toLowerCase() === m.address.toLowerCase());

                return (
                  <div
                    key={m.address}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(0, 82, 255, 0.08)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid rgba(0, 82, 255, 0.3)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(m.address)}
                      />
                      <span>{m.avatar || '👤'}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'var(--text-main)' : 'var(--text-dim)' }}>
                        {m.name}
                      </span>
                    </label>

                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {splitType === SPLIT_TYPES.PERCENTAGE && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="%"
                              style={{
                                width: '65px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: 'var(--bg-canvas)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-main)',
                                borderRadius: '4px',
                                textAlign: 'right'
                              }}
                              value={customPercentages[m.address] ?? ''}
                              onChange={e => setCustomPercentages({ ...customPercentages, [m.address]: e.target.value })}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                          </div>
                        )}

                        {splitType === SPLIT_TYPES.EXACT && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              style={{
                                width: '85px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: 'var(--bg-canvas)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-main)',
                                borderRadius: '4px'
                              }}
                              value={customAmounts[m.address] ?? ''}
                              onChange={e => setCustomAmounts({ ...customAmounts, [m.address]: e.target.value })}
                            />
                          </div>
                        )}

                        <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald-light)', minWidth: '75px', textAlign: 'right' }}>
                          {shareObj ? formatCents(shareObj.amount) : '₹0.00'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sum balance status */}
            {totalCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span>
                  Allocated: <strong>{formatCents(currentSharesSum)}</strong> / {formatCents(totalCents)}
                  {splitType === SPLIT_TYPES.PERCENTAGE && (
                    <span style={{ color: 'var(--text-dim)', marginLeft: '6px' }}>
                      ({selectedParticipants.reduce((sum, a) => sum + (parseFloat(customPercentages[a]) || 0), 0).toFixed(1)}%)
                    </span>
                  )}
                </span>

                {isBalanced ? (
                  <span style={{ color: 'var(--color-emerald-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Balanced
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>
                      Δ {formatCents(Math.abs(currentSharesSum - totalCents))}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoBalanceRemainder}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} />
                      <span>Auto-Balance</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Revision (Required for Audit Trail)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g. Corrected participant split per mutual agreement..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              rows="2"
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
