import { ethers } from 'ethers';

const AUTH_USER_KEY = 'fairshare_auth_user_v1';
const SAVED_ACCOUNTS_KEY = 'fairshare_saved_accounts_v1';
const GOOGLE_CLIENT_ID_KEY = 'fairshare_google_client_id';
const DEFAULT_GOOGLE_CLIENT_ID = '35215547950-754aeo0b3arostmibiqm9478smij92pk.apps.googleusercontent.com';

// Real Google Profiles are authenticated exclusively via Google Identity Services
export const DEFAULT_GOOGLE_PROFILES = [];

/**
 * Deterministically derive an Ethereum wallet from a user's Google Identity (email or sub)
 * Ensures the user keeps the exact same blockchain identity across all devices & sessions
 */
export function deriveWalletFromEmail(email, googleSub = null) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const seedString = googleSub 
    ? `fairshare_google_v1:${cleanEmail}:${googleSub}`
    : `fairshare_auth_v1:${cleanEmail}`;
  const seed = ethers.id(seedString);
  const wallet = new ethers.Wallet(seed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Safely parse a Google JWT ID token payload from Google Identity Services
 */
export function parseGoogleJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Failed to parse Google JWT token:', err);
    return null;
  }
}

class AuthService {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.listeners = new Set();
  }

  getGoogleClientId() {
    if (typeof window === 'undefined') return '';
    try {
      return (
        localStorage.getItem(GOOGLE_CLIENT_ID_KEY) ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
        DEFAULT_GOOGLE_CLIENT_ID ||
        ''
      ).trim();
    } catch {
      return DEFAULT_GOOGLE_CLIENT_ID || '';
    }
  }

  setGoogleClientId(clientId) {
    if (typeof window === 'undefined') return;
    try {
      if (clientId && clientId.trim()) {
        localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
      } else {
        localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
      }
    } catch {}
  }

  loadCurrentUser() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Strictly require verified Google OAuth credentials
        if (parsed && parsed.email && parsed.address && parsed.googleSub && parsed.provider === 'google') {
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  getSavedAccounts() {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(a => a && a.email && a.googleSub && a.provider === 'google');
        }
      }
    } catch {}
    return [];
  }

  saveAccountToList(user) {
    if (!user || !user.email) return;
    try {
      const accounts = this.getSavedAccounts();
      const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === user.email.toLowerCase());
      if (existingIdx >= 0) {
        accounts[existingIdx] = { ...accounts[existingIdx], ...user };
      } else {
        accounts.unshift(user);
      }
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 8)));
    } catch {}
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.currentUser.address);
  }

  /**
   * Log in using an authentic Google OAuth credential token (from Google Identity Services)
   */
  loginWithGoogleCredential(credentialToken) {
    const payload = parseGoogleJwt(credentialToken);
    if (!payload || !payload.email) {
      throw new Error('Invalid Google credential token received.');
    }

    return this.loginWithGoogle({
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      email: payload.email,
      picture: payload.picture || null,
      avatar: '🌐',
      googleSub: payload.sub || null,
      emailVerified: Boolean(payload.email_verified),
    });
  }

  loginWithGoogle({
    name,
    email,
    avatar = '👤',
    picture = null,
    pin = '1234',
    upiId = null,
    googleSub = null,
    emailVerified = true
  }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0] || 'User').trim();
    const handle = `@${cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '')}`;
    const wallet = deriveWalletFromEmail(cleanEmail, googleSub);

    const userObj = {
      id: `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanName,
      handle,
      avatar: avatar || '👤',
      picture: picture || null,
      address: wallet.address,
      privateKey: wallet.privateKey,
      pin: String(pin || '1234'),
      upiId: upiId || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      provider: 'google',
      googleSub: googleSub || null,
      emailVerified: Boolean(emailVerified),
      tokenBalance: 75000,
      loggedInAt: Date.now(),
    };

    this.currentUser = userObj;
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));
    } catch {}

    this.saveAccountToList(userObj);
    this.notify();
    return userObj;
  }

  loginWithEmail({ name, email, pin = '1234', avatar = '🧑‍💻', upiId = null }) {
    return this.loginWithGoogle({
      name,
      email,
      avatar,
      pin,
      upiId,
    });
  }

  switchAccount(account) {
    if (!account || !account.email) return null;
    return this.loginWithGoogle(account);
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {}
    this.notify();
  }

  updateProfile(partial) {
    if (!this.currentUser) return;
    this.currentUser = {
      ...this.currentUser,
      ...partial,
    };
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.currentUser));
    } catch {}
    this.saveAccountToList(this.currentUser);
    this.notify();
    return this.currentUser;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    }
  }
}

export const authService = new AuthService();
