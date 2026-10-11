import React from 'react';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Zap, 
  ShieldCheck, 
  Users
} from 'lucide-react';
import { formatCents, shortenAddress } from '../utils/cryptoUtils';

export default function DashboardOverview({
  currentGroup,
  groupBalances,
  expenses,
  currentAccount,
  onOpenAddExpense,
  onSwitchTab,
}) {
  // Calculate total approved volume
  const approvedExpenses = expenses.filter(e => e.groupId === currentGroup.id && e.status === 1);
  const totalVolume = approvedExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Find current user's balance
  const userBalanceObj = groupBalances.find(b => b.address.toLowerCase() === currentAccount.toLowerCase());
  const userNetBalance = userBalanceObj ? userBalanceObj.netBalance : 0;

  // Counts
  const pendingApprovalsCount = expenses.filter(e => e.groupId === currentGroup.id && e.status === 0).length;
  const activeDisputesCount = expenses.filter(e => e.groupId === currentGroup.id && e.status === 3).length;

  // Check sum of balances equals 0
  const totalBalanceSum = groupBalances.reduce((sum, b) => sum + b.netBalance, 0);
  const isIntegritySound = Math.abs(totalBalanceSum) <= 1; // within 1 cent rounding

  return (
    <div>
      {/* Top Welcome / Group Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px 28px', 
          marginBottom: '24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🏢</span>
            <h2 style={{ fontSize: '22px', color: 'var(--text-main)', fontWeight: 800 }}>
              {currentGroup.name === 'Shared Roommates Ledger' ? 'Shared Ledger' : currentGroup.name}
            </h2>
            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
              Group #{currentGroup.id}
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '640px', margin: 0 }}>
            {currentGroup.description}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
          <div className="kpi-value">{formatCents(totalVolume)}</div>
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
            {formatCents(userNetBalance)}
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
          {groupBalances.map(m => {
            const isUser = m.address.toLowerCase() === currentAccount.toLowerCase();
            const isPositive = m.netBalance > 0;
            const isNegative = m.netBalance < 0;

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
                    {formatCents(m.netBalance)}
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
