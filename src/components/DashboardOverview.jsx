import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Zap, 
  ShieldCheck, 
  Users,
  QrCode,
  Globe,
  Lock,
  Check,
  Share2,
  Fingerprint,
  Layers
} from 'lucide-react';
import { formatMaskedCents, shortenAddress } from '../utils/cryptoUtils';

export default function DashboardOverview({
  currentGroup,
  groupBalances,
  expenses,
  currentAccount,
  onOpenAddExpense,
  onOpenConnectDevices,
  onSwitchTab,
  isPrivacyMaskActive = false,
  onLockGroup,
}) {
  const [copiedAuditLink, setCopiedAuditLink] = useState(false);

  // Calculate total approved volume
  const approvedExpenses = (expenses || []).filter(e => e && Number(e.groupId) === Number(currentGroup?.id) && Number(e.status) === 1);
  const totalVolume = approvedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  // Find current user's balance
  const userBalanceObj = (groupBalances || []).find(b => b && b.address && currentAccount && b.address.toLowerCase() === currentAccount.toLowerCase());
  const userNetBalance = userBalanceObj ? (userBalanceObj.netBalance || 0) : 0;

  // Counts
  const pendingApprovalsCount = (expenses || []).filter(e => e && Number(e.groupId) === Number(currentGroup?.id) && Number(e.status) === 0).length;
  const activeDisputesCount = (expenses || []).filter(e => e && Number(e.groupId) === Number(currentGroup?.id) && Number(e.status) === 3).length;

  // Consensus signature count for active account
  const needsMySignatureCount = (expenses || []).filter(e => {
    if (Number(e.groupId) !== Number(currentGroup?.id) || Number(e.status) !== 0) return false;
    const myVote = (e.votes || []).find(v => (v?.participant || '').toLowerCase() === (currentAccount || '').toLowerCase());
    return myVote && myVote.status === 'PENDING';
  }).length;

  // Category spending breakdown across approved expenses
  const categoryTotals = {};
  approvedExpenses.forEach(e => {
    const cat = e.category || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.totalAmount || 0);
  });
  const categoryBreakdown = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
    pct: totalVolume > 0 ? Math.round((amount / totalVolume) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  const categoryColors = [
    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'
  ];

  // Check sum of balances equals 0
  const totalBalanceSum = (groupBalances || []).reduce((sum, b) => sum + (b?.netBalance || 0), 0);
  const isIntegritySound = Math.abs(totalBalanceSum) <= 1; // within 1 cent rounding
  const isPrivate = currentGroup?.isPrivate !== false;

  const handleCopyAuditorLink = () => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/?joinGroup=${currentGroup.id}&view=auditor`
      : `/?joinGroup=${currentGroup.id}`;
    navigator.clipboard.writeText(url);
    setCopiedAuditLink(true);
    setTimeout(() => setCopiedAuditLink(false), 2000);
  };

  return (
    <div>
      {/* Actionable Consensus Signature Alert Banner */}
      {needsMySignatureCount > 0 && (
        <div 
          style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)', 
            border: '1px solid rgba(99, 102, 241, 0.35)', 
            borderRadius: 'var(--radius-md)', 
            padding: '12px 18px', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '12px',
            boxShadow: 'var(--shadow-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Fingerprint size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              Action Required: You have <strong>{needsMySignatureCount} expense{needsMySignatureCount > 1 ? 's' : ''}</strong> awaiting your cryptographic PIN consensus signature.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onSwitchTab('consensus')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Review & Sign in Consensus Hub →
          </button>
        </div>
      )}
      {/* Top Welcome & Distinct Ledger Identity Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: isPrivate 
            ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(209, 250, 229, 0.4) 0%, rgba(255, 255, 255, 0.95) 100%)',
          border: isPrivate ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '24px' }}>{isPrivate ? '🛡️' : '🌐'}</span>
            <h2 style={{ fontSize: '22px', color: 'var(--text-main)', fontWeight: 800 }}>
              {currentGroup.name === 'Shared Roommates Ledger' ? 'Shared Ledger' : currentGroup.name}
            </h2>
            <span className="badge badge-neutral mono" style={{ fontSize: '11px', fontWeight: 700 }}>
              {currentGroup?.ledgerId || `#${currentGroup.id}`}
            </span>
            <span 
              className={`badge ${isPrivate ? 'badge-pending' : 'badge-approved'}`} 
              style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
            >
              {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
              <span>{isPrivate ? 'Private Sovereign Vault (2FA)' : 'Open Community Transparency'}</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '640px', margin: 0 }}>
            {currentGroup.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!isPrivate ? (
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyAuditorLink}
              title="Copy shareable read-only link for anyone in the community to audit this ledger"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.08)', color: '#065F46', fontWeight: 700 }}
            >
              {copiedAuditLink ? <Check size={14} style={{ color: '#10B981' }} /> : <Share2 size={14} />}
              <span>{copiedAuditLink ? 'Auditor Link Copied!' : 'Public Audit Link'}</span>
            </button>
          ) : (
            onLockGroup && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onLockGroup(currentGroup.id)}
                title="Lock this private vault session immediately"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#92400E', fontWeight: 700 }}
              >
                <Lock size={13} style={{ color: 'var(--color-amber)' }} />
                <span>Lock Vault</span>
              </button>
            )
          )}

          <button 
            className="btn btn-secondary"
            onClick={onOpenConnectDevices || (() => onSwitchTab('group'))}
            title="Scan QR code or copy invite link to add users to this ledger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <QrCode size={16} style={{ color: 'var(--color-primary-light)' }} />
            <span>Invite &amp; QR Code</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={onOpenAddExpense}
          >
            <PlusCircle size={16} />
            <span>Add Expense</span>
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onSwitchTab('settlements')}
          >
            <Zap size={16} style={{ color: 'var(--color-amber)' }} />
            <span>Settle Up</span>
          </button>
        </div>
      </div>

      {/* Ledger Mode Architectural Feature Callout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: isPrivate ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px'
        }}>
          {isPrivate ? <Lock size={16} style={{ color: 'var(--color-amber)', flexShrink: 0 }} /> : <Globe size={16} style={{ color: 'var(--color-emerald)', flexShrink: 0 }} />}
          <div>
            <strong style={{ color: 'var(--text-main)' }}>{isPrivate ? '2FA Vault Security:' : 'Open Transparency Mode:'}</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {isPrivate 
                ? 'Only members with valid Ledger ID & Password can decrypt expenses and cast consensus votes.'
                : 'Anyone on the network can freely inspect all transactions, IPFS receipts, and audit blocks.'}
            </span>
          </div>
        </div>

        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px'
        }}>
          <ShieldCheck size={16} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>Cryptographic Guarantee:</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              Zero-Sum balance invariant (Σ = ₹0.00) continuously authenticated on-chain.
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* Total Volume */}
        <div className="kpi-card glass-panel" style={{ '--card-border-grad': 'var(--grad-primary)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Total Group Volume</span>
            <div className="kpi-icon-box" style={{ color: 'var(--color-primary-light)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{formatMaskedCents(totalVolume, isPrivacyMaskActive)}</div>
          <div className="kpi-subtext">{approvedExpenses.length} confirmed blockchain expenses</div>
        </div>

        {/* Your Net Balance */}
        <div 
          className="kpi-card glass-panel" 
          style={{ 
            '--card-border-grad': userNetBalance > 0 
              ? 'var(--grad-success)' 
              : userNetBalance < 0 
              ? 'var(--grad-danger)' 
              : 'var(--grad-primary)' 
          }}
        >
          <div className="kpi-header">
            <span className="kpi-title">Your Net Balance</span>
            <div className="kpi-icon-box">
              {userNetBalance > 0 ? (
                <ArrowDownLeft size={18} style={{ color: 'var(--color-emerald-light)' }} />
              ) : userNetBalance < 0 ? (
                <ArrowUpRight size={18} style={{ color: 'var(--color-rose)' }} />
              ) : (
                <ShieldCheck size={18} style={{ color: 'var(--color-cyan)' }} />
              )}
            </div>
          </div>
          <div 
            className={`kpi-value ${
              userNetBalance > 0 
                ? 'balance-positive' 
                : userNetBalance < 0 
                ? 'balance-negative' 
                : 'balance-neutral'
            }`}
          >
            {formatMaskedCents(userNetBalance, isPrivacyMaskActive)}
          </div>
          <div className="kpi-subtext">
            {userNetBalance > 0 
              ? 'You are owed money by group members' 
              : userNetBalance < 0 
              ? 'You owe money to group members' 
              : 'All your expenses are completely settled'}
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          className="kpi-card glass-panel" 
          style={{ '--card-border-grad': 'var(--grad-warning)', cursor: 'pointer' }}
          onClick={() => onSwitchTab('expenses')}
          title="Click to view pending expenses"
        >
          <div className="kpi-header">
            <span className="kpi-title">Pending Approvals</span>
            <div className="kpi-icon-box" style={{ color: 'var(--color-amber)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: pendingApprovalsCount > 0 ? 'var(--color-amber)' : 'inherit' }}>
            {pendingApprovalsCount}
          </div>
          <div className="kpi-subtext">Expenses awaiting consensus quorum</div>
        </div>

        {/* Active Disputes */}
        <div 
          className="kpi-card glass-panel" 
          style={{ '--card-border-grad': 'var(--grad-danger)', cursor: 'pointer' }}
          onClick={() => onSwitchTab('expenses')}
          title="Click to view disputes"
        >
          <div className="kpi-header">
            <span className="kpi-title">Active Disputes</span>
            <div className="kpi-icon-box" style={{ color: 'var(--color-rose)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: activeDisputesCount > 0 ? 'var(--color-rose)' : 'inherit' }}>
            {activeDisputesCount}
          </div>
          <div className="kpi-subtext">Transactions flagged for arbitration</div>
        </div>
      </div>

      {/* Category Spending Breakdown Bar Card */}
      {categoryBreakdown.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--color-primary)' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Category Spending Distribution</h4>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Based on {approvedExpenses.length} approved expenses
            </div>
          </div>

          {/* Segmented multi-color progress bar */}
          <div style={{ height: '10px', background: 'var(--bg-canvas)', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={cat.name}
                style={{
                  height: '100%',
                  width: `${cat.pct}%`,
                  background: categoryColors[idx % categoryColors.length]
                }}
                title={`${cat.name}: ${formatCents(cat.amount)} (${cat.pct}%)`}
              />
            ))}
          </div>

          {/* Category Chips with Amount & Percentage */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={cat.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '100px',
                  padding: '4px 10px',
                  fontSize: '12px'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: categoryColors[idx % categoryColors.length] }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}:</span>
                <span className="mono" style={{ color: 'var(--text-muted)' }}>{formatCents(cat.amount)}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700 }}>({cat.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Balances & Cryptographic Integrity Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--color-primary-light)' }} />
              <span>Current Group Balance Sheet</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Real-time net debt ledger dynamically maintained by smart contract consensus
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isIntegritySound ? (
              <span className="badge badge-approved" title="Sum of all credits and debits strictly equals ₹0.00">
                <ShieldCheck size={14} />
                <span>Zero-Sum Integrity Verified (Σ = ₹0.00)</span>
              </span>
            ) : (
              <span className="badge badge-rejected">
                <AlertTriangle size={14} />
                <span>Integrity Discrepancy</span>
              </span>
            )}
          </div>
        </div>

        {/* Member balances list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {(groupBalances || []).filter(m => m && m.address).map(m => {
            const isUser = Boolean(currentAccount && m.address.toLowerCase() === currentAccount.toLowerCase());
            const isPositive = (m.netBalance || 0) > 0;
            const isNegative = (m.netBalance || 0) < 0;

            return (
              <div 
                key={m.address} 
                style={{
                  background: isUser ? 'var(--bg-surface-elevated)' : '#ffffff',
                  border: isUser ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{m.name}</span>
                      {isUser && <span className="badge badge-neutral" style={{ fontSize: '10px' }}>YOU</span>}
                      {m.role === 'ADMIN' && <span className="badge badge-pending" style={{ fontSize: '10px' }}>ADMIN</span>}
                    </div>
                    <div className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {shortenAddress(m.address)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div 
                    className="mono" 
                    style={{ 
                      fontWeight: 800, 
                      fontSize: '16px',
                      color: isPositive ? 'var(--color-emerald-light)' : isNegative ? 'var(--color-rose)' : 'var(--text-muted)'
                    }}
                  >
                    {formatMaskedCents(m.netBalance, isPrivacyMaskActive)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {isPositive ? 'to receive' : isNegative ? 'to pay' : 'settled'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
