import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  ShieldCheck, 
  Mail, 
  User, 
  KeyRound, 
  ArrowRight, 
  ChevronRight, 
  Smartphone,
  Globe,
  X,
  Plus
} from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [savedAccounts] = useState(() => authService.getSavedAccounts());
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  
  // Custom manual form state
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPin, setCustomPin] = useState('1234');
  const [customAvatar, setCustomAvatar] = useState('🧑‍💻');
  const [formError, setFormError] = useState('');

  // AVATARS
  const AVATARS = ['🧑‍💻', '👩‍💼', '👨‍💻', '👩‍🎨', '👑', '🦁', '⚡', '💎', '🚀', '🌟'];

  const handleSelectAccount = (account) => {
    const user = authService.loginWithGoogle(account);
    if (onLoginSuccess) onLoginSuccess(user);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setFormError('Please enter a valid Google email address.');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    const user = authService.loginWithGoogle({
      name,
      email: customEmail.trim(),
      avatar: customAvatar,
      pin: customPin || '1234',
    });
    setIsGoogleModalOpen(false);
    if (onLoginSuccess) onLoginSuccess(user);
  };

  const handleDirectEmailSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!customName.trim()) {
      setFormError('Please enter your display name.');
      return;
    }
    const email = customEmail.trim() || `${customName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
    const user = authService.loginWithEmail({
      name: customName.trim(),
      email,
      pin: customPin || '1234',
      avatar: customAvatar,
    });
    if (onLoginSuccess) onLoginSuccess(user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)',
      position: 'relative',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.05) 70%, transparent 100%)',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            color: '#fff',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
            marginBottom: '16px'
          }}>
            <ArrowRightLeft size={30} />
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            FairShare <span style={{
              fontSize: '12px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#e0e7ff',
              color: '#4338ca',
              verticalAlign: 'middle',
              letterSpacing: '0.5px'
            }}>DECENTRALIZED</span>
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.5
          }}>
            Decentralized Peer-to-Peer Expense Ledger & Transparent Consensus Hub
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.03)',
          padding: '32px 28px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>
              Welcome to FairShare
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Sign in with your Google account to access your decentralized ledger
            </p>
          </div>

          {/* CONTINUE WITH GOOGLE BUTTON */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: '#ffffff',
              color: '#1f2937',
              border: '1.5px solid #e5e7eb',
              borderRadius: '14px',
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#4285F4';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Google Multi-Color SVG Icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Select Accounts (Fast 1-tap testing across devices) */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8' }}>
                Instant 1-Tap Google Accounts
              </span>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                ⚡ Auto-Wallet
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedAccounts.slice(0, 3).map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#eef2ff';
                    e.currentTarget.style.borderColor = '#c7d2fe';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: '#fff',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {acc.avatar || '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{acc.name}</span>
                        {acc.badge && (
                          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>
                            {acc.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ padding: '0 12px' }}>OR ENTER CUSTOM IDENTITY</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {/* Custom Identity Form */}
          <form onSubmit={handleDirectEmailSubmit}>
            {formError && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '8px 12px',
                color: '#e11d48',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                {formError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Display Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="e.g. Alex Sharma, Rahul, Roommate..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Email (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="email"
                  placeholder="e.g. alex@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  4-Digit PIN
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Avatar
                </label>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {AVATARS.slice(0, 5).map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setCustomAvatar(emoji)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        border: customAvatar === emoji ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        background: customAvatar === emoji ? '#eef2ff' : '#fff',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
              }}
            >
              <span>Continue to Public Ledger</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Feature Badges for Free Vercel Deployment */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '12px',
            padding: '10px 8px',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <Globe size={18} style={{ color: '#0ea5e9', margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>100% Free on Vercel</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Zero server costs</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '12px',
            padding: '10px 8px',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <ShieldCheck size={18} style={{ color: '#10b981', margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Web3 Cryptography</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Deterministic key</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '12px',
            padding: '10px 8px',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <Smartphone size={18} style={{ color: '#8b5cf6', margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Multi-Device Live</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Laptop & phone sync</div>
          </div>
        </div>
      </div>

      {/* Interactive Google Sign-In Chooser Modal */}
      {isGoogleModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={() => setIsGoogleModalOpen(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1f2937' }}>
                    Sign in with Google
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    to continue to FairShare
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* List of Google Accounts */}
            {!showCustomGoogle ? (
              <div>
                <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '14px', lineHeight: 1.4 }}>
                  Choose an account to sign in and generate your sovereign Web3 wallet:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {savedAccounts.map((account) => (
                    <div
                      key={account.email}
                      onClick={() => handleSelectAccount(account)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#4285F4';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                        }}>
                          {account.avatar || '👤'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                            {account.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {account.email}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#9ca3af' }} />
                    </div>
                  ))}
                </div>

                {/* Option to use another real Google account */}
                <button
                  type="button"
                  onClick={() => setShowCustomGoogle(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px dashed #cbd5e1',
                    background: '#f8fafc',
                    color: '#4f46e5',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} />
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              /* Custom Google Email Form */
              <form onSubmit={handleCustomGoogleSubmit}>
                <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '14px' }}>
                  Enter your Google Account details:
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eshwar Chandram"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                    Google Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogle(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      color: '#4b5563',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4285F4',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
              🔒 Cryptographically secured with SHA-256 Web3 Wallet Generation
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
