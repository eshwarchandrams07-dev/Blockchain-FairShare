// Multi-Backend Permanent Storage Engine for FairShare on Vercel & Node.js

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
            parsed.groups = (parsed.groups || []).filter(g => Number(g.id) === 1);
            parsed.expenses = (parsed.expenses || []).filter(e => !e.groupId || Number(e.groupId) === 1);
            parsed.settlements = (parsed.settlements || []).filter(s => !s.groupId || Number(s.groupId) === 1);
            parsed.auditLogs = (parsed.auditLogs || []).filter(l => !l.groupId || Number(l.groupId) === 1);
            parsed.currentGroupId = 1;
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
          state.groups = (state.groups || []).filter(g => Number(g.id) === 1);
          state.expenses = (state.expenses || []).filter(e => !e.groupId || Number(e.groupId) === 1);
          state.settlements = (state.settlements || []).filter(s => !s.groupId || Number(s.groupId) === 1);
          state.auditLogs = (state.auditLogs || []).filter(l => !l.groupId || Number(l.groupId) === 1);
          state.currentGroupId = 1;
          return state;
        }
      }
    } catch (err) {
      console.warn('Failed to load from Supabase:', err);
    }
  }

  if (inMemoryCachedState) {
    inMemoryCachedState.groups = (inMemoryCachedState.groups || []).filter(g => Number(g.id) === 1);
    inMemoryCachedState.expenses = (inMemoryCachedState.expenses || []).filter(e => !e.groupId || Number(e.groupId) === 1);
    inMemoryCachedState.settlements = (inMemoryCachedState.settlements || []).filter(s => !s.groupId || Number(s.groupId) === 1);
    inMemoryCachedState.auditLogs = (inMemoryCachedState.auditLogs || []).filter(l => !l.groupId || Number(l.groupId) === 1);
    inMemoryCachedState.currentGroupId = 1;
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

function mergeLedgerStates(base, update) {
  if (!base) {
    if (!update) return null;
    return {
      groups: (Array.isArray(update.groups) ? update.groups : []).filter(g => Number(g.id) === 1),
      expenses: (Array.isArray(update.expenses) ? update.expenses : []).filter(e => !e.groupId || Number(e.groupId) === 1),
      settlements: (Array.isArray(update.settlements) ? update.settlements : []).filter(s => !s.groupId || Number(s.groupId) === 1),
      auditLogs: (Array.isArray(update.auditLogs) ? update.auditLogs : []).filter(l => !l.groupId || Number(l.groupId) === 1),
      currentGroupId: 1,
    };
  }
  if (!update) return base;

  const merged = {
    ...base,
    ...update,
    currentGroupId: 1,
    groups: (Array.isArray(update.groups) ? update.groups : (Array.isArray(base.groups) ? base.groups : [])).filter(g => Number(g.id) === 1),
    expenses: (Array.isArray(update.expenses) ? update.expenses : (Array.isArray(base.expenses) ? base.expenses : [])).filter(e => !e.groupId || Number(e.groupId) === 1),
    settlements: (Array.isArray(update.settlements) ? update.settlements : (Array.isArray(base.settlements) ? base.settlements : [])).filter(s => !s.groupId || Number(s.groupId) === 1),
    auditLogs: (Array.isArray(update.auditLogs) ? update.auditLogs : (Array.isArray(base.auditLogs) ? base.auditLogs : [])).filter(l => !l.groupId || Number(l.groupId) === 1),
  };

  // Merge groups and members by address
  if (Array.isArray(base.groups) && Array.isArray(update.groups)) {
    const groupMap = new Map();
    for (const g of base.groups) {
      groupMap.set(g.id, { ...g, members: [...(g.members || [])] });
    }
    for (const g of update.groups) {
      const existing = groupMap.get(g.id);
      if (!existing) {
        groupMap.set(g.id, g);
      } else {
        const memberMap = new Map();
        for (const m of existing.members || []) {
          if (m && m.address) memberMap.set(m.address.toLowerCase(), m);
        }
        for (const m of g.members || []) {
          if (m && m.address) {
            const low = m.address.toLowerCase();
            if (!memberMap.has(low)) {
              memberMap.set(low, m);
            } else {
              memberMap.set(low, { ...memberMap.get(low), ...m });
            }
          }
        }
        existing.members = Array.from(memberMap.values());
        // Preserve private keys and ledger IDs
        if (g.isPrivate) existing.isPrivate = true;
        if (g.ledgerId) existing.ledgerId = g.ledgerId;
        if (g.password) existing.password = g.password;
        groupMap.set(g.id, existing);
      }
    }
    merged.groups = Array.from(groupMap.values());
  }

  // Merge expenses
  if (Array.isArray(base.expenses) && Array.isArray(update.expenses)) {
    const expMap = new Map();
    for (const e of base.expenses) expMap.set(String(e.id), e);
    for (const e of update.expenses) {
      const existing = expMap.get(String(e.id));
      if (!existing || (e.timestamp || 0) >= (existing.timestamp || 0)) {
        expMap.set(String(e.id), e);
      }
    }
    merged.expenses = Array.from(expMap.values());
  }

  // Merge settlements
  if (Array.isArray(base.settlements) && Array.isArray(update.settlements)) {
    const setMap = new Map();
    for (const s of base.settlements) setMap.set(String(s.id), s);
    for (const s of update.settlements) {
      if (!setMap.has(String(s.id))) setMap.set(String(s.id), s);
    }
    merged.settlements = Array.from(setMap.values());
  }

  // Merge audit logs
  if (Array.isArray(base.auditLogs) && Array.isArray(update.auditLogs)) {
    const logMap = new Map();
    for (const l of base.auditLogs) {
      if (l) logMap.set(`${l.id || l.hash}_${l.timestamp}_${l.action}`, l);
    }
    for (const l of update.auditLogs) {
      if (l) {
        const key = `${l.id || l.hash}_${l.timestamp}_${l.action}`;
        if (!logMap.has(key)) logMap.set(key, l);
      }
    }
    merged.auditLogs = Array.from(logMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  return merged;
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
