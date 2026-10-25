import React, { useState } from 'react';
import { 
  Fingerprint, 
  ShieldCheck, 
  Lock,
  Search,
  RotateCcw
} from 'lucide-react';
import ConsensusBlock from './ConsensusBlock';

export default function ConsensusHub({
  expenses,
  currentGroup,
  currentAccount,
  onOpenSignModal,
}) {
  const [filter, setFilter] = useState('ALL'); // ALL, NEED_MY_SIGNATURE, SEALED, CONTESTED
  const [searchQuery, setSearchQuery] = useState('');

  const groupExpenses = (expenses || []).filter(e => e && currentGroup && String(e.groupId) === String(currentGroup.id));

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

  const sealedCount = groupExpenses.filter(e => e.status === 1).length;
  const contestedCount = groupExpenses.filter(e => e.status === 2 || e.status === 3).length;

  const filteredExpenses = groupExpenses.filter(e => {
    let matchesStatus = true;
    if (filter === 'NEED_MY_SIGNATURE') {
      const votes = getExpenseVotes(e);
      const myVote = votes.find(v => (v?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
      matchesStatus = e.status === 0 && myVote && myVote.status === 'PENDING';
    } else if (filter === 'SEALED') {
      matchesStatus = e.status === 1;
    } else if (filter === 'CONTESTED') {
      matchesStatus = e.status === 2 || e.status === 3;
    }

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.title || '').toLowerCase().includes(q) ||
      (e.payerName || '').toLowerCase().includes(q) ||
      String(e.id || '').includes(q) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  });

  const hasActiveFilters = filter !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setFilter('ALL');
    setSearchQuery('');
  };

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

      {/* Filter Tabs & Search */}
      <div className="expenses-filter-bar" style={{ marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
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
            Sealed & Confirmed ({sealedCount})
          </button>
          <button 
            className={`filter-pill ${filter === 'CONTESTED' ? 'active' : ''}`}
            onClick={() => setFilter('CONTESTED')}
          >
            Contested / Rejected {contestedCount > 0 && `(${contestedCount})`}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', paddingRight: '12px', fontSize: '12px', height: '36px' }}
              placeholder="Search by title, payer, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ height: '36px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
              title="Reset search and filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Blocks List */}
      {filteredExpenses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: hasActiveFilters ? '12px' : '0' }}>
            {hasActiveFilters ? 'No consensus blocks match your search or filter.' : 'No consensus blocks found in this ledger.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
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
