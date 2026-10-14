import { ethers } from 'ethers';

const AUTH_USER_KEY = 'fairshare_auth_user_v1';
const SAVED_ACCOUNTS_KEY = 'fairshare_saved_accounts_v1';

// Default initial Google profiles for instant 1-tap preview
export const DEFAULT_GOOGLE_PROFILES = [
  {
    name: 'Eshwar Chandram',
    email: 'eshwarchandrams@gmail.com',
    avatar: '👑',
    picture: null,
    role: 'ADMIN',
    upiId: 'eshwar@okhdfcbank',
    pin: '1234',
    badge: 'Founder / Admin',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    avatar: '👩‍💼',
    picture: null,
    role: 'MEMBER',
    upiId: 'priya.sharma@paytm',
    pin: '4321',
    badge: 'Verified Member',
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@gmail.com',
    avatar: '👨‍💻',
    picture: null,
    role: 'MEMBER',
    upiId: 'rohanv@okaxis',
    pin: '7777',
    badge: 'Verified Member',
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@gmail.com',
    avatar: '👩‍🎨',
    picture: null,
    role: 'MEMBER',
    upiId: 'ananya.iyer@icici',
    pin: '9999',
    badge: 'Verified Member',
  },
];

/**
 * Deterministically derive an Ethereum wallet from a user's email
 * Ensures the user keeps the same blockchain identity across all devices
 */
export function deriveWalletFromEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const seed = ethers.id(`fairshare_auth_v1:${cleanEmail}`);
  const wallet = new ethers.Wallet(seed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

class AuthService {
  constructor() {
    this.currentUser = this.loadCurrentUser();
    this.listeners = new Set();
  }

  loadCurrentUser() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.address) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  getSavedAccounts() {
    if (typeof window === 'undefined') return [...DEFAULT_GOOGLE_PROFILES];
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [...DEFAULT_GOOGLE_PROFILES];
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

  loginWithGoogle({ name, email, avatar = '👤', picture = null, pin = '1234', upiId = null }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0] || 'User').trim();
    const wallet = deriveWalletFromEmail(cleanEmail);

    const userObj = {
      id: `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      name: cleanName,
      avatar: avatar || '👤',
      picture: picture || null,
      address: wallet.address,
      privateKey: wallet.privateKey,
      pin: String(pin || '1234'),
      upiId: upiId || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      provider: 'google',
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
