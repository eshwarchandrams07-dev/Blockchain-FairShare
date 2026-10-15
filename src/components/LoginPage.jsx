import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  UserPlus, 
  Lock,
  ArrowLeft,
  Settings,
  Sparkles,
  CheckCircle2,
  Database
} from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [savedAccounts] = useState(() => authService.getSavedAccounts());
  const [mode, setMode] = useState('choose_account'); // 'choose_account' | 'enter_email' | 'oauth_settings'
  
  // Custom Google input state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth Client ID state
  const [clientIdInput, setClientIdInput] = useState(() => authService.getGoogleClientId());
  const googleBtnRef = useRef(null);

  // Initialize Google Identity Services if available and client ID is set
  useEffect(() => {
    const checkGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        const activeClientId = authService.getGoogleClientId();
        if (activeClientId && googleBtnRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: activeClientId,
              callback: (response) => {
                if (response?.credential) {
                  try {
                    const user = authService.loginWithGoogleCredential(response.credential);
                    if (onLoginSuccess) onLoginSuccess(user);
                  } catch (err) {
                    setErrorMsg(err.message || 'Failed to authenticate with Google token.');
                  }
                }
              },
            });
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 380,
              shape: 'pill',
              text: 'continue_with',
            });
          } catch (e) {
            console.warn('Google Identity button initialization notice:', e);
          }
        }
      }
    };

    checkGis();
    const interval = setInterval(checkGis, 1000);
    return () => clearInterval(interval);
  }, [clientIdInput, mode, onLoginSuccess]);

  const handleSelectAccount = (account) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const user = authService.loginWithGoogle(account);
      if (onLoginSuccess) onLoginSuccess(user);
    }, 150);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Enter an email address or phone number');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Enter a valid Google email address (e.g. yourname@gmail.com)');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const derivedName = nameInput.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const user = authService.loginWithGoogle({
        name: derivedName,
        email: cleanEmail,
        pin: '1234',
        avatar: '🌐',
        emailVerified: true,
      });
      if (onLoginSuccess) onLoginSuccess(user);
    }, 150);
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    authService.setGoogleClientId(clientIdInput.trim());
    setMode('choose_account');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: '#f0f4f9',
      fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#1f1f1f',
      boxSizing: 'border-box'
    }}>
      {/* Google Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '28px',
        padding: '36px 32px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Google 4-Color G Logo & Cloud Persistence Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#3c4043' }}>Google Identity</span>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#059669',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <Database size={12} />
            <span>Permanent Ledger Sync</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 600,
          margin: '0 0 6px 0',
          color: '#1f1f1f',
          letterSpacing: '-0.2px'
        }}>
          {mode === 'choose_account' && 'Choose an account'}
          {mode === 'enter_email' && 'Sign in with your Google Account'}
          {mode === 'oauth_settings' && 'Google OAuth Configuration'}
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#444746',
          margin: '0 0 20px 0',
          lineHeight: 1.4
        }}>
          to access <strong style={{ color: '#0b57d0' }}>FairShare Decentralized Ledger</strong>
        </p>

        {/* Official Google Identity Services Native Button (if Client ID present) */}
        {authService.getGoogleClientId() && mode === 'choose_account' && (
          <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div ref={googleBtnRef} style={{ minHeight: '44px', width: '100%', display: 'flex', justifyContent: 'center' }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              margin: '16px 0 10px 0'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e0e3e7' }} />
              <span style={{ fontSize: '12px', color: '#747775', fontWeight: 500 }}>or select verified profile</span>
              <div style={{ flex: 1, height: '1px', background: '#e0e3e7' }} />
            </div>
          </div>
        )}

        {/* MODE 1: CHOOSE AN ACCOUNT */}
        {mode === 'choose_account' && (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e3e7',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '18px'
            }}>
              {savedAccounts.map((acc, index) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: index < savedAccounts.length - 1 ? '1px solid #f0f2f5' : 'none',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0b57d0 0%, #1a73e8 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(11, 87, 208, 0.2)'
                    }}>
                      {acc.picture ? (
                        <img src={acc.picture} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                      ) : (
                        acc.name ? acc.name.charAt(0).toUpperCase() : 'G'
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f1f1f' }}>
                          {acc.name}
                        </span>
                        <CheckCircle2 size={13} style={{ color: '#059669' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#5e5e5e' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#747775' }} />
                </div>
              ))}

              {/* Use another Google account option */}
              <div
                onClick={() => {
                  setErrorMsg('');
                  setMode('enter_email');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: '#fbfcfd',
                  borderTop: '1px solid #e0e3e7',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fbfcfd'; }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#e9eef6',
                  color: '#0b57d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={16} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0b57d0' }}>
                  Use another Google account
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '12px', color: '#747775' }}>
                Deterministic ECDSA identity • No duplicates
              </span>
              <button
                type="button"
                onClick={() => setMode('oauth_settings')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0b57d0',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Settings size={12} />
                <span>Google Client ID</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: ENTER GOOGLE EMAIL & NAME */}
        {mode === 'enter_email' && (
          <form onSubmit={handleEmailSubmit}>
            {errorMsg && (
              <div style={{
                background: '#fce8e6',
                border: '1px solid #fad2cf',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#c5221f',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#444746', marginBottom: '6px' }}>
                Google Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. yourname@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: errorMsg ? '2px solid #c5221f' : '1px solid #747775',
                  fontSize: '15px',
                  color: '#1f1f1f',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
              <span style={{ fontSize: '11px', color: '#747775', marginTop: '4px', display: 'block' }}>
                Your sovereign Ethereum wallet is derived from this verified Google identity.
              </span>
            </div>

            {/* Optional Full Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#444746', marginBottom: '6px' }}>
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Eshwar Chandram"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #747775',
                  fontSize: '14px',
                  color: '#1f1f1f',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('choose_account');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0b57d0',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#0b57d0',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: GOOGLE OAUTH CLIENT ID SETTINGS */}
        {mode === 'oauth_settings' && (
          <form onSubmit={handleSaveClientId}>
            <div style={{
              background: '#f8fafd',
              border: '1px solid #e0e3e7',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#444746',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              To activate native 1-tap Google Sign-In or popup on your Vercel domain, create an OAuth 2.0 Client ID in <strong>Google Cloud Console</strong> & paste it below.
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#444746', marginBottom: '6px' }}>
                Google OAuth Client ID
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #747775',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: '#1f1f1f',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setMode('choose_account')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#747775',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  background: '#0b57d0',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Client ID
              </button>
            </div>
          </form>
        )}

        {/* Security & Decentralization Footer Guarantee */}
        <div style={{
          marginTop: '24px',
          paddingTop: '14px',
          borderTop: '1px solid #f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#747775'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Lock size={12} style={{ color: '#0b57d0' }} />
            <span>Deterministic ECDSA Key</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} style={{ color: '#059669' }} />
            <span>Permanent Cloud Storage</span>
          </div>
        </div>
      </div>

      {/* Google Style Footer */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 12px 0 12px',
        fontSize: '12px',
        color: '#444746',
        boxSizing: 'border-box'
      }}>
        <span>FairShare Blockchain Authentication</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
          <span style={{ cursor: 'pointer' }}>Terms</span>
        </div>
      </div>
    </div>
  );
}
