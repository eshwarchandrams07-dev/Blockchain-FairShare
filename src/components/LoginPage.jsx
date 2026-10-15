import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock,
  Settings,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isGisReady, setIsGisReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => authService.getGoogleClientId());
  const [savedAccounts] = useState(() => authService.getSavedAccounts());

  const googleBtnRef = useRef(null);
  const activeClientId = authService.getGoogleClientId();

  // Initialize official Google Identity Services
  useEffect(() => {
    let isMounted = true;

    const setupGoogleAuth = () => {
      if (typeof window === 'undefined') return;
      
      const currentId = authService.getGoogleClientId();
      if (!currentId) return;

      if (window.google?.accounts?.id) {
        setIsGisReady(true);
        try {
          window.google.accounts.id.initialize({
            client_id: currentId,
            callback: (response) => {
              if (response?.credential) {
                try {
                  const user = authService.loginWithGoogleCredential(response.credential);
                  if (onLoginSuccess) onLoginSuccess(user);
                } catch (err) {
                  console.error('Failed to parse Google credential:', err);
                  setErrorMsg(err.message || 'Failed to authenticate Google identity.');
                }
              } else {
                setErrorMsg('No Google credential returned. Please try signing in again.');
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_blue',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 320,
            });
          }

          // Optional: Display One Tap prompt on load
          try {
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed()) {
                // One Tap suppressed (e.g. cookie settings or duplicate prompt)
              }
            });
          } catch {}
        } catch (e) {
          console.warn('Google Identity button initialization notice:', e);
        }
      }
    };

    setupGoogleAuth();
    const interval = setInterval(() => {
      if (!isGisReady && isMounted) {
        setupGoogleAuth();
      }
    }, 800);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [clientIdInput, isGisReady, onLoginSuccess]);

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const trimmed = clientIdInput.trim();
    authService.setGoogleClientId(trimmed);
    setErrorMsg('');
    setShowSettings(false);
    setIsGisReady(false);
  };

  const lastVerifiedAccount = savedAccounts.length > 0 ? savedAccounts[0] : null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: 'radial-gradient(ellipse at top, #f0f4f9 0%, #e2e8f0 100%)',
      fontFamily: "'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#1f1f1f',
      boxSizing: 'border-box'
    }}>
      {/* Google Card Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '28px',
        padding: '40px 32px 32px 32px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        position: 'relative',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {/* Brand Header: Google G Logo & Security Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1f1f1f', display: 'block', lineHeight: 1.2 }}>
                Google Sign-In
              </span>
              <span style={{ fontSize: '11px', color: '#5f6368', fontWeight: 500 }}>
                FairShare Sovereign Ledger
              </span>
            </div>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#059669',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <ShieldCheck size={13} />
            <span>Google Auth Only</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 600,
          margin: '0 0 8px 0',
          color: '#1f1f1f',
          letterSpacing: '-0.3px',
          lineHeight: 1.25
        }}>
          Sign in to FairShare
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#444746',
          margin: '0 0 28px 0',
          lineHeight: 1.5
        }}>
          Every user must authenticate with a verified Google account. Your sovereign Ethereum blockchain key is derived deterministically from your Google identity.
        </p>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#b91c1c',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Authentication Error</div>
              <div style={{ fontSize: '12px', marginTop: '2px' }}>{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Case 1: Client ID is Set -> Show Official Google Sign-In Button */}
        {activeClientId ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0 20px 0'
          }}>
            {/* The Google Identity Services Native Button Mount */}
            <div 
              ref={googleBtnRef} 
              style={{ 
                minHeight: '46px', 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center' 
              }} 
            />

            {/* If GIS is still loading from script */}
            {!isGisReady && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#5f6368',
                marginTop: '10px'
              }}>
                <RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Connecting to Google Identity Services...</span>
              </div>
            )}

            {/* Last verified account on this browser (if any) */}
            {lastVerifiedAccount && (
              <div style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {lastVerifiedAccount.picture ? (
                    <img src={lastVerifiedAccount.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    lastVerifiedAccount.name?.charAt(0) || 'G'
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lastVerifiedAccount.name}
                    </span>
                    <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastVerifiedAccount.email}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Case 2: No Client ID configured yet -> Prompt Setup */
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0f172a', fontWeight: 700, fontSize: '14px' }}>
              <KeyRound size={16} style={{ color: '#2563eb' }} />
              <span>Google OAuth Setup Required</span>
            </div>
            <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              To enable authentic Google Sign-In, please enter your Google OAuth 2.0 Web Client ID from Google Cloud Console.
            </p>
            <form onSubmit={handleSaveClientId} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="123456789-abcdefg.apps.googleusercontent.com"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #94a3b8',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="submit"
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Connect Google OAuth
              </button>
            </form>
          </div>
        )}

        {/* Security & Cryptography Highlights */}
        <div style={{
          marginTop: '16px',
          paddingTop: '18px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>256-bit ECDSA Ethereum keys derived from verified Google sub</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={13} style={{ color: '#059669', flexShrink: 0 }} />
            <span>Zero passwords stored — authentic token validation</span>
          </div>
        </div>

        {/* Bottom Config Link for Client ID */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            <Settings size={11} />
            <span>{showSettings ? 'Hide Client ID settings' : 'Configure Google Client ID'}</span>
          </button>
        </div>

        {/* Collapsible Client ID Editor */}
        {showSettings && (
          <form onSubmit={handleSaveClientId} style={{
            marginTop: '12px',
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Active Google OAuth Client ID:
            </label>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="Paste Google Client ID here"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '11px',
                fontFamily: 'monospace',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Update ID
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer Details */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <span>FairShare Blockchain Network</span>
        <span>•</span>
        <span>Deterministic Identity Protocol</span>
      </div>
    </div>
  );
}
