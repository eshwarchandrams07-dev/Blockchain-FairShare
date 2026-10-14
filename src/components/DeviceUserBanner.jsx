import React, { useState } from 'react';
import { 
  UserCheck, 
  Edit3, 
  Check, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  Globe,
  Lock,
  X 
} from 'lucide-react';
import { shortenAddress } from '../utils/cryptoUtils';

export default function DeviceUserBanner({
  profile,
  isJoined,
  onJoinAndContinue,
  onUpdateName,
  onOpenProfileModal,
  memberCount = 0,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [isDismissed, setIsDismissed] = useState(false);

  const handleContinue = () => {
    if (!isJoined && onJoinAndContinue) {
      onJoinAndContinue();
    }
    setIsDismissed(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onUpdateName(nameInput.trim());
    setIsEditing(false);
  };

  return (
    <div 
      className="glass-panel"
      style={{
        marginBottom: '20px',
        padding: isDismissed ? '10px 18px' : '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        background: isDismissed 
          ? 'rgba(255, 255, 255, 0.7)' 
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 116, 144, 0.08) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-subtle)',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Device & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: 1 }}>
        <div 
          style={{
            width: isDismissed ? '34px' : '44px',
            height: isDismissed ? '34px' : '44px',
            borderRadius: '12px',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isDismissed ? '16px' : '22px',
            color: '#fff',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
          }}
        >
          {profile?.avatar || '🧑‍💻'}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: isDismissed ? '13px' : '15px', fontWeight: 800, color: 'var(--text-main)' }}>
              {profile?.name || 'Device User'}
            </span>
            <span 
              className="mono" 
              style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-canvas)', padding: '2px 6px', borderRadius: '4px' }}
            >
              {shortenAddress(profile?.address || '')}
            </span>
            <span 
              className="badge badge-approved"
              style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '2px 8px' }}
            >
              1 User Per Device
            </span>
            {!isJoined && (
              <span 
                className="badge badge-pending"
                style={{ fontSize: '10px', padding: '2px 8px' }}
              >
                Initial Ledger: {memberCount} Users
              </span>
            )}
          </div>
          {!isDismissed && (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {!isJoined
                ? `Public Ledger starts with 0 users initial. Click continue to join as this device's user (${profile?.name}), or change user name.`
                : 'This device already has a user in the ledger. You cannot add another user on this device. You can either continue with the same user or change your user name.'}
            </p>
          )}
        </div>
      </div>

      {/* Action Options: Continue with same user or Change user name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input 
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter new user name"
              className="form-input"
              style={{ 
                height: '34px', 
                fontSize: '13px', 
                width: '180px', 
                fontWeight: 600,
                padding: '4px 10px'
              }}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              style={{ height: '34px', fontSize: '12px', gap: '4px' }}
            >
              <Check size={14} />
              <span>Save Name</span>
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setNameInput(profile?.name || '');
                setIsEditing(false);
              }}
              style={{ height: '34px', fontSize: '12px' }}
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setNameInput(profile?.name || '');
                setIsEditing(true);
              }}
              title="Change your user name on this device"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '34px' }}
            >
              <Edit3 size={13} style={{ color: 'var(--color-primary-light)' }} />
              <span>Change User Name</span>
            </button>

            {!isDismissed ? (
              <button 
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleContinue}
                title={!isJoined ? 'Join Public Ledger with this device user' : 'Continue with this user on this device'}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '34px' }}
              >
                <Check size={14} />
                <span>
                  {!isJoined 
                    ? `Join as ${profile?.name || 'User'}`
                    : `Continue with ${profile?.name?.split(' ')[0] || 'User'}`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDismissed(false)}
                title="Show device identity details"
                style={{ fontSize: '11px', height: '34px', opacity: 0.85 }}
              >
                Device Info
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
