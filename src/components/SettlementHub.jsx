import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { 
  formatCents, 
  shortenAddress, 
  simplifyDebts, 
  calculateRawPairwiseDebts 
} from '../utils/cryptoUtils';

export default function SettlementHub({
  currentGroup,
  groupBalances = [],
  expenses = [],
  currentAccount,
}) {
  const [algoViewMode, setAlgoViewMode] = useState('SIMPLIFIED'); // 'SIMPLIFIED' or 'RAW'
  const [showAlgoInfo, setShowAlgoInfo] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(null);

  if (!currentGroup) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No group selected or ledger loading...</p>
      </div>
    );
  }

  // Run Min-Cash-Flow debt simplification
  const simplifiedTransfers = simplifyDebts(groupBalances);

  const verifiedMembers = (currentGroup?.members || []).filter(m => m && m.address);

  // Run unsimplified bilateral debt calculator for direct comparison
  const rawBilateralTransfers = calculateRawPairwiseDebts(
    verifiedMembers,
    expenses || [],
    [],
    currentGroup?.id || 1
  );

  const rawCount = rawBilateralTransfers.length;
  const simplifiedCount = simplifiedTransfers.length;
  const txSaved = Math.max(0, rawCount - simplifiedCount);
  const percentReduction = rawCount > 0 ? Math.round((txSaved / rawCount) * 100) : 0;

  const currentTransfers = algoViewMode === 'SIMPLIFIED' ? simplifiedTransfers : rawBilateralTransfers;

  // Build member lookup map for quick UPI ID and profile resolution
  const memberMap = new Map();
  (currentGroup?.members || []).forEach(m => {
    if (m?.address) {
      memberMap.set(m.address.toLowerCase(), m);
    }
  });

  const handleCopyUpi = (upiId, id) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(id);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  return (
    <div>
      {/* Real-Life Debt Breakdown Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowLeftRight size={24} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '20px' }}>Real-Life Debt Breakdown (Who Owes Whom)</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Mathematical net debt calculation based on approved expenses. Members settle directly person-to-person in real life via Cash, UPI, or Bank Transfer.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              className="badge badge-approved" 
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={14} />
              <span>Real-Life Settlement (Offline)</span>
            </span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${algoViewMode === 'SIMPLIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '4px 12px', height: '32px' }}
                onClick={() => setAlgoViewMode('SIMPLIFIED')}
              >
                ⚡ Min-Cash-Flow ({simplifiedCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${algoViewMode === 'RAW' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '4px 12px', height: '32px' }}
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
            style={{ fontSize: '11px', height: '32px' }}
            onClick={() => setShowAlgoInfo(!showAlgoInfo)}
          >
            {showAlgoInfo ? 'Hide Algorithm Proof' : 'ℹ️ How Min-Cash-Flow Works'}
          </button>
        </div>

        {/* Expandable Algorithm Explanation Card */}
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
              <span>Greedy Min-Cash-Flow Graph Algorithm</span>
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
              <strong>Problem:</strong> In a group of members with multiple expenses, direct pairwise repayments create redundant circular loops (e.g. A pays B, B pays C, C pays A).
            </div>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-main)', marginBottom: '8px' }}>
              <li><strong>Zero-Sum Balance Invariant:</strong> Compute net balance <code className="mono">B[i] = Σ Paid - Σ Share</code> for each participant. Double-entry ensures <code className="mono">Σ B[i] = 0</code>.</li>
              <li><strong>Graph Partitioning:</strong> Separate members into Creditors (<code className="mono">B &gt; 0</code>) and Debtors (<code className="mono">B &lt; 0</code>).</li>
              <li><strong>Greedy Maximal Matching:</strong> Iteratively match the largest debtor with the largest creditor for amount <code className="mono">min(|B_debtor|, B_creditor)</code> until all balances clear.</li>
              <li><strong>Complexity & Optimality:</strong> Runs in <code className="mono">O(V log V)</code> time, mathematically minimizing real-life payments to at most <code className="mono">V - 1</code> transactions.</li>
            </ol>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Currently: <strong>{rawCount} raw pairwise debts</strong> condensed into <strong>{simplifiedCount} direct real-life payments</strong>.
            </div>
          </div>
        )}
      </div>

      {/* Dues Cards Grid */}
      {currentTransfers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--color-emerald)', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '20px', marginBottom: '6px' }}>All Group Expenses Are Balanced!</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Every member has a zero net balance. No pending real-life payments required.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {currentTransfers.map((tr, idx) => {
            const isUserDebtor = Boolean(tr?.from && currentAccount && tr.from.toLowerCase() === currentAccount.toLowerCase());
            const isUserCreditor = Boolean(tr?.to && currentAccount && tr.to.toLowerCase() === currentAccount.toLowerCase());
            const creditorMember = memberMap.get((tr?.to || '').toLowerCase());
            const creditorUpi = creditorMember?.upiId || `${(tr.toName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;

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
                    ? 'linear-gradient(180deg, rgba(190, 18, 60, 0.05) 0%, var(--bg-surface) 100%)' 
                    : isUserCreditor
                    ? 'linear-gradient(180deg, rgba(21, 128, 61, 0.05) 0%, var(--bg-surface) 100%)'
                    : 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
                    {algoViewMode === 'SIMPLIFIED' ? `Direct Real-Life Payment #${idx + 1}` : `Bilateral Debt #${idx + 1}`}
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
                  {/* Debtor (Who Pays) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Who Pays</div>
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

                  {/* Creditor (Who Receives) */}
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Who Receives</div>
                    <div style={{ fontWeight: 800, fontSize: '14px', marginTop: '2px', color: 'var(--text-main)' }}>
                      {tr.toName} {isUserCreditor && '(You)'}
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {shortenAddress(tr.to)}
                    </div>
                  </div>
                </div>

                {/* Real-Life Payment Guidance Card */}
                <div 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: 'var(--radius-md)', 
                    background: isUserDebtor ? 'rgba(244, 63, 94, 0.08)' : isUserCreditor ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-elevated)',
                    border: isUserDebtor ? '1px solid rgba(244, 63, 94, 0.25)' : isUserCreditor ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: 700, color: isUserDebtor ? 'var(--color-rose)' : isUserCreditor ? 'var(--color-emerald)' : 'var(--text-main)', marginBottom: '6px' }}>
                    {isUserDebtor 
                      ? `⚠️ You need to pay ${tr.toName} ${formatCents(tr.amount)} in real life`
                      : isUserCreditor
                      ? `✅ ${tr.fromName} owes you ${formatCents(tr.amount)} in real life`
                      : `${tr.fromName} needs to pay ${tr.toName} ${formatCents(tr.amount)} in real life`}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Settle offline via Cash, UPI (GPay, PhonePe, Paytm), or Net Banking.
                  </div>

                  {/* Recipient UPI ID with copy helper */}
                  {creditorUpi && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px 10px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>UPI VPA:</span>
                        <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{creditorUpi}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
                        onClick={() => handleCopyUpi(creditorUpi, idx)}
                        title="Copy UPI address to clipboard"
                      >
                        {copiedUpi === idx ? <Check size={11} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={11} />}
                        <span>{copiedUpi === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-Life Settlement Policy Note */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '16px 20px', 
          background: 'rgba(0, 82, 255, 0.04)', 
          border: '1px solid rgba(0, 82, 255, 0.2)', 
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-main)'
        }}
      >
        <Info size={18} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
        <div>
          <strong>Real-Life Settlement Principle:</strong> FairShare focuses on verified cryptographic expense splitting and consensus voting. Group members settle actual funds directly with each other offline without third-party escrow or custody.
        </div>
      </div>
    </div>
  );
}
