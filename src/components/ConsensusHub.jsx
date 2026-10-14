import React, { useState } from 'react';
import { 
  Fingerprint, 
  ShieldCheck, 
  Lock
} from 'lucide-react';
import ConsensusBlock from './ConsensusBlock';

export default function ConsensusHub({
  expenses,
  currentGroup,
  currentAccount,
  onOpenSignModal,
}) {
  const [filter, setFilter] = useState('ALL'); // ALL, NEED_MY_SIGNATURE, SEALED, CONTESTED

  const groupExpenses = expenses.filter(e => e.groupId === currentGroup.id);

  // Helper to safely get votes array
  const getExpenseVotes = (e) => {
    if (e.votes && e.votes.length > 0) return e.votes;
    if (e.shares) {
      return e.shares.map(s => ({
        participant: s.participant,
        status: (s.participant || '').toLowerCase() === (e.payer || '').toLowerCase() ? 'AGREED' : 'PENDING',
      }));
    }
    return [];
  };

  // Check how many need current account's signature
  const needsMySignature = groupExpenses.filter(e => {
    if (e.status !== 0) return false; // Not pending
    const votes = getExpenseVotes(e);
    const myVote = votes.find(v => (v?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
    return myVote && myVote.status === 'PENDING';
  });

  const filteredExpenses = groupExpenses.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'NEED_MY_SIGNATURE') {
      const votes = getExpenseVotes(e);
      const myVote = votes.find(v => (v?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
      return e.status === 0 && myVote && myVote.status === 'PENDING';
    }
    if (filter === 'SEALED') return e.status === 1;
    if (filter === 'CONTESTED') return e.status === 2 || e.status === 3;
    return true;
  });

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Fingerprint size={24} style={{ color: 'var(--color-primary-light)' }} />
              <h3 style={{ fontSize: '20px' }}>Multi-Party Consensus & Anti-Cheat Hub</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Every recorded expense generates a tamper-evident Consensus Block. Participants must explicitly Agree or Reject before ledger balances update.
            </p>
          </div>

          <div className="badge badge-approved" style={{ padding: '8px 14px', fontSize: '13px' }}>
            <ShieldCheck size={16} />
            <span>Anti-Impersonation Enabled</span>
          </div>
        </div>

        {/* Security Mechanism Explainer Card */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: 'var(--text-main)' }}>
          <Lock size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--color-primary)' }}>How Real-World Cheating Is Prevented:</strong> In traditional apps, anyone who opens a browser could alter records or falsely approve charges for others. In FairShare, every vote requires the participant's <strong>Secret Security PIN</strong> (simulating an ECDSA private key signature). Alice cannot agree for Bob, and Bob can immediately reject unauthorized claims with recorded reasons!
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="expenses-filter-bar" style={{ marginBottom: '20px' }}>
        <div className="filter-pills">
          <button 
            className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Consensus Blocks ({groupExpenses.length})
          </button>
          <button 
            className={`filter-pill ${filter === 'NEED_MY_SIGNATURE' ? 'active' : ''}`}
            onClick={() => setFilter('NEED_MY_SIGNATURE')}
          >
            Awaiting Your Signature {needsMySignature.length > 0 && `(${needsMySignature.length})`}
          </button>
          <button 
            className={`filter-pill ${filter === 'SEALED' ? 'active' : ''}`}
            onClick={() => setFilter('SEALED')}
          >
            Sealed & Confirmed
          </button>
          <button 
            className={`filter-pill ${filter === 'CONTESTED' ? 'active' : ''}`}
            onClick={() => setFilter('CONTESTED')}
          >
            Contested / Rejected
          </button>
        </div>
      </div>

      {/* Blocks List */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No consensus blocks match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredExpenses.map(exp => (
            <ConsensusBlock
              key={exp.id}
              expense={exp}
              currentGroup={currentGroup}
              currentAccount={currentAccount}
              onOpenSignModal={onOpenSignModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
