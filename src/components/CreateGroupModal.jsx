import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Globe, 
  KeyRound, 
  Sparkles,
  Building,
  GraduationCap,
  Users2,
  Plane,
  Code2,
  UtensilsCrossed
} from 'lucide-react';
import { APPROVAL_POLICIES } from '../services/blockchainState';

const TEMPLATES = [
  {
    id: 'flatmates',
    name: 'Apt Flatmates (Rent & Groceries)',
    category: 'Private',
    icon: Building,
    desc: 'Shared rent, Wi-Fi bills, cook/maid fees, and bulk household groceries.',
    policy: APPROVAL_POLICIES.MAJORITY_VOTE,
    defaultId: 'FLAT-402',
    defaultPass: 'ROOMIE-2026',
    isPrivate: true,
  },
  {
    id: 'trip',
    name: 'Vacation & Road Trip',
    category: 'Private',
    icon: Plane,
    desc: 'Encrypted travel fund for resort bookings, fuel, food, and activities.',
    policy: APPROVAL_POLICIES.UNANIMOUS_VOTE,
    defaultId: 'TRIP-GOA',
    defaultPass: 'TRAVEL-777',
    isPrivate: true,
  },
  {
    id: 'startup',
    name: 'Stealth Hackathon / Startup Team',
    category: 'Private',
    icon: Code2,
    desc: 'Confidential founder pooled expenses, API credits, and SaaS subscriptions.',
    policy: APPROVAL_POLICIES.MAJORITY_VOTE,
    defaultId: 'DEV-TEAM',
    defaultPass: 'BUILD-9021',
    isPrivate: true,
  },
  {
    id: 'campus',
    name: 'Campus Tech Club / Society',
    category: 'Public',
    icon: GraduationCap,
    desc: 'Open community treasury for workshops, speaker events, and hackathon prizes.',
    policy: APPROVAL_POLICIES.MAJORITY_VOTE,
    defaultId: 'CAMPUS-101',
    defaultPass: '',
    isPrivate: false,
  },
  {
    id: 'mess',
    name: 'Hostel Mess & Community Pool',
    category: 'Public',
    icon: UtensilsCrossed,
    desc: 'Publicly auditable mess fee collection and shared kitchen supply replenishment.',
    policy: APPROVAL_POLICIES.MAJORITY_VOTE,
    defaultId: 'MESS-202',
    defaultPass: '',
    isPrivate: false,
  },
  {
    id: 'opensource',
    name: 'Open-Source Project Fund',
    category: 'Public',
    icon: Users2,
    desc: 'Decentralized public treasury for developer bounties and infrastructure grants.',
    policy: APPROVAL_POLICIES.ADMIN_ONLY,
    defaultId: 'DAO-BOUNTY',
    defaultPass: '',
    isPrivate: false,
  },
];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
}) {
  if (!isOpen) return null;

  return (
    <CreateGroupModalContent
      onClose={onClose}
      onCreateGroup={onCreateGroup}
    />
  );
}

