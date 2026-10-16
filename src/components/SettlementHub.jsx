import React, { useState } from 'react';
import {
  ArrowRight,
  Zap,
  Coins,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Edit3,
  MessageSquare,
  Share2,
  FileText,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatCents, 
  shortenAddress, 
  simplifyDebts, 
  calculateRawPairwiseDebts, 
  generateUpiUri,
  isValidUpiId,
  isPlaceholderUpi
} from '../utils/cryptoUtils';

export default function SettlementHub({
  currentGroup,
  groupBalances,
  settlements,
  expenses = [],
  currentAccount,
  onSettleCrypto,
  onRecordUpiSettlement,
  onRecordOffChain,
  onConfirmOffChain,
  onDisputeOffChain,
  onUpdateMemberUpi,
}) {
  const [activeSubTab, setActiveSubTab] = useState('SIMPLIFIED'); // 'SIMPLIFIED' or 'HISTORY'
  const [algoViewMode, setAlgoViewMode] = useState('SIMPLIFIED'); // 'SIMPLIFIED' or 'RAW'
  const [showAlgoInfo, setShowAlgoInfo] = useState(false);
  const [offChainRefInput, setOffChainRefInput] = useState('');
  const [activeOffChainModal, setActiveOffChainModal] = useState(null); // transfer object
  const [activeUpiModal, setActiveUpiModal] = useState(null);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [voucherModalData, setVoucherModalData] = useState(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customUpiInput, setCustomUpiInput] = useState('');
  const [isEditingUpi, setIsEditingUpi] = useState(false);

  // Run Min-Cash-Flow debt simplification
  const simplifiedTransfers = simplifyDebts(groupBalances);

  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address && m.email && m.email.includes('@'));

  // Run unsimplified bilateral debt calculator for direct comparison
  const rawBilateralTransfers = calculateRawPairwiseDebts(
    verifiedMembers,
    expenses || [],
    settlements || [],
    currentGroup.id
  );

  const rawCount = rawBilateralTransfers.length;
  const simplifiedCount = simplifiedTransfers.length;
  const txSaved = Math.max(0, rawCount - simplifiedCount);
  const percentReduction = rawCount > 0 ? Math.round((txSaved / rawCount) * 100) : 0;

  const currentTransfers = algoViewMode === 'SIMPLIFIED' ? simplifiedTransfers : rawBilateralTransfers;

  // Group settlements
  const groupSettlements = settlements.filter(s => s.groupId === currentGroup.id);

  const handleExecuteCrypto = (transfer) => {
    try {
      onSettleCrypto(transfer.to, transfer.toName, transfer.amount);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b']
      });
    } catch (err) {
      alert(err.message || 'Crypto settlement failed');
    }
  };

  const handleOpenUpi = (transfer) => {
    setActiveUpiModal(transfer);
    const recipientMember = currentGroup?.members?.find(m => m && m.address && transfer?.to && m.address.toLowerCase() === transfer.to.toLowerCase());
    setCustomUpiInput(recipientMember?.upiId || '');
    setCustomAmountInput((transfer.amount / 100).toFixed(2));
    setIsEditingUpi(false);
    setUtrInput('');
    setCopiedUpi(false);
    setCopiedAmount(false);
    setCopiedLink(false);
  };

  const handleSaveCustomUpi = (newUpi) => {
    const clean = newUpi.trim().replace(/\s+/g, '');
    if (!clean) return;
    setCustomUpiInput(clean);
    if (onUpdateMemberUpi && activeUpiModal?.to) {
      onUpdateMemberUpi(activeUpiModal.to, clean);
    }
    setIsEditingUpi(false);
  };

  const handleConfirmUpiSubmit = (e) => {
    e.preventDefault();
    if (!activeUpiModal) return;
    const recipientMember = currentGroup?.members?.find(m => m && m.address && activeUpiModal?.to && m.address.toLowerCase() === activeUpiModal.to.toLowerCase());
    const recipientUpi = (customUpiInput || recipientMember?.upiId || `${(activeUpiModal.toName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`).trim();
    const finalUtr = utrInput.trim() || `UTR-${Date.now().toString().slice(-8)}`;

    const parsedRupees = parseFloat(customAmountInput);
    const maxPaise = activeUpiModal.amount;
    const settlePaise = (!isNaN(parsedRupees) && parsedRupees > 0)
      ? Math.min(maxPaise, Math.round(parsedRupees * 100))
      : maxPaise;

    try {
      if (onRecordUpiSettlement) {
        onRecordUpiSettlement(
          activeUpiModal.to,
          activeUpiModal.toName,
          settlePaise,
          finalUtr,
          recipientUpi
        );
      }
      setActiveUpiModal(null);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#166534', '#15803D', '#0E7490', '#B45309']
      });
    } catch (err) {
      alert(err.message || 'UPI settlement failed');
    }
  };

  const handleOpenOffChain = (transfer) => {
    setActiveOffChainModal(transfer);
    setOffChainRefInput(`Venmo / Bank wire to ${transfer.toName}`);
  };

  const handleConfirmOffChainSubmit = (e) => {
    e.preventDefault();
    if (!activeOffChainModal) return;
    try {
      onRecordOffChain(activeOffChainModal.to, activeOffChainModal.toName, activeOffChainModal.amount, offChainRefInput);
      setActiveOffChainModal(null);
    } catch (err) {
      alert(err.message || 'Failed to record off-chain payment');
    }
  };

  return (
    <div>
      {/* Sub-tabs & Algorithm Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={24} style={{ color: 'var(--color-amber)' }} />
              <h3 style={{ fontSize: '20px' }}>Debt Simplification & Settlement Engine</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Min-Cash-Flow graph reduction eliminates circular repayments. Settle via Real UPI / GPay, Web3 smart contract tokens, or recorded cash.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${activeSubTab === 'SIMPLIFIED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('SIMPLIFIED')}
            >
              Suggested Transfers ({currentTransfers.length})
            </button>
            <button
              className={`btn btn-sm ${activeSubTab === 'HISTORY' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubTab('HISTORY')}
            >
              Settlement Ledger ({groupSettlements.length})
            </button>
          </div>
        </div>

        {/* Algorithm Comparison & Switcher Bar */}
        <div 
          style={{ 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-medium)', 
            borderRadius: 'var(--radius-md)', 
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${algoViewMode === 'SIMPLIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '4px 10px', height: '30px' }}
                onClick={() => setAlgoViewMode('SIMPLIFIED')}
              >
                ⚡ Min-Cash-Flow ({simplifiedCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${algoViewMode === 'RAW' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '4px 10px', height: '30px' }}
                onClick={() => setAlgoViewMode('RAW')}
              >
                📜 Raw Bilateral Debts ({rawCount})
              </button>
            </div>

            {txSaved > 0 && algoViewMode === 'SIMPLIFIED' && (
              <span 
                style={{ 
                  background: 'rgba(21, 128, 61, 0.15)', 
                  border: '1px solid rgba(21, 128, 61, 0.3)',
                  color: 'var(--color-emerald)',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                Saved {txSaved} circular transfer{txSaved > 1 ? 's' : ''} ({percentReduction}% reduction)
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', height: '30px' }}
            onClick={() => setShowAlgoInfo(!showAlgoInfo)}
          >
            {showAlgoInfo ? 'Hide Algorithm Proof' : 'ℹ️ How Min-Cash-Flow Works'}
          </button>
        </div>

        {/* Expandable Algorithm Explanation Card for Academic / Viva Defense */}
        {showAlgoInfo && (
          <div 
            style={{
              marginTop: '14px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(14, 116, 144, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              border: '1px solid rgba(14, 116, 144, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              lineHeight: 1.6
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📐</span>
              <span>Greedy Min-Cash-Flow Graph Algorithm (Academic Formulation)</span>
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
              <strong>Problem:</strong> In a group of <em>V</em> members with arbitrary pairwise debts, direct repayment results in redundant circular loops (e.g. A pays B, B pays C, C pays A).
            </div>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-main)', marginBottom: '8px' }}>
              <li><strong>Zero-Sum Balance Invariant:</strong> Compute net balance <code className="mono">B[i] = Σ Credits - Σ Debits</code> for each participant. By double-entry bookkeeping, <code className="mono">Σ B[i] = 0</code>.</li>
              <li><strong>Graph Partitioning:</strong> Separate members into Creditors (<code className="mono">B &gt; 0</code>) and Debtors (<code className="mono">B &lt; 0</code>).</li>
              <li><strong>Greedy Maximal Matching:</strong> At each iteration, pair the maximum debtor with the maximum creditor for amount <code className="mono">min(|B_debtor|, B_creditor)</code> until all balances reach 0.</li>
              <li><strong>Complexity & Optimality:</strong> Operates in <code className="mono">O(V log V)</code> time, mathematically guaranteeing at most <code className="mono">V - 1</code> total transactions.</li>
            </ol>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Currently: <strong>{rawCount} raw pairwise debts</strong> collapsed into <strong>{simplifiedCount} direct settlements</strong>.
            </div>
          </div>
        )}
      </div>

      {activeSubTab === 'SIMPLIFIED' ? (
        <div>
          {currentTransfers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--color-emerald)', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '20px', marginBottom: '6px' }}>All Group Debts Are Settled!</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Every member has a zero net balance. No pending payments required.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
              {currentTransfers.map((tr, idx) => {
                const isUserDebtor = Boolean(tr?.from && currentAccount && tr.from.toLowerCase() === currentAccount.toLowerCase());
                const isUserCreditor = Boolean(tr?.to && currentAccount && tr.to.toLowerCase() === currentAccount.toLowerCase());

                return (
                  <div 
                    key={idx}
                    className="glass-panel" 
                    style={{ 
                      padding: '20px',
                      border: isUserDebtor 
                        ? '1px solid rgba(190, 18, 60, 0.45)' 
                        : isUserCreditor 
                        ? '1px solid rgba(21, 128, 61, 0.45)' 
                        : '1px solid var(--border-subtle)',
                      background: isUserDebtor 
                        ? 'linear-gradient(180deg, rgba(190, 18, 60, 0.08) 0%, var(--bg-surface) 100%)' 
                        : 'var(--bg-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
                        {algoViewMode === 'SIMPLIFIED' ? `Optimized Transfer #${idx + 1}` : `Raw Bilateral Debt #${idx + 1}`}
                      </span>
                      <span 
                        className="mono" 
                        style={{ 
                          fontSize: '22px', 
                          fontWeight: 800, 
                          color: '#166534' 
                        }}
                      >
                        {formatCents(tr.amount)}
                      </span>
                    </div>

                    {/* From Person -> To Person visual flow */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                      {/* Debtor */}
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Debtor (Payer)</div>
                        <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px', color: 'var(--text-main)' }}>
                          {tr.fromName} {isUserDebtor && '(You)'}
                        </div>
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {shortenAddress(tr.from)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px' }}>
                        <ArrowRight size={22} style={{ color: 'var(--color-primary)' }} />
                      </div>

                      {/* Creditor */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Creditor (Recipient)</div>
                        <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px', color: 'var(--text-main)' }}>
                          {tr.toName} {isUserCreditor && '(You)'}
                        </div>
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {shortenAddress(tr.to)}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isUserDebtor ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => handleOpenUpi(tr)}
                          title="Scan dynamic UPI QR code or pay via GPay/PhonePe and anchor real bank receipt on blockchain"
                        >
                          <QrCode size={16} />
                          <span>Pay via UPI / GPay (₹)</span>
                        </button>

                        <button 
                          className="btn btn-secondary"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => handleExecuteCrypto(tr)}
                          title="Instant atomic smart contract transfer using mock FSINR tokens"
                        >
                          <Coins size={15} style={{ color: 'var(--color-amber)' }} />
                          <span>Smart Contract (FSINR)</span>
                        </button>

                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px' }}
                          onClick={() => handleOpenOffChain(tr)}
                          title="Record physical cash or manual handoff"
                        >
                          <span>Cash</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
                          {isUserCreditor 
                            ? `You are owed ${formatCents(tr.amount)} by ${tr.fromName}` 
                            : `Participant settlement: ${tr.fromName} owes ${tr.toName} ${formatCents(tr.amount)}`}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenUpi(tr)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Open UPI QR code with receiving details"
                          >
                            <QrCode size={14} style={{ color: 'var(--color-primary)' }} />
                            <span>{isUserCreditor ? 'Show My Receiving QR' : 'Inspect Settlement QR'}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              const recipientMember = currentGroup?.members?.find(m => m && m.address && tr?.to && m.address.toLowerCase() === tr.to.toLowerCase());
                              const upi = (recipientMember?.upiId || `${(tr.toName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`).trim();
                              const uri = generateUpiUri({
                                upiId: upi,
                                payeeName: tr.toName,
                                amountInRupees: (tr.amount / 100).toFixed(2),
                                note: `FairShare - ${currentGroup.name}`
                              });
                              navigator.clipboard.writeText(uri);
                              alert(`Payment intent link for ₹${(tr.amount / 100).toFixed(2)} copied to clipboard!`);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Copy shareable payment intent link"
                          >
                            <Share2 size={14} />
                            <span>Share Payment Link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* History of Past Settlements */
        <div>
          {groupSettlements.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No settlement transactions recorded in this group yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupSettlements.map((st) => {
                const isRecipient = Boolean(st?.to && currentAccount && st.to.toLowerCase() === currentAccount.toLowerCase());
                const isPending = st.status === 'PENDING_CONFIRMATION';
                const isConfirmed = st.status === 'CONFIRMED';

                return (
                  <div 
                    key={st.id} 
                    className="glass-panel" 
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
                          Settlement #{st.id}
                        </span>
                        <span className={`badge ${isConfirmed ? 'badge-approved' : isPending ? 'badge-pending' : 'badge-disputed'}`}>
                          {st.status}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {st.settlementType === 'UPI_DIRECT' ? '📱 Direct UPI (Anchor)' : st.settlementType === 'CRYPTO_DIRECT' ? '⚡ On-Chain FSINR' : '💵 Off-Chain Record'}
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {st.fromName} paid {st.toName} • <span className="mono" style={{ color: '#166534', fontWeight: 800 }}>{formatCents(st.amount)}</span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Reference: {st.paymentRef} • {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Recipient Confirmation Buttons for Off-Chain Settlement */}
                      {isPending && isRecipient && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => onConfirmOffChain(st.id)}
                            title="Confirm that you received this fiat/cash payment"
                          >
                            <CheckCircle2 size={14} />
                            <span>Confirm Received</span>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onDisputeOffChain(st.id, 'Recipient reported payment was never received')}
                            title="Dispute payment claim"
                          >
                            <AlertCircle size={14} />
                            <span>Dispute</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setVoucherModalData(st)}
                        title="View certified cryptographic settlement voucher"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FileText size={12} />
                        <span>Voucher</span>
                      </button>

                      {st.txHash && (
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-main)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px' }}>
                          Tx: {shortenAddress(st.txHash)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Off-Chain Record Modal Dialog */}
      {activeOffChainModal && (
        <div className="modal-backdrop" onClick={() => setActiveOffChainModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Off-Chain Payment</h3>
              <button className="close-btn" onClick={() => setActiveOffChainModal(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmOffChainSubmit}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Recording payment of <strong style={{ color: 'var(--text-main)' }}>{formatCents(activeOffChainModal.amount)}</strong> to <strong style={{ color: 'var(--text-main)' }}>{activeOffChainModal.toName}</strong>.
              </div>

              <div className="form-group">
                <label className="form-label">Payment Proof / Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cash in hand, bank transfer note"
                  value={offChainRefInput}
                  onChange={e => setOffChainRefInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-dim)', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
                ℹ️ <strong>Protocol Rule:</strong> The smart contract creates a pending settlement record. The debt balance is updated once {activeOffChainModal.toName} confirms receiving the funds.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveOffChainModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Proof On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-World UPI Direct Settlement Modal */}
      {activeUpiModal && (() => {
        const recipientMember = currentGroup?.members?.find(m => m && m.address && activeUpiModal?.to && m.address.toLowerCase() === activeUpiModal.to.toLowerCase());
        const rawRecipientUpi = (customUpiInput || recipientMember?.upiId || `${(activeUpiModal.toName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`).trim();
        const isDemoUpi = isPlaceholderUpi(rawRecipientUpi);
        const isUpiValid = isValidUpiId(rawRecipientUpi);
        const maxRupees = (activeUpiModal.amount / 100).toFixed(2);
        const amountInRupees = customAmountInput !== '' ? customAmountInput : maxRupees;
        const upiUri = generateUpiUri({
          upiId: rawRecipientUpi,
          payeeName: activeUpiModal.toName,
          amountInRupees,
          note: `FairShare - ${currentGroup.name}`
        });

        const whatsappText = `Hi ${activeUpiModal.toName}, please pay ₹${amountInRupees} for FairShare (${currentGroup.name}) via UPI: ${upiUri}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

        const handleCopyUpi = () => {
          navigator.clipboard.writeText(rawRecipientUpi);
          setCopiedUpi(true);
          setTimeout(() => setCopiedUpi(false), 2000);
        };

        const handleCopyAmount = () => {
          navigator.clipboard.writeText(amountInRupees);
          setCopiedAmount(true);
          setTimeout(() => setCopiedAmount(false), 2000);
        };

        const handleCopyLink = () => {
          navigator.clipboard.writeText(upiUri);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        };

        const popularHandles = ['@oksbi', '@okicici', '@okhdfcbank', '@okaxis', '@paytm', '@ybl', '@axl'];

        const applyHandle = (handle) => {
          const userPrefix = (customUpiInput || rawRecipientUpi).split('@')[0] || activeUpiModal.toName.toLowerCase().replace(/[^a-z0-9]/g, '');
          setCustomUpiInput(`${userPrefix}${handle}`);
        };

        return (
          <div className="modal-backdrop" onClick={() => setActiveUpiModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Direct UPI & QR Settlement</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Pay via GPay, PhonePe, Paytm or BHIM with On-Chain Anchor
                    </p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setActiveUpiModal(null)} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              {/* Payee Details Card */}
              <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Recipient</div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{recipientMember?.avatar || '👤'}</span>
                      <span>{activeUpiModal.toName}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total Due</div>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-emerald-light)' }}>
                      {formatCents(activeUpiModal.amount)}
                    </div>
                  </div>
                </div>

                {/* Settle Amount Field (Full or Partial) */}
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                      Payment Amount (₹)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {amountInRupees === maxRupees ? 'Full settlement' : `Partial payment (₹${amountInRupees} of ₹${maxRupees})`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '10px', top: '9px', fontWeight: 700, color: 'var(--text-dim)' }}>₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={maxRupees}
                        className="form-input mono"
                        style={{ paddingLeft: '24px', fontSize: '14px', fontWeight: 700, height: '36px' }}
                        value={customAmountInput}
                        onChange={e => setCustomAmountInput(e.target.value)}
                        placeholder={maxRupees}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', height: '36px', whiteSpace: 'nowrap' }}
                      onClick={() => setCustomAmountInput(maxRupees)}
                    >
                      Full Amount
                    </button>
                    {activeUpiModal.amount > 200 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', height: '36px', whiteSpace: 'nowrap' }}
                        onClick={() => setCustomAmountInput((activeUpiModal.amount / 200).toFixed(2))}
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>

                {/* UPI ID Display or Edit Form */}
                {!isEditingUpi ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>UPI ID:</span>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {rawRecipientUpi}
                      </span>
                      {isDemoUpi ? (
                        <span className="badge badge-pending" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Demo Handle
                        </span>
                      ) : isUpiValid ? (
                        <span className="badge badge-approved" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Verified VPA
                        </span>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomUpiInput(rawRecipientUpi);
                          setIsEditingUpi(true);
                        }} 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        title="Click to change or type recipient's actual GPay or PhonePe UPI ID"
                      >
                        <Edit3 size={11} />
                        <span>Edit UPI ID</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCopyUpi} 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        {copiedUpi ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={handleCopyAmount} 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        {copiedAmount ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedAmount ? 'Copied' : 'Copy ₹'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Enter Recipient's Real UPI ID / VPA:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input 
                        type="text"
                        className="form-input mono"
                        placeholder="e.g. 9876543210@paytm or name@oksbi"
                        value={customUpiInput}
                        onChange={e => setCustomUpiInput(e.target.value)}
                        style={{ flex: 1, fontSize: '13px', padding: '8px 10px' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveCustomUpi(customUpiInput)}
                      >
                        Save & Update QR
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsEditingUpi(false)}
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Quick Banking Handle Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '4px' }}>Quick Handles:</span>
                      {popularHandles.map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => applyHandle(h)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-surface-elevated)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic QR Code Box */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'inline-block', background: '#ffffff', padding: '16px', borderRadius: '18px', border: '1px solid var(--border-medium)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&ecc=M&data=${encodeURIComponent(upiUri)}`}
                    alt="Scan UPI QR Code"
                    style={{ width: '200px', height: '200px', display: 'block', margin: '0 auto', imageRendering: 'crisp-edges' }}
                  />
                  <div style={{ fontSize: '12px', color: '#1C1613', fontWeight: 800, marginTop: '10px', letterSpacing: '0.6px' }}>
                    SCAN WITH ANY UPI APP CAMERA
                  </div>
                  <div style={{ fontSize: '10px', color: '#6E5F57', marginTop: '2px', fontWeight: 600 }}>
                    Google Pay • PhonePe • Paytm • BHIM • CRED • Any Bank App
                  </div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {isDemoUpi ? (
                    <span style={{ color: 'var(--color-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                      💡 <strong>Demo Mode:</strong> Recipient has a mock handle ({rawRecipientUpi}). Click <strong>"Edit UPI ID"</strong> above to enter your real GPay ID to test live bank transfers.
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-emerald-light)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                      ✅ <strong>100% Real UPI Compatible:</strong> Scanning automatically populates {activeUpiModal.toName} and ₹{amountInRupees} in your UPI app.
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Action Buttons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <a 
                  href={upiUri}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', padding: '9px 12px', fontSize: '12px' }}
                >
                  <Smartphone size={14} />
                  <span>Open in UPI App</span>
                  <ExternalLink size={12} />
                </a>

                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', padding: '9px 12px', fontSize: '12px', color: '#15803D' }}
                  title="Share payment link directly to roommate on WhatsApp"
                >
                  <MessageSquare size={14} />
                  <span>Request on WhatsApp</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{ background: 'transparent', border: 'none', color: copiedLink ? 'var(--color-emerald-light)' : 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                >
                  {copiedLink ? <Check size={12} /> : <Share2 size={12} />}
                  <span>{copiedLink ? 'UPI Deep Link Copied to Clipboard!' : 'Copy Raw UPI Payment URI (upi://pay?...)'}</span>
                </button>
              </div>

              {/* Cryptographic Proof Anchoring */}
              <form onSubmit={handleConfirmUpiSubmit}>
                <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
                    <span>Blockchain Oracle Proof: Enter Bank UTR Ref</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                    Enter the 12-digit UPI transaction reference (UTR) from your payment receipt. FairShare commits an immutable cryptographic digest on-chain, proving bank settlement.
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="form-input mono"
                      placeholder="e.g. 428901234567"
                      value={utrInput}
                      onChange={e => setUtrInput(e.target.value)}
                      maxLength={24}
                      style={{ flex: 1, fontSize: '13px', padding: '9px 12px' }}
                      required
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setUtrInput(`UTR-${Date.now().toString().slice(-8)}`)}
                      title="Auto-fill sample UTR for instant demo verification"
                      style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                    >
                      Sample UTR
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveUpiModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    <CheckCircle2 size={16} />
                    <span>Confirm & Anchor on Ledger</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Official Settlement Receipt Voucher Modal */}
      {voucherModalData && (
        <div className="modal-backdrop" onClick={() => setVoucherModalData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-emerald-light)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Certified Settlement Voucher</h3>
              </div>
              <button className="close-btn" onClick={() => setVoucherModalData(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Voucher Body (Printable Receipt Style) */}
            <div style={{ background: '#ffffff', border: '2px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', fontWeight: 700 }}>
                  Blockchain Proof of Debt Discharge
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534', margin: '4px 0' }}>
                  {formatCents(voucherModalData.amount)}
                </div>
                <span className="badge badge-approved" style={{ fontSize: '11px' }}>
                  Status: {voucherModalData.status || 'CONFIRMED'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Voucher / Tx ID:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>#{voucherModalData.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Payer (Debtor):</span>
                  <span style={{ fontWeight: 700 }}>{voucherModalData.fromName} ({shortenAddress(voucherModalData.from)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Recipient (Creditor):</span>
                  <span style={{ fontWeight: 700 }}>{voucherModalData.toName} ({shortenAddress(voucherModalData.to)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Payment Method:</span>
                  <span style={{ fontWeight: 700 }}>
                    {voucherModalData.settlementType === 'UPI_DIRECT' ? 'Direct UPI (Anchored)' : voucherModalData.settlementType === 'CRYPTO_DIRECT' ? 'Smart Contract Token' : 'Recorded Off-Chain'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Bank UTR / Reference:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{voucherModalData.utrNumber || voucherModalData.paymentRef}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Timestamp:</span>
                  <span>{new Date(voucherModalData.timestamp).toLocaleString()}</span>
                </div>
                {voucherModalData.txHash && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>On-Chain Transaction Digest:</span>
                    <span className="mono" style={{ fontSize: '10px', wordBreak: 'break-all', background: 'var(--bg-canvas)', padding: '6px', borderRadius: '4px' }}>
                      {voucherModalData.txHash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const summary = `FairShare Settlement Voucher #${voucherModalData.id}\nAmount: ${formatCents(voucherModalData.amount)}\nPayer: ${voucherModalData.fromName}\nRecipient: ${voucherModalData.toName}\nRef: ${voucherModalData.utrNumber || voucherModalData.paymentRef}\nTx: ${voucherModalData.txHash || 'N/A'}`;
                  navigator.clipboard.writeText(summary);
                  setCopiedVoucher(true);
                  setTimeout(() => setCopiedVoucher(false), 2000);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedVoucher ? <Check size={14} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={14} />}
                <span>{copiedVoucher ? 'Voucher Copied!' : 'Copy Summary'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setVoucherModalData(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
