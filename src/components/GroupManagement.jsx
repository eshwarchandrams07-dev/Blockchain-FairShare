import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Plus, 
  Copy, 
  Check, 
  Settings,
  Crown,
  QrCode,
  Share2,
  Sparkles,
  Lock
} from 'lucide-react';
import { shortenAddress, formatCents } from '../utils/cryptoUtils';
import { APPROVAL_POLICIES, POLICY_LABELS } from '../services/blockchainState';

export default function GroupManagement({
  groups,
  currentGroup,
  onSelectGroup,
  onCreateGroup,
  onAddMember,
  onLockGroup,
  currentAccount,
  groupBalances,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedKeyInModal, setCopiedKeyInModal] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPolicy, setNewGroupPolicy] = useState(APPROVAL_POLICIES.MAJORITY_VOTE);
  const [creatorName, setCreatorName] = useState('');
  const [customPasskey, setCustomPasskey] = useState('');

  // Add Member Form State
  const [memberAddress, setMemberAddress] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [formError, setFormError] = useState('');

  const currentMember = (currentGroup.members || []).find(m => m.address.toLowerCase() === currentAccount.toLowerCase());
  const isAdmin = currentMember?.role === 'ADMIN' || (currentGroup.members || []).length <= 1;

  // Invite URL and QR computation (dynamic for local or deployed Vercel domain)
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ':5173';
  const effectiveHost = isLocal ? `172.20.161.113${port}` : (typeof window !== 'undefined' ? window.location.host : '172.20.161.113:5173');
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const keyParam = currentGroup.inviteCode ? `&key=${encodeURIComponent(currentGroup.inviteCode)}` : '';
  const inviteUrl = `${protocol}//${effectiveHost}/?joinGroup=${currentGroup.id}${keyParam}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(inviteUrl)}`;

  const handleCopy = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${currentGroup.name} Ledger`,
          text: `Join our decentralized expense group "${currentGroup.name}". Passkey: ${currentGroup.inviteCode || 'FS-4020'}`,
          url: inviteUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyInvite();
        }
      }
    } else {
      handleCopyInvite();
    }
  };

  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!newGroupName.trim()) {
      setFormError('Please enter a group name');
      return;
    }

    try {
      onCreateGroup(newGroupName.trim(), newGroupDesc.trim(), Number(newGroupPolicy), creatorName.trim(), customPasskey.trim());
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setCustomPasskey('');
    } catch (err) {
      setFormError(err.message || 'Failed to create group');
    }
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!memberAddress.trim() || !memberAddress.startsWith('0x')) {
      setFormError('Please provide a valid Ethereum wallet address (0x...)');
      return;
    }
    if (!memberName.trim()) {
      setFormError('Please provide a member display name');
      return;
    }

    try {
      onAddMember(currentGroup.id, memberAddress.trim(), memberName.trim(), memberRole);
      setIsAddMemberModalOpen(false);
      setMemberAddress('');
      setMemberName('');
    } catch (err) {
      setFormError(err.message || 'Failed to add member to group');
    }
  };

  return (
    <div>
      {/* Top Selector & Group Control Bar */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Group:
            </label>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '260px', fontWeight: 600 }}
              value={currentGroup.id}
              onChange={e => onSelectGroup(Number(e.target.value))}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} (#{g.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setIsQrModalOpen(true)}
              title="Show QR Code and copy link to easily invite and add users to this ledger"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <QrCode size={16} style={{ color: 'var(--color-primary-light)' }} />
              <span>QR Code & Invite</span>
            </button>

            <button 
              className="btn btn-secondary"
              onClick={handleCopyInvite}
              title="Copy shareable link for friends on other devices to join this group"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copiedInvite ? <Check size={16} style={{ color: '#34d399' }} /> : <Copy size={16} />}
              <span>{copiedInvite ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
            </button>

            {onLockGroup && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onLockGroup(currentGroup.id)}
                title="Lock this private ledger session with passkey protection"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Lock size={16} style={{ color: 'var(--color-amber)' }} />
                <span>Lock Ledger</span>
              </button>
            )}

            <button 
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              <span>Create New Group</span>
            </button>

            {isAdmin && (
              <button 
                className="btn btn-secondary"
                onClick={() => setIsAddMemberModalOpen(true)}
              >
                <UserPlus size={16} />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Detail Card & Rule Policy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Info Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
              Group ID #{currentGroup.id}
            </span>
            <span className="badge badge-approved" style={{ fontSize: '11px' }}>
              <ShieldCheck size={12} />
              <span>Smart Contract Verified</span>
            </span>
          </div>

          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>{currentGroup.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            {currentGroup.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>Creator:</strong> <span className="mono">{shortenAddress(currentGroup.creator)}</span>
            </div>
            <div>
              <strong>Created:</strong> {new Date(currentGroup.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div>
              <strong>Membership:</strong> {currentGroup.members.length} verified accounts
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <strong>Private Passkey:</strong>{' '}
                <span className="mono" style={{ color: 'var(--color-primary-light)', fontWeight: 800, letterSpacing: '1px' }}>
                  {currentGroup.inviteCode || 'FS-4020'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsQrModalOpen(true)}
                  style={{ fontSize: '11px', height: '24px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="View QR Code to share ledger"
                >
                  <QrCode size={12} />
                  <span>Show QR</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopy(currentGroup.inviteCode || 'FS-4020')}
                  style={{ fontSize: '11px', height: '24px', padding: '0 8px' }}
                >
                  {copiedAddress === (currentGroup.inviteCode || 'FS-4020') ? 'Copied' : 'Copy Key'}
                </button>
                {onLockGroup && (
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onLockGroup(currentGroup.id)}
                    style={{ fontSize: '11px', height: '24px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Lock this private ledger session with passkey protection"
                  >
                    <Lock size={12} style={{ color: 'var(--color-amber)' }} />
                    <span>Lock</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Approval Policy Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Settings size={20} style={{ color: 'var(--color-primary-light)' }} />
            <h4 style={{ fontSize: '17px' }}>Consensus & Approval Policy</h4>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)', marginBottom: '4px' }}>
              {POLICY_LABELS[currentGroup.approvalPolicy]}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {currentGroup.approvalPolicy === APPROVAL_POLICIES.AUTO_APPROVE && 
                'Expenses are approved immediately on-chain. Any member can flag a dispute within the arbitration window to freeze balance adjustment.'}
              {currentGroup.approvalPolicy === APPROVAL_POLICIES.MAJORITY_VOTE && 
                'Expenses remain pending until more than 50% of participating members cast approval votes on-chain.'}
              {currentGroup.approvalPolicy === APPROVAL_POLICIES.UNANIMOUS_VOTE && 
                'Every single participating member (100%) must sign and approve before the ledger balances update.'}
              {currentGroup.approvalPolicy === APPROVAL_POLICIES.ADMIN_ONLY && 
                'Only group administrators can approve expenses. Protects shared budget allocations.'}
            </p>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            🔒 Smart contract rules cannot be tampered with or bypassed by any individual member.
          </div>
        </div>
      </div>

      {/* Member Roster List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: 'var(--color-primary-light)' }} />
            <span>Group Members Roster ({currentGroup.members.length})</span>
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {currentGroup.members.map(m => {
            const isUser = m.address.toLowerCase() === currentAccount.toLowerCase();
            const balObj = groupBalances.find(b => b.address.toLowerCase() === m.address.toLowerCase());
            const bal = balObj ? balObj.netBalance : 0;
            const isCopied = copiedAddress === m.address;

            return (
              <div 
                key={m.address}
                style={{
                  background: isUser ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                  border: isUser ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '28px' }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{m.name}</span>
                      {m.role === 'ADMIN' && (
                        <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                          <Crown size={10} /> ADMIN
                        </span>
                      )}
                      {isUser && <span className="badge badge-neutral" style={{ fontSize: '10px' }}>YOU</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {shortenAddress(m.address)}
                      </span>
                      <button
                        onClick={() => handleCopy(m.address)}
                        className="close-btn"
                        style={{ padding: '2px' }}
                        title="Copy Wallet Address"
                      >
                        {isCopied ? <Check size={12} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div 
                    className="mono" 
                    style={{ 
                      fontWeight: 800, 
                      fontSize: '15px',
                      color: bal > 0 ? 'var(--color-emerald-light)' : bal < 0 ? 'var(--color-rose)' : 'var(--text-muted)'
                    }}
                  >
                    {formatCents(bal)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    net balance
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Group Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deploy New Expense Group</h3>
              <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>

            {formError && (
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGroupSubmit}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ski Trip Colorado 2026, Flat 3B"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lift tickets, lodge stay, and group groceries"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approval Consensus Policy</label>
                <select
                  className="form-select"
                  value={newGroupPolicy}
                  onChange={e => setNewGroupPolicy(e.target.value)}
                >
                  <option value={APPROVAL_POLICIES.AUTO_APPROVE}>Optimistic (Auto-approve with dispute window)</option>
                  <option value={APPROVAL_POLICIES.MAJORITY_VOTE}>Majority Vote (Over 50% participant quorum)</option>
                  <option value={APPROVAL_POLICIES.UNANIMOUS_VOTE}>Unanimous Vote (100% participant agreement)</option>
                  <option value={APPROVAL_POLICIES.ADMIN_ONLY}>Admin Only (Administrator approves)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Admin Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alice"
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custom Private Passkey (Optional)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-generated if empty</span>
                </label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="e.g. FS-9842"
                  value={customPasskey}
                  onChange={e => setCustomPasskey(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Deploy Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Invite Member to {currentGroup.name}</h3>
              <button className="close-btn" onClick={() => setIsAddMemberModalOpen(false)}>
                ×
              </button>
            </div>

            {formError && (
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', color: 'var(--color-rose)', fontSize: '13px', fontWeight: 600 }}>
                {formError}
              </div>
            )}

            {/* Quick Share / QR Code Option */}
            <div 
              style={{ 
                background: 'rgba(99, 102, 241, 0.08)', 
                border: '1px solid rgba(99, 102, 241, 0.25)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px', 
                marginBottom: '20px' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  <QrCode size={18} style={{ color: 'var(--color-primary-light)' }} />
                  <span>Fast Invite via QR Code or Link</span>
                </div>
                <span className="badge badge-approved" style={{ fontSize: '10px' }}>
                  Recommended
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
                Friends can scan this QR code with their mobile phone or click the invite link to instantly join this ledger with an auto-assigned Web3 identity.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div 
                  style={{ 
                    background: '#ffffff', 
                    padding: '6px', 
                    borderRadius: '10px', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  onClick={() => { setIsAddMemberModalOpen(false); setIsQrModalOpen(true); }}
                  title="Click to enlarge QR Code"
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan QR Code to join ledger" 
                    style={{ width: '80px', height: '80px', display: 'block', borderRadius: '4px' }} 
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Invite Link:</span>
                    <span className="badge badge-neutral mono" style={{ fontSize: '10px' }}>
                      Passkey: {currentGroup.inviteCode || 'FS-4020'}
                    </span>
                  </div>
                  <div 
                    className="mono" 
                    style={{ 
                      fontSize: '11px', 
                      color: 'var(--color-primary-light)', 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '6px 10px', 
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {inviteUrl}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleCopyInvite}
                      style={{ fontSize: '11px', height: '28px', gap: '4px' }}
                    >
                      {copiedInvite ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                      <span>{copiedInvite ? 'Link Copied!' : 'Copy Invite Link'}</span>
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setIsAddMemberModalOpen(false); setIsQrModalOpen(true); }}
                      style={{ fontSize: '11px', height: '28px', gap: '4px' }}
                    >
                      <QrCode size={12} />
                      <span>Full QR Code</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                Or manually add Ethereum Wallet (0x...)
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <form onSubmit={handleAddMemberSubmit}>
              <div className="form-group">
                <label className="form-label">Ethereum Wallet Address</label>
                <input
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={memberAddress}
                  onChange={e => setMemberAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Name / Alias</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Elena, Sam"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={memberRole}
                  onChange={e => setMemberRole(e.target.value)}
                >
                  <option value="MEMBER">Standard Member</option>
                  <option value="ADMIN">Group Administrator</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddMemberModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Member On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated QR Code & Share Invite Link Modal */}
      {isQrModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsQrModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary-light)'
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>Add Users to Ledger</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentGroup.name} • Group #{currentGroup.id}
                  </div>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsQrModalOpen(false)}>
                ×
              </button>
            </div>

            {/* QR Card Container */}
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 116, 144, 0.08) 100%)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 20px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>📷</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Scan with Phone Camera
                </span>
                <span 
                  style={{
                    fontSize: '11px',
                    background: 'rgba(21, 128, 61, 0.15)',
                    color: 'var(--color-emerald)',
                    border: '1px solid rgba(21, 128, 61, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}
                >
                  Instant 1-Tap Join
                </span>
              </div>

              {/* QR Image Box */}
              <div 
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '18px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                  border: '2px solid rgba(99, 102, 241, 0.25)',
                  marginBottom: '16px',
                  display: 'inline-block'
                }}
              >
                <img 
                  src={qrCodeUrl}
                  alt={`QR Code to join ${currentGroup.name}`}
                  style={{
                    width: '200px',
                    height: '200px',
                    display: 'block',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>
                Scan to join <span style={{ color: 'var(--color-primary-light)' }}>{currentGroup.name}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.5 }}>
                Opens directly in Safari or Chrome. Automatically authenticates the user into this private ledger and connects to the blockchain.
              </div>
            </div>

            {/* Copy Invite Link Section */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--color-primary-light)' }} />
                  <span>Shareable Ledger Invite Link</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Group #{currentGroup.id}</span>
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={inviteUrl} 
                  className="form-input mono" 
                  style={{ fontSize: '12px', background: 'rgba(0,0,0,0.25)', color: 'var(--text-dim)', flex: 1 }}
                  onClick={e => e.target.select()}
                />
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopyInvite}
                  style={{ minWidth: '130px', gap: '6px' }}
                >
                  {copiedInvite ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedInvite ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Passkey & Web Share Row */}
            <div 
              style={{ 
                background: 'var(--bg-surface-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block' }}>Private Passkey:</span>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-light)', letterSpacing: '1px' }}>
                  {currentGroup.inviteCode || 'FS-4020'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    handleCopy(currentGroup.inviteCode || 'FS-4020');
                    setCopiedKeyInModal(true);
                    setTimeout(() => setCopiedKeyInModal(false), 2000);
                  }}
                  style={{ fontSize: '11px' }}
                >
                  {copiedKeyInModal ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                  <span>{copiedKeyInModal ? 'Key Copied' : 'Copy Key'}</span>
                </button>

                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleNativeShare}
                    style={{ fontSize: '11px', gap: '4px' }}
                    title="Share via WhatsApp, Telegram, iMessage..."
                  >
                    <Share2 size={12} />
                    <span>Share...</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsQrModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
