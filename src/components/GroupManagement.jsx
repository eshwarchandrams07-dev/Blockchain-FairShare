import React, { useState, useEffect } from 'react';
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
  Lock,
  Globe,
  KeyRound,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import { shortenAddress, formatCents } from '../utils/cryptoUtils';
import { APPROVAL_POLICIES, POLICY_LABELS } from '../services/blockchainState';
import { fetchDetectedLanIp, getEffectiveHost } from '../utils/networkUtils';
import CreateGroupModal from './CreateGroupModal';

export default function GroupManagement({
  groups,
  currentGroup,
  onSelectGroup,
  onCreateGroup,
  onAddMember,
  onLockGroup,
  currentAccount,
  groupBalances,
  onOpenEnterLedgerModal,
}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedKeyInModal, setCopiedKeyInModal] = useState(false);
  const [copiedIdInModal, setCopiedIdInModal] = useState(false);
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);

  // Add Member Form State
  const [memberAddress, setMemberAddress] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [formError, setFormError] = useState('');

  // Dynamic LAN IP state
  const [lanIp, setLanIp] = useState('');

  useEffect(() => {
    fetchDetectedLanIp().then(ip => {
      if (ip && ip !== 'localhost') setLanIp(ip);
    });
    const handleIpChanged = (e) => {
      if (e.detail && e.detail !== 'localhost') setLanIp(e.detail);
    };
    window.addEventListener('fairshare_lan_ip_changed', handleIpChanged);
    return () => window.removeEventListener('fairshare_lan_ip_changed', handleIpChanged);
  }, []);

  const currentMember = (currentGroup.members || []).find(m => m.address.toLowerCase() === currentAccount.toLowerCase());
  const isAdmin = currentMember?.role === 'ADMIN' || (currentGroup.members || []).length <= 1;

  const isGroupPrivate = currentGroup.isPrivate !== false;
  const currentLedgerId = currentGroup.ledgerId || (currentGroup.id === 1 ? 'PUB-101' : `GRP-${currentGroup.id}`);
  const currentPassword = currentGroup.password || currentGroup.inviteCode || 'FS-4020';

  // Invite URL and QR computation (dynamic for local or deployed domain)
  const effectiveHost = getEffectiveHost(lanIp);
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  const inviteUrl = isGroupPrivate
    ? `${protocol}//${effectiveHost}/?joinGroup=${currentGroup.id}&ledgerId=${encodeURIComponent(currentLedgerId)}&key=${encodeURIComponent(currentPassword)}`
    : `${protocol}//${effectiveHost}/?joinGroup=${currentGroup.id}`;

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
          text: `Join our decentralized expense group "${currentGroup.name}". ID: ${currentLedgerId}${isGroupPrivate ? `, Password: ${currentPassword}` : ' (Public Audit)'}`,
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

            {onOpenEnterLedgerModal && (
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={onOpenEnterLedgerModal}
                title="Enter any private ledger using its Ledger ID and Security Password"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.08)' }}
              >
                <KeyRound size={16} style={{ color: 'var(--color-amber)' }} />
                <span>Enter Private Ledger</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-neutral mono" style={{ fontSize: '11px' }}>
                Group ID #{currentGroup.id}
              </span>
              <span className={`badge ${isGroupPrivate ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: '11px' }}>
                {isGroupPrivate ? '🔒 Private Ledger (2FA)' : '🌐 Public Ledger (Auditable)'}
              </span>
            </div>
            <span className="badge badge-approved" style={{ fontSize: '11px' }}>
              <ShieldCheck size={12} />
              <span>Smart Contract Verified</span>
            </span>
          </div>

          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>{currentGroup.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            {currentGroup.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-dim)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>Creator:</strong> <span className="mono">{shortenAddress(currentGroup.creator)}</span>
            </div>
            <div>
              <strong>Created:</strong> {new Date(currentGroup.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div>
              <strong>Membership:</strong> {currentGroup.members.length} verified accounts
            </div>

            {isGroupPrivate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Ledger ID */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={13} style={{ color: 'var(--color-primary-light)' }} />
                    <strong>Ledger ID:</strong>{' '}
                    <span className="mono" style={{ color: 'var(--color-primary-light)', fontWeight: 800, letterSpacing: '1px' }}>
                      {currentLedgerId}
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy(currentLedgerId)}
                    style={{ fontSize: '11px', height: '24px', padding: '0 8px' }}
                  >
                    {copiedAddress === currentLedgerId ? 'Copied' : 'Copy ID'}
                  </button>
                </div>

                {/* Security Password */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <KeyRound size={13} style={{ color: 'var(--color-amber)' }} />
                    <strong>Password:</strong>{' '}
                    <span className="mono" style={{ color: 'var(--color-amber)', fontWeight: 800, letterSpacing: showDetailPassword ? '1px' : '2px' }}>
                      {showDetailPassword ? currentPassword : '••••••••'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowDetailPassword(!showDetailPassword)}
                      style={{ fontSize: '11px', height: '24px', padding: '0 8px' }}
                    >
                      {showDetailPassword ? 'Hide' : 'Show'}
                    </button>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopy(currentPassword)}
                      style={{ fontSize: '11px', height: '24px', padding: '0 8px' }}
                    >
                      {copiedAddress === currentPassword ? 'Copied' : 'Copy Pass'}
                    </button>
                  </div>
                </div>

                {/* Quick Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '4px' }}>
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
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald-light)', fontSize: '12px' }}>
                  <Globe size={14} />
                  <span>Public Transparency Ledger • Anyone can audit on-chain</span>
                </div>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsQrModalOpen(true)}
                  style={{ fontSize: '11px', height: '24px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <QrCode size={12} />
                  <span>Show QR</span>
                </button>
              </div>
            )}
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

        <div style={{ display: 'grid', gridTemplateColumns: currentGroup.members.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {currentGroup.members.length === 0 ? (
            <div 
              style={{ 
                padding: '40px 24px', 
                textAlign: 'center', 
                background: 'rgba(255, 255, 255, 0.6)', 
                border: '1px dashed var(--border-medium)', 
                borderRadius: 'var(--radius-lg)' 
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🌐</div>
              <h5 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                0 Users Initial in Public Ledger
              </h5>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                When users connect from different devices, users increase here automatically. Click "Continue" or "Join" in the device banner above to join with this device.
              </p>
            </div>
          ) : (
            currentGroup.members.map(m => {
            const isUser = m.address.toLowerCase() === currentAccount.toLowerCase();
            const balObj = groupBalances.find(b => b.address.toLowerCase() === m.address.toLowerCase());
            const bal = balObj ? balObj.netBalance : 0;
            const isCopied = copiedAddress === m.address;

            return (
              <div 
                key={m.address}
                style={{
                  background: isUser ? 'rgba(99, 102, 241, 0.08)' : '#f0f2f5',
                  border: isUser ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid #d9dce1',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: isUser ? '0 2px 8px rgba(99, 102, 241, 0.06)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
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
          })
          )}
        </div>
      </div>

      {/* Create Group Modal with Presets */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={onCreateGroup}
      />

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

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f0f2f5', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
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

            {/* Credentials Row for Private vs Public */}
            {isGroupPrivate ? (
              <div 
                style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '14px 16px',
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} style={{ color: 'var(--color-primary-light)' }} />
                    <span>Private 2FA Credentials (Required on Joining Device):</span>
                  </span>
                  {typeof navigator !== 'undefined' && !!navigator.share && (
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleNativeShare}
                      style={{ fontSize: '11px', height: '24px', padding: '0 8px', gap: '4px' }}
                      title="Share via WhatsApp, Telegram, iMessage..."
                    >
                      <Share2 size={12} />
                      <span>Share...</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {/* Ledger ID */}
                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>Ledger Access ID:</span>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                        {currentLedgerId}
                      </span>
                    </div>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        handleCopy(currentLedgerId);
                        setCopiedIdInModal(true);
                        setTimeout(() => setCopiedIdInModal(false), 2000);
                      }}
                      style={{ height: '24px', fontSize: '10px', padding: '0 6px' }}
                    >
                      {copiedIdInModal ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedIdInModal ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Security Password */}
                  <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>Security Password:</span>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-amber)', letterSpacing: showModalPassword ? '1px' : '2px' }}>
                        {showModalPassword ? currentPassword : '••••••••'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}
                      >
                        {showModalPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          handleCopy(currentPassword);
                          setCopiedKeyInModal(true);
                          setTimeout(() => setCopiedKeyInModal(false), 2000);
                        }}
                        style={{ height: '24px', fontSize: '10px', padding: '0 6px' }}
                      >
                        {copiedKeyInModal ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedKeyInModal ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '12px 16px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  color: 'var(--color-emerald-light)',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} />
                  <span>Public Transparency Ledger • Anyone can scan or click the link to audit records freely.</span>
                </div>
                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleNativeShare}
                    style={{ fontSize: '11px', height: '26px', padding: '0 8px', gap: '4px' }}
                  >
                    <Share2 size={12} />
                    <span>Share...</span>
                  </button>
                )}
              </div>
            )}

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
