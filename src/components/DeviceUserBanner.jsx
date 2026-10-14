import React, { useState } from 'react';
import { 
  Edit3, 
  Check,
  LogOut
} from 'lucide-react';
import { shortenAddress } from '../utils/cryptoUtils';

export default function DeviceUserBanner({
  profile,
  currentUser,
  isJoined,
  onJoinAndContinue,
  onUpdateName,
  _onOpenProfileModal,
  onSwitchAccount,
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
              {profile?.name || 'Google User'}
            </span>
            <span 
              className="mono" 
              style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-canvas)', padding: '2px 6px', borderRadius: '4px' }}
            >
              {shortenAddress(profile?.address || '')}
            </span>
            <span 
              className="badge"
              style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                background: 'rgba(66, 133, 244, 0.12)', 
                color: '#1a73e8', 
                border: '1px solid rgba(66, 133, 244, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{currentUser?.email || profile?.email || 'Google Verified'}</span>
            </span>
            <span 
              className="badge badge-approved"
              style={{ fontSize: '10px', padding: '2px 8px', fontWeight: 700 }}
            >
              🟢 {memberCount} {memberCount === 1 ? 'Member' : 'Members'} in Ledger
            </span>
          </div>
          {!isDismissed && (
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              Authenticated as <strong>{profile?.name}</strong>. Multiple roommates can log in with their own Google account on this device or phone, or sign in to the same account to share access seamlessly across Vercel and LAN.
            </p>
          )}
        </div>
      </div>

      {/* Action Options: Continue, Change user name, Switch Account */}
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
              title="Change your display name"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '34px' }}
            >
              <Edit3 size={13} style={{ color: 'var(--color-primary-light)' }} />
              <span>Change Name</span>
            </button>

            {onSwitchAccount && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onSwitchAccount}
                title="Switch Google Account or Log Out"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '12px', 
                  height: '34px',
                  border: '1px solid rgba(66, 133, 244, 0.35)',
                  background: 'rgba(66, 133, 244, 0.08)',
                  color: '#1a73e8',
                  fontWeight: 700
                }}
              >
                <LogOut size={13} />
                <span>Switch / Sign Out</span>
              </button>
            )}

            {!isDismissed ? (
              <button 
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleContinue}
                title={!isJoined ? 'Join Public Ledger with this user' : 'Continue with this user'}
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
                title="Show account details"
                style={{ fontSize: '11px', height: '34px', opacity: 0.85 }}
              >
                Account Info
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
