import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Sliders, 
  Users, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { formatCents, dollarsToCents } from '../utils/cryptoUtils';
import { SPLIT_TYPES } from '../services/blockchainState';

export default function ExpenseDisputeModal({
  isOpen,
  onClose,
  expense,
  isResolving = false,
  currentGroup,
  currentAccount: _currentAccount,
  onConfirmDispute,
  onConfirmResolve,
}) {
  if (!isOpen || !expense) return null;

  return (
    <ExpenseDisputeModalContent
      onClose={onClose}
      expense={expense}
      isResolving={isResolving}
      currentGroup={currentGroup}
      onConfirmDispute={onConfirmDispute}
      onConfirmResolve={onConfirmResolve}
    />
  );
}

function ExpenseDisputeModalContent({
  onClose,
  expense,
  isResolving,
  currentGroup,
  onConfirmDispute,
  onConfirmResolve,
}) {
  // Dispute raising state
  const [reason, setReason] = useState('Incorrect share split or participant included in error');
  const [customText, setCustomText] = useState('');

  // Admin decision mode: 'UPHOLD' | 'ADJUST_SPLIT' | 'REJECT'
  const [decisionMode, setDecisionMode] = useState('ADJUST_SPLIT');
  const [resolutionNotes, setResolutionNotes] = useState('Reviewed dispute details and adjusted participant shares accordingly.');
  const [error, setError] = useState('');

  // Split adjustment state
  const [amountStr, setAmountStr] = useState(() => ((expense.totalAmount || 0) / 100).toFixed(2));
  const [splitType, setSplitType] = useState(() => expense.splitType ?? SPLIT_TYPES.EQUAL);

  // Initial participants
  const [selectedParticipants, setSelectedParticipants] = useState(() => {
    if (expense.shares && Array.isArray(expense.shares) && expense.shares.length > 0) {
      return expense.shares.map(s => s.participant).filter(Boolean);
    }
    return (currentGroup?.members || []).map(m => m.address).filter(Boolean);
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

  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address);

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

      // Initialize default values for newly added user
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

  // Auto-balance remaining discrepancy to first selected participant
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

  // Submit dispute (Member)
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

  // Submit dispute resolution (Admin)
  const handleResolveSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (decisionMode === 'ADJUST_SPLIT') {
      if (selectedParticipants.length === 0) {
        setError('Please include at least one participant in the adjusted split.');
        return;
      }
      if (!isBalanced) {
        setError(`Shares are not balanced! Allocated ${formatCents(currentSharesSum)} does not match total ${formatCents(totalCents)}. Click Auto-Balance or adjust values.`);
        return;
      }

      try {
        onConfirmResolve(
          expense.id,
          {
            shares: calculatedShares,
            splitType,
            totalAmount: totalCents,
            action: 'ADJUST_SPLIT',
          },
          resolutionNotes.trim() || 'Split percentages and participant allocations adjusted by administrator.'
        );
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to adjust dispute split.');
      }
    } else if (decisionMode === 'UPHOLD') {
      try {
        onConfirmResolve(expense.id, true, resolutionNotes.trim() || 'Reviewed receipt and upheld original split.');
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to resolve dispute.');
      }
    } else if (decisionMode === 'REJECT') {
      try {
        onConfirmResolve(expense.id, false, resolutionNotes.trim() || 'Rejected due to invalid or unverified group participation.');
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to reject expense.');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: isResolving ? '680px' : '520px' }}>
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
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{expense.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Total: <strong>{formatCents(expense.totalAmount)}</strong> • Paid by {expense.payerName}
              </div>
            </div>
            <span className="badge badge-disputed">
              Disputed
            </span>
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
              <label className="form-label">Dispute Reason Raised by Member</label>
              <div style={{ background: 'var(--bg-canvas)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
                {expense.disputeReason || 'Disputed by group member'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Determination</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${decisionMode === 'ADJUST_SPLIT' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setDecisionMode('ADJUST_SPLIT');
                    setResolutionNotes('Adjusted participant split and reallocated shares to resolve discrepancy.');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', padding: '10px 8px', gap: '4px', height: 'auto', textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} />
                    <span style={{ fontWeight: 700 }}>Adjust Split</span>
                  </div>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Reallocate % & users</span>
                </button>

                <button
                  type="button"
                  className={`btn ${decisionMode === 'UPHOLD' ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => {
                    setDecisionMode('UPHOLD');
                    setResolutionNotes('Approved original split after verifying receipt and confirming shared utility.');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', padding: '10px 8px', gap: '4px', height: 'auto', textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} />
                    <span style={{ fontWeight: 700 }}>Uphold Original</span>
                  </div>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Original split correct</span>
                </button>

                <button
                  type="button"
                  className={`btn ${decisionMode === 'REJECT' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => {
                    setDecisionMode('REJECT');
                    setResolutionNotes('Rejected due to invalid or unverified group participation.');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', padding: '10px 8px', gap: '4px', height: 'auto', textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={16} />
                    <span style={{ fontWeight: 700 }}>Reject Expense</span>
                  </div>
                  <span style={{ fontSize: '10px', opacity: 0.85 }}>Void this charge</span>
                </button>
              </div>
            </div>

            {/* Interactive Split Adjustment Workspace (When ADJUST_SPLIT is active) */}
            {decisionMode === 'ADJUST_SPLIT' && (
              <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', border: '1px solid rgba(0, 82, 255, 0.25)', background: 'rgba(0, 82, 255, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} style={{ color: 'var(--color-primary-light)' }} />
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Arbitration Split Adjustment</strong>
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

                {/* Total Claimed Amount Field */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Total Expense Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    style={{ fontSize: '13px' }}
                    required
                  />
                </div>

                {/* Add / Remove Participants & Percentage Configuration */}
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ fontSize: '12px', margin: 0 }}>
                      Participants in Split ({selectedParticipants.length} of {verifiedMembers.length} Included)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Check to include • Uncheck to remove
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
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
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleParticipant(m.address)}
                            />
                            <span>{m.avatar || '👤'}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'var(--text-main)' : 'var(--text-dim)' }}>
                                {m.name} {m.address.toLowerCase() === expense.payer.toLowerCase() && <span style={{ fontSize: '10px', color: 'var(--color-primary-light)' }}>(Payer)</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                {isSelected ? (
                                  <span style={{ color: 'var(--color-emerald-light)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <Check size={11} /> Included in split
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)' }}>Excluded from split</span>
                                )}
                              </div>
                            </div>
                          </label>

                          {isSelected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Percentage mode input */}
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

                              {/* Exact mode input */}
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

                              {/* Resulting share display */}
                              <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald-light)', minWidth: '75px', textAlign: 'right' }}>
                                {shareObj ? formatCents(shareObj.amount) : '₹0.00'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Allocation balance bar */}
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
                        <Check size={14} /> Balanced Perfectly
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
            )}

            <div className="form-group">
              <label className="form-label">Arbitration Notes (Anchored to Immutable Audit Log)</label>
              <textarea
                className="form-textarea"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                required
                rows="2"
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
