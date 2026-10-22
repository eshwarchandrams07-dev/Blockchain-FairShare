// Multi-Backend Permanent Storage Engine for FairShare on Vercel & Node.js
import { saveReceipt } from './_store.js';

let inMemoryCachedState = null;
let lastSavedTimestamp = Date.now();

function getPersistenceAdapter() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    return {
      type: 'UPSTASH_KV',
      isPermanent: true,
      provider: 'Vercel KV / Upstash Redis (Permanent Cloud Storage)',
      kvUrl: kvUrl.replace(/\/$/, ''),
      kvToken,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    return {
      type: 'SUPABASE_POSTGRES',
      isPermanent: true,
      provider: 'Supabase PostgreSQL (Permanent Cloud Storage)',
      supabaseUrl: supabaseUrl.replace(/\/$/, ''),
      supabaseKey,
    };
  }

  return {
    type: 'SERVER_CACHE',
    isPermanent: false,
    provider: 'Server Memory Cache (Configure Vercel KV or Supabase for permanent cloud retention)',
  };
}

async function loadPersistedState(adapter) {
  if (adapter.type === 'UPSTASH_KV') {
    try {
      const res = await fetch(`${adapter.kvUrl}/get/fairshare_global_ledger_v2`, {
        headers: { Authorization: `Bearer ${adapter.kvToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (parsed) {
            if (!Array.isArray(parsed.groups)) parsed.groups = [];
            if (!parsed.groups.some(g => Number(g.id) === 1)) {
              parsed.groups.unshift({
                id: 1,
                name: 'Public Ledger',
                isPrivate: false,
                ledgerId: 'PUB-101',
                password: '',
                inviteCode: 'PUBLIC',
                description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
                members: [],
              });
            }
            for (const g of parsed.groups) {
              if (Array.isArray(g.members)) {
                g.members = sanitizeGoogleMembers(g.members);
              }
            }
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load from Upstash KV:', err);
    }
  }

  if (adapter.type === 'SUPABASE_POSTGRES') {
    try {
      const res = await fetch(`${adapter.supabaseUrl}/rest/v1/fairshare_ledgers?id=eq.global&select=state`, {
        headers: {
          apikey: adapter.supabaseKey,
          Authorization: `Bearer ${adapter.supabaseKey}`,
        },
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.state) {
          const state = rows[0].state;
          if (!Array.isArray(state.groups)) state.groups = [];
          if (!state.groups.some(g => Number(g.id) === 1)) {
            state.groups.unshift({
              id: 1,
              name: 'Public Ledger',
              isPrivate: false,
              ledgerId: 'PUB-101',
              password: '',
              inviteCode: 'PUBLIC',
              description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
              members: [],
            });
          }
          for (const g of state.groups) {
            if (Array.isArray(g.members)) {
              g.members = sanitizeGoogleMembers(g.members);
            }
          }
          return state;
        }
      }
    } catch (err) {
      console.warn('Failed to load from Supabase:', err);
    }
  }

  if (inMemoryCachedState) {
    if (!Array.isArray(inMemoryCachedState.groups)) inMemoryCachedState.groups = [];
    if (!inMemoryCachedState.groups.some(g => Number(g.id) === 1)) {
      inMemoryCachedState.groups.unshift({
        id: 1,
        name: 'Public Ledger',
        isPrivate: false,
        ledgerId: 'PUB-101',
        password: '',
        inviteCode: 'PUBLIC',
        description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
        members: [],
      });
    }
    for (const g of inMemoryCachedState.groups) {
      if (Array.isArray(g.members)) {
        g.members = sanitizeGoogleMembers(g.members);
      }
    }
  }

  return inMemoryCachedState;
}

async function savePersistedState(adapter, state) {
  if (adapter.type === 'UPSTASH_KV') {
    try {
      await fetch(`${adapter.kvUrl}/set/fairshare_global_ledger_v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adapter.kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeof state === 'string' ? state : JSON.stringify(state)),
      });
      return true;
    } catch (err) {
      console.warn('Failed to save to Upstash KV:', err);
    }
  }

  if (adapter.type === 'SUPABASE_POSTGRES') {
    try {
      await fetch(`${adapter.supabaseUrl}/rest/v1/fairshare_ledgers`, {
        method: 'POST',
        headers: {
          apikey: adapter.supabaseKey,
          Authorization: `Bearer ${adapter.supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: 'global',
          state,
          updated_at: new Date().toISOString(),
        }),
      });
      return true;
    } catch (err) {
      console.warn('Failed to save to Supabase:', err);
    }
  }

  return false;
}

function sanitizeGoogleMembers(members) {
  if (!Array.isArray(members)) return [];
  const seenEmails = new Set();
  const seenAddrs = new Set();
  const clean = [];
  for (const m of members) {
    if (!m) continue;
    const email = (m.email || '').trim().toLowerCase();
    const address = (m.address || '').trim().toLowerCase();
    const name = (m.name || '').trim();

    if (!email || !email.includes('@') || !email.includes('.')) continue;

    if (
      name.startsWith('Phone User (') ||
      name === 'Samsung' ||
      name === 'Priya Sharma' ||
      name === 'Rohan Verma' ||
      name === 'Ananya Iyer' ||
      name === 'Kabir Mehta'
    ) {
      continue;
    }

    if (seenEmails.has(email) || (address && seenAddrs.has(address))) continue;
    seenEmails.add(email);
    if (address) seenAddrs.add(address);

    clean.push({
      ...m,
      email,
      provider: 'google',
    });
  }

  // If there are verified Google members but none has role 'ADMIN', ensure the first joined Google user is ADMIN
  if (clean.length > 0 && !clean.some(m => m.role === 'ADMIN')) {
    clean[0].role = 'ADMIN';
    clean[0].avatar = '👑';
  }

  return clean;
}

function mergeLedgerStates(base, update) {
  if (!base) {
    if (!update) return null;
    const cleanedGroups = (Array.isArray(update.groups) ? update.groups : []).map(g => ({
      ...g,
      members: sanitizeGoogleMembers(g.members),
    }));
    return {
      ...update,
      groups: cleanedGroups,
      expenses: Array.isArray(update.expenses) ? update.expenses : [],
      settlements: Array.isArray(update.settlements) ? update.settlements : [],
      auditLogs: Array.isArray(update.auditLogs) ? update.auditLogs : [],
    };
  }
  if (!update) return base;

  // Merge groups (preserving both Public Ledger #1 and all Private Ledgers)
  const groupMap = new Map();
  for (const g of base.groups || []) {
    groupMap.set(Number(g.id), { ...g, members: sanitizeGoogleMembers(g.members) });
  }
  for (const g of update.groups || []) {
    const gId = Number(g.id);
    const existing = groupMap.get(gId);
    if (!existing) {
      groupMap.set(gId, { ...g, members: sanitizeGoogleMembers(g.members) });
    } else {
      const combined = [...(existing.members || []), ...(g.members || [])];
      groupMap.set(gId, {
        ...existing,
        ...g,
        members: sanitizeGoogleMembers(combined),
      });
    }
  }

  // Ensure Public Ledger #1 always exists
  if (!groupMap.has(1)) {
    groupMap.set(1, {
      id: 1,
      name: 'Public Ledger',
      isPrivate: false,
      ledgerId: 'PUB-101',
      password: '',
      inviteCode: 'PUBLIC',
      description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
      members: [],
    });
  }

  // Merge expenses across all groups
  const expMap = new Map();
  for (const e of base.expenses || []) {
    if (e && e.id) expMap.set(String(e.id), e);
  }
  for (const e of update.expenses || []) {
    if (!e || !e.id) continue;
    const existing = expMap.get(String(e.id));
    if (!existing || (e.timestamp || 0) >= (existing.timestamp || 0)) {
      expMap.set(String(e.id), e);
    }
  }

  // Merge settlements across all groups
  const setMap = new Map();
  for (const s of base.settlements || []) {
    if (s && s.id) setMap.set(String(s.id), s);
  }
  for (const s of update.settlements || []) {
    if (s && s.id) setMap.set(String(s.id), s);
  }

  // Merge audit logs across all groups
  const logMap = new Map();
  for (const l of base.auditLogs || []) {
    if (l && l.id) logMap.set(`${l.id || l.hash}_${l.timestamp}_${l.action}`, l);
  }
  for (const l of update.auditLogs || []) {
    if (l && l.id) logMap.set(`${l.id || l.hash}_${l.timestamp}_${l.action}`, l);
  }

  return {
    ...base,
    ...update,
    groups: Array.from(groupMap.values()),
    expenses: Array.from(expMap.values()),
    settlements: Array.from(setMap.values()),
    auditLogs: Array.from(logMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const adapter = getPersistenceAdapter();

  if (req.method === 'DELETE') {
    inMemoryCachedState = {
      groups: [{
        id: 1,
        name: 'Public Ledger',
        isPrivate: false,
        ledgerId: 'PUB-101',
        password: '',
        inviteCode: 'PUBLIC',
        currency: '₹',
        description: 'Decentralized public expense ledger. Open for community expense sharing and multi-device settlement.',
        creator: '0x0000000000000000000000000000000000000000',
        createdAt: Date.now(),
        members: [],
        approvalPolicy: 1,
      }],
      expenses: [],
      settlements: [],
      auditLogs: [],
      currentGroupId: 1,
      currentBlockNumber: 19843600,
    };
    lastSavedTimestamp = Date.now();
    if (adapter.isPermanent) {
      await savePersistedState(adapter, inMemoryCachedState);
    }
    return res.status(200).json({ success: true, message: 'All ledger data deleted successfully' });
  }

  if (req.method === 'GET') {
    const persisted = await loadPersistedState(adapter);
    if (persisted) {
      inMemoryCachedState = persisted;
    }

    return res.status(200).json({
      state: inMemoryCachedState,
      persistence: {
        type: adapter.type,
        isPermanent: adapter.isPermanent,
        provider: adapter.provider,
        lastSaved: lastSavedTimestamp,
      },
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const incomingState = body?.state || body;
      if (incomingState && (incomingState.groups || incomingState.expenses || incomingState.settlements || incomingState.auditLogs || incomingState.state)) {
        // Load latest to avoid race conditions
        const currentPersisted = (await loadPersistedState(adapter)) || inMemoryCachedState;
        inMemoryCachedState = mergeLedgerStates(currentPersisted, incomingState);
        lastSavedTimestamp = Date.now();

        // Extract and cache any attached receipts for immediate IPFS resolution
        if (Array.isArray(inMemoryCachedState.expenses)) {
          for (const exp of inMemoryCachedState.expenses) {
            if (exp?.ipfsCid && exp?.receiptDataUrl) {
              saveReceipt(exp.ipfsCid, exp.receiptFileName, exp.receiptDataUrl).catch(() => {});
            }
          }
        }

        // Write to permanent cloud database if configured
        if (adapter.isPermanent) {
          await savePersistedState(adapter, inMemoryCachedState);
        }
      }

      return res.status(200).json({
        success: true,
        persistence: {
          type: adapter.type,
          isPermanent: adapter.isPermanent,
          provider: adapter.provider,
        },
      });
    } catch {
      return res.status(400).send('Invalid JSON');
    }
  }

  return res.status(405).end();
}