function CreateGroupModalContent({ onClose, onCreateGroup }) {
  const [isPrivateChoice, setIsPrivateChoice] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPolicy, setNewGroupPolicy] = useState(APPROVAL_POLICIES.MAJORITY_VOTE);
  const [customLedgerId, setCustomLedgerId] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [formError, setFormError] = useState('');

  const handleApplyTemplate = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setIsPrivateChoice(tmpl.isPrivate);
    setNewGroupName(tmpl.name);
    setNewGroupDesc(tmpl.desc);
    setNewGroupPolicy(tmpl.policy);
    setCustomLedgerId(tmpl.defaultId);
    setCustomPassword(tmpl.defaultPass);
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newGroupName.trim()) {
      setFormError('Please provide a ledger name');
      return;
    }

    try {
      onCreateGroup(
        newGroupName.trim(),
        newGroupDesc.trim(),
        Number(newGroupPolicy),
        '',
        isPrivateChoice,
        customLedgerId.trim(),
        customPassword.trim()
      );
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to deploy blockchain ledger');
    }
  };

  const relevantTemplates = TEMPLATES.filter(t => t.isPrivate === isPrivateChoice);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isPrivateChoice ? 'var(--grad-primary)' : 'var(--grad-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              {isPrivateChoice ? <Lock size={20} /> : <Globe size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Deploy Blockchain Ledger
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                {isPrivateChoice ? 'Encrypted Sovereign 2FA Vault' : 'Open Community Transparency Pool'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: 'var(--radius-md)', 
            padding: '10px 14px', 
            marginBottom: '16px', 
            color: 'var(--color-rose)', 
            fontSize: '13px', 
            fontWeight: 600 
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Architecture Mode Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Ledger Mode *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => {
                  setIsPrivateChoice(true);
                  if (selectedTemplateId) {
                    const firstPvt = TEMPLATES.find(t => t.isPrivate);
                    if (firstPvt) handleApplyTemplate(firstPvt);
                  }
                }}
                style={{
                  border: isPrivateChoice ? '2px solid var(--color-primary)' : '1px solid var(--border-medium)',
                  background: isPrivateChoice ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-canvas)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isPrivateChoice ? '0 0 0 1px var(--color-primary)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: isPrivateChoice ? 'var(--color-primary-light)' : 'var(--text-main)', marginBottom: '4px' }}>
                  <Lock size={16} />
                  <span>Private Sovereign Vault</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Passkey Gated: Hidden from outsiders. Joining devices must provide correct Ledger ID & Password.
                </div>
              </div>

              <div 
                onClick={() => {
                  setIsPrivateChoice(false);
                  if (selectedTemplateId) {
                    const firstPub = TEMPLATES.find(t => !t.isPrivate);
                    if (firstPub) handleApplyTemplate(firstPub);
                  }
                }}
                style={{
                  border: !isPrivateChoice ? '2px solid var(--color-emerald)' : '1px solid var(--border-medium)',
                  background: !isPrivateChoice ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-canvas)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: !isPrivateChoice ? '0 0 0 1px var(--color-emerald)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: !isPrivateChoice ? 'var(--color-emerald-light)' : 'var(--text-main)', marginBottom: '4px' }}>
                  <Globe size={16} />
                  <span>Public Transparency Ledger</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Open Auditing: Anyone can view, audit receipt hashes, and verify mathematical invariants on-chain.
                </div>
              </div>
            </div>
          </div>

          {/* Quick-Start Templates */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} style={{ color: 'var(--color-amber)' }} />
              <label className="form-label" style={{ margin: 0 }}>Quick-Start Presets</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {relevantTemplates.map(tmpl => {
                const IconComp = tmpl.icon;
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: 'var(--text-main)', marginBottom: '2px' }}>
                      <IconComp size={14} style={{ color: isPrivateChoice ? 'var(--color-primary-light)' : 'var(--color-emerald-light)' }} />
                      <span>{tmpl.name.split(' (')[0]}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      ID: {tmpl.defaultId}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ledger Name */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Ledger Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder={isPrivateChoice ? "e.g. Apartment 402 Flatmates" : "e.g. Campus Tech Club Treasury"}
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Description / Purpose</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Monthly rent, groceries, electricity, and shared Wi-Fi"
              value={newGroupDesc}
              onChange={e => setNewGroupDesc(e.target.value)}
            />
          </div>

          {/* Private Credentials if Private */}
          {isPrivateChoice && (
            <div style={{ 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-md)', 
              padding: '14px 16px', 
              marginBottom: '16px' 
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-light)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} />
                <span>2FA Joining Credentials for Roommates / Peers</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Custom Ledger ID</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="e.g. APT-402"
                    value={customLedgerId}
                    onChange={e => setCustomLedgerId(e.target.value.toUpperCase())}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Security Password</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="e.g. ROOMIE2026"
                    value={customPassword}
                    onChange={e => setCustomPassword(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
                Leave empty to automatically generate random secure credentials.
              </div>
            </div>
          )}

          {/* Consensus Policy */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Consensus Approval Rule</label>
            <select
              className="form-select"
              value={newGroupPolicy}
              onChange={e => setNewGroupPolicy(Number(e.target.value))}
            >
              <option value={APPROVAL_POLICIES.MAJORITY_VOTE}>
                Majority Vote (&gt;50% participants agree) — Best for Flatmates &amp; Teams
              </option>
              <option value={APPROVAL_POLICIES.UNANIMOUS_VOTE}>
                Unanimous Consensus (100% agreement required) — Best for Trips
              </option>
              <option value={APPROVAL_POLICIES.ADMIN_ONLY}>
                Admin Verification Only (Single Treasurer signs off) — Best for Clubs
              </option>
              <option value={APPROVAL_POLICIES.AUTO_APPROVE}>
                Instant Auto-Approve (Trust-based logging)
              </option>
            </select>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <ShieldCheck size={16} />
              <span>Deploy {isPrivateChoice ? 'Private Vault' : 'Public Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
