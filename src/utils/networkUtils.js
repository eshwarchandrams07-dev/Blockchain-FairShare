/**
 * Network Utilities for FairShare
 * Dynamically resolves LAN IP, manages manual IP overrides, and computes effective host URLs
 * for peer QR codes and multi-device joining.
 */

let cachedLanIp = null;

export function getSavedLanIp() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('fairshare_lan_ip') || null;
  } catch {
    return null;
  }
}

export function saveLanIp(ip) {
  if (typeof window === 'undefined' || !ip) return;
  try {
    const trimmed = ip.trim();
    localStorage.setItem('fairshare_lan_ip', trimmed);
    cachedLanIp = trimmed;
    window.dispatchEvent(new CustomEvent('fairshare_lan_ip_changed', { detail: trimmed }));
  } catch {}
}

export async function fetchDetectedLanIp() {
  if (typeof window === 'undefined') return 'localhost';
  const currentHost = window.location.hostname;
  
  // If user already loaded the app via an external IP or domain (e.g. 192.168.1.10 or Vercel),
  // use that hostname directly!
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    return currentHost;
  }

  // If user has a manually saved or cached IP, check it
  const saved = getSavedLanIp();
  if (saved && saved !== 'localhost' && saved !== '127.0.0.1') {
    cachedLanIp = saved;
    return saved;
  }

  // Query server to get actual LAN IP of this host machine
  try {
    const res = await fetch('/api/lan-ip');
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && data.ip !== 'localhost') {
        saveLanIp(data.ip);
        cachedLanIp = data.ip;
        return data.ip;
      }
    }
  } catch (err) {
    console.warn('Could not query LAN IP endpoint:', err);
  }

  return saved || 'localhost';
}

export function getEffectiveHost(customIp = null) {
  if (typeof window === 'undefined') {
    return customIp && customIp.trim() ? `${customIp.trim()}:5173` : 'localhost:5173';
  }
  const currentHost = window.location.hostname;
  const isLocal = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const port = window.location.port ? `:${window.location.port}` : ':5173';

  if (!isLocal) {
    return window.location.host;
  }

  const ip = (customIp && customIp.trim()) || getSavedLanIp() || cachedLanIp || 'localhost';
  return `${ip}${port}`;
}
