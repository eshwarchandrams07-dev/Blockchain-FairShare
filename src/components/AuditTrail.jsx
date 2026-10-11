import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  Fuel, 
  Clock, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { shortenAddress } from '../utils/cryptoUtils';
import { blockchainService } from '../services/blockchainState';

export default function AuditTrail({ auditLogs, currentGroup }) {
  const [copiedTx, setCopiedTx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const groupLogs = auditLogs.filter(l => l.groupId === currentGroup.id);

  const filteredLogs = groupLogs.filter(l => {
    const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      l.details.toLowerCase().includes(q) ||
      l.actorName.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      l.txHash.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTx(hash);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CONFIRMED') || action.includes('APPROVED')) return 'badge-approved';
    if (action.includes('DISPUTE')) return 'badge-disputed';
    if (action.includes('CORRECTED')) return 'badge-corrected';
    if (action.includes('REJECTED')) return 'badge-rejected';
    if (action.includes('SETTLEMENT')) return 'badge-approved';
    return 'badge-neutral';
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={24} style={{ color: 'var(--color-primary-light)' }} />
              <h3 style={{ fontSize: '20px' }}>Tamper-Evident Audit Ledger</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              Every group creation, expense submission, consensus vote, dispute, and settlement is permanently anchored on-chain.
            </p>
          </div>

          <div className="badge badge-approved" style={{ padding: '8px 14px', fontSize: '13px' }}>
            <ShieldCheck size={16} />
            <span>State Root Cryptographically Verified</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="expenses-filter-bar">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            className="form-select" 
            style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
            value={selectedAction}
            onChange={e => setSelectedAction(e.target.value)}
          >
            <option value="ALL">All Event Types</option>
            <option value="EXPENSE_RECORDED">Expense Recorded</option>
            <option value="EXPENSE_APPROVED_VOTE">Vote Cast</option>
            <option value="EXPENSE_CONFIRMED">Expense Confirmed</option>
            <option value="DISPUTE_RAISED">Dispute Raised</option>
            <option value="DISPUTE_RESOLVED">Dispute Resolved</option>
            <option value="EXPENSE_CORRECTED">Expense Corrected</option>
            <option value="SETTLEMENT_CRYPTO_EXEC">Crypto Settlement</option>
            <option value="SETTLEMENT_PROPOSED">Off-Chain Settle</option>
            <option value="SETTLEMENT_CONFIRMED">Settlement Confirmed</option>
          </select>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '13px' }}
            placeholder="Search transaction hashes, actors, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline Entries */}
      {filteredLogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No audit events match your filter query.</p>
        </div>
      ) : (
        <div className="timeline">
          {filteredLogs.map(log => {
            const isCopied = copiedTx === log.txHash;

            return (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: '11px' }}>
                        {log.action}
                      </span>
                      <span className="timeline-title">{log.actorName}</span>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        ({shortenAddress(log.actor)})
                      </span>
                    </div>

                    <div className="timeline-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="timeline-details">{log.details}</div>

                  <div className="timeline-proof">
                    <span style={{ color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} />
                      Block #{log.blockNumber}
                    </span>

                    <span style={{ color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Fuel size={13} />
                      {log.gasUsed} gas
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <span>Tx: {shortenAddress(log.txHash)}</span>
                      <button
                        onClick={() => handleCopy(log.txHash)}
                        className="close-btn"
                        style={{ padding: '2px' }}
                        title="Copy Transaction Hash"
                      >
                        {isCopied ? <Check size={12} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={12} />}
                      </button>
                    </span>

                    {log.isBaseSepolia && (
                      <span className="badge" style={{ fontSize: '10px', background: 'rgba(0, 82, 255, 0.12)', color: '#0045D8', border: '1px solid rgba(0, 82, 255, 0.3)', padding: '1px 6px', fontWeight: 700 }}>
                        Base Sepolia
                      </span>
                    )}

                    {(log.explorerUrl || (log.txHash && log.txHash.startsWith('0x'))) && (
                      <a
                        href={log.explorerUrl || blockchainService.getExplorerTxUrl(log.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#0052FF',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                        title="View verified transaction on BaseScan Explorer"
                      >
                        <ExternalLink size={11} />
                        <span>BaseScan</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
