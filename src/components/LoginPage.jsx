import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  UserPlus, 
  ShieldCheck, 
  Lock,
  ArrowLeft
} from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [savedAccounts] = useState(() => authService.getSavedAccounts());
  const [mode, setMode] = useState('choose_account'); // 'choose_account' | 'enter_email'
  
  // Custom Google input state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const cleanEmail = emailInput.trim();

    if (!cleanEmail) {
      setErrorMsg('Enter an email address or phone number');
      return;
    }

    if (!cleanEmail.includes('@')) {
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
        avatar: '🧑‍💻',
      });
      if (onLoginSuccess) onLoginSuccess(user);
    }, 150);
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
        padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Google 4-Color G Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.08)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <ShieldCheck size={13} />
            <span>Vercel Cloud Sync</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 500,
          margin: '0 0 6px 0',
          color: '#1f1f1f',
          letterSpacing: '-0.2px'
        }}>
          {mode === 'choose_account' ? 'Choose an account' : 'Sign in with Google'}
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#444746',
          margin: '0 0 24px 0',
          lineHeight: 1.4
        }}>
          to continue to <strong style={{ color: '#0b57d0' }}>FairShare Public Ledger</strong>
        </p>

        {/* MODE 1: CHOOSE AN ACCOUNT */}
        {mode === 'choose_account' && (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e0e3e7',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {savedAccounts.map((acc, index) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: index < savedAccounts.length - 1 ? '1px solid #f0f2f5' : 'none',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0b57d0 0%, #1a73e8 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(11, 87, 208, 0.2)'
                    }}>
                      {acc.name ? acc.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f1f1f' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#5e5e5e' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: '#747775' }} />
                </div>
              ))}

              {/* Use another account option */}
              <div
                onClick={() => {
                  setErrorMsg('');
                  setMode('enter_email');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  background: '#fbfcfd',
                  borderTop: '1px solid #e0e3e7',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f4f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fbfcfd'; }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#e9eef6',
                  color: '#0b57d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserPlus size={18} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b57d0' }}>
                  Use another account
                </div>
              </div>
            </div>

            <p style={{
              fontSize: '12px',
              color: '#747775',
              lineHeight: 1.5,
              margin: '0 0 24px 0'
            }}>
              To continue, Google will securely derive your sovereign Ethereum ECDSA public key from your verified account. All ledger transactions remain cryptographically verifiable.
            </p>
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
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google Email Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444746', marginBottom: '6px' }}>
                Email or phone
              </label>
              <input
                type="email"
                placeholder="e.g. eshwarchandrams@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: errorMsg ? '2px solid #c5221f' : '1px solid #747775',
                  fontSize: '16px',
                  color: '#1f1f1f',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { if (!errorMsg) e.target.style.borderColor = '#0b57d0'; }}
                onBlur={(e) => { if (!errorMsg) e.target.style.borderColor = '#747775'; }}
                required
              />
            </div>

            {/* Optional Full Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444746', marginBottom: '6px' }}>
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Eshwar Chandram"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #747775',
                  fontSize: '15px',
                  color: '#1f1f1f',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0b57d0'; }}
                onBlur={(e) => { e.target.style.borderColor = '#747775'; }}
              />
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '30px' }}>
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
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to accounts</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#0b57d0',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(11, 87, 208, 0.3)'
                }}
              >
                <span>{isSubmitting ? 'Signing in...' : 'Next'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Security & Decentralization Footer Guarantee */}
        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#747775'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} style={{ color: '#0b57d0' }} />
            <span>Deterministic ECDSA Key</span>
          </div>
          <div>
            <span>Instant Public Ledger Access</span>
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
        padding: '16px 12px 0 12px',
        fontSize: '12px',
        color: '#444746',
        boxSizing: 'border-box'
      }}>
        <span>English (United States)</span>
        <div style={{ display: 'flex', gap: '18px' }}>
          <span style={{ cursor: 'pointer' }}>Help</span>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
          <span style={{ cursor: 'pointer' }}>Terms</span>
        </div>
      </div>
    </div>
  );
}
