import React, { useState } from 'react';
import {
  ArrowRight,
  Coins,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  FileText,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  formatCents, 
  shortenAddress, 
  simplifyDebts, 
  calculateRawPairwiseDebts 
} from '../utils/cryptoUtils';

export default function SettlementHub({
  currentGroup,
  groupBalances,
  settlements,
  expenses = [],
  currentAccount,
  onSettleCrypto,
}) {
  const [activeSubTab, setActiveSubTab] = useState('SIMPLIFIED'); // 'SIMPLIFIED' or 'HISTORY'
  const [algoViewMode, setAlgoViewMode] = useState('SIMPLIFIED'); // 'SIMPLIFIED' or 'RAW'
  const [showAlgoInfo, setShowAlgoInfo] = useState(false);
  const [voucherModalData, setVoucherModalData] = useState(null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  if (!currentGroup) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No group selected or ledger loading...</p>
      </div>
    );
  }

  // Run Min-Cash-Flow debt simplification
  const simplifiedTransfers = simplifyDebts(groupBalances);

  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address && m.email && m.email.includes('@'));

  // Run unsimplified bilateral debt calculator for direct comparison
  const rawBilateralTransfers = calculateRawPairwiseDebts(
    verifiedMembers,
    expenses || [],
    settlements || [],
    currentGroup?.id || 1
  );

  const rawCount = rawBilateralTransfers.length;
  const simplifiedCount = simplifiedTransfers.length;
  const txSaved = Math.max(0, rawCount - simplifiedCount);
  const percentReduction = rawCount > 0 ? Math.round((txSaved / rawCount) * 100) : 0;

  const currentTransfers = algoViewMode === 'SIMPLIFIED' ? simplifiedTransfers : rawBilateralTransfers;

  // Group settlements
  const groupSettlements = (settlements || []).filter(s => s && currentGroup && String(s.groupId) === String(currentGroup.id));

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

  return (
    <div>
      {/* Sub-tabs & Algorithm Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coins size={24} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '20px' }}>On-Chain Debt Simplification & Settlement</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Min-Cash-Flow graph reduction eliminates circular repayments. Settle directly on-chain via smart contract atomic transfers on Base Sepolia.
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
              On-Chain Ledger ({groupSettlements.length})
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
                Every member has a zero net balance. No pending on-chain settlements required.
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

                    {/* Web3 Smart Contract Settlement Action */}
                    {isUserDebtor ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px', 
                            padding: '12px',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}
                          onClick={() => handleExecuteCrypto(tr)}
                          title="Execute smart contract atomic transfer on Base Sepolia"
                        >
                          <Coins size={17} />
                          <span>⚡ Settle via Smart Contract (On-Chain)</span>
                        </button>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
                          Atomic transfer to {shortenAddress(tr.to)} via FairShare contract on Base Sepolia
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isUserCreditor ? 'var(--color-emerald)' : 'var(--text-main)' }}>
                          {isUserCreditor 
                            ? `You are owed ${formatCents(tr.amount)} by ${tr.fromName}` 
                            : `${tr.fromName} owes ${tr.toName} ${formatCents(tr.amount)}`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <ShieldCheck size={13} style={{ color: 'var(--color-primary)' }} />
                          <span>Awaiting on-chain smart contract execution by {tr.fromName}</span>
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
              <p style={{ color: 'var(--text-muted)' }}>No on-chain settlement transactions recorded in this group yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupSettlements.map((st) => {
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
                        <span className={`badge ${isConfirmed ? 'badge-approved' : 'badge-pending'}`}>
                          {st.status}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          ⚡ On-Chain Smart Contract
                        </span>
                      </div>

                      <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {st.fromName} settled with {st.toName} • <span className="mono" style={{ color: '#166534', fontWeight: 800 }}>{formatCents(st.amount)}</span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Protocol: {st.paymentRef} • {new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        <a
                          href={`https://sepolia.basescan.org/tx/${st.txHash.startsWith('0x') ? st.txHash : '0x' + st.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono"
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-primary-light)',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Verify live on Basescan Sepolia Explorer"
                        >
                          <span>Tx: {shortenAddress(st.txHash)}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                  <span style={{ color: 'var(--text-dim)' }}>Settlement Protocol:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    FairShare Smart Contract (Base Sepolia L2)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Protocol Reference:</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{voucherModalData.paymentRef || 'On-Chain Atomic Transfer'}</span>
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
                  const summary = `FairShare Settlement Voucher #${voucherModalData.id}\nAmount: ${formatCents(voucherModalData.amount)}\nPayer: ${voucherModalData.fromName}\nRecipient: ${voucherModalData.toName}\nProtocol: FairShare Smart Contract (Base Sepolia)\nTx: ${voucherModalData.txHash || 'N/A'}`;
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
