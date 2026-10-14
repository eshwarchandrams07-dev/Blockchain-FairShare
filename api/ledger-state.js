let cachedLedgerState = null;

function mergeLedgerStates(base, update) {
  if (!base) {
    if (!update) return null;
    return {
      groups: Array.isArray(update.groups) ? update.groups : [],
      expenses: Array.isArray(update.expenses) ? update.expenses : [],
      settlements: Array.isArray(update.settlements) ? update.settlements : [],
      auditLogs: Array.isArray(update.auditLogs) ? update.auditLogs : [],
    };
  }
  if (!update) return base;

  const merged = {
    ...base,
    ...update,
    groups: Array.isArray(update.groups) ? update.groups : (Array.isArray(base.groups) ? base.groups : []),
    expenses: Array.isArray(update.expenses) ? update.expenses : (Array.isArray(base.expenses) ? base.expenses : []),
    settlements: Array.isArray(update.settlements) ? update.settlements : (Array.isArray(base.settlements) ? base.settlements : []),
    auditLogs: Array.isArray(update.auditLogs) ? update.auditLogs : (Array.isArray(base.auditLogs) ? base.auditLogs : []),
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

  return merged;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ state: cachedLedgerState });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const incomingState = body?.state || body;
      if (incomingState && (incomingState.groups || incomingState.state)) {
        cachedLedgerState = mergeLedgerStates(cachedLedgerState, incomingState);
      }
      return res.status(200).json({ success: true });
    } catch {
      return res.status(400).send('Invalid JSON');
    }
  }

  return res.status(405).end();
}
