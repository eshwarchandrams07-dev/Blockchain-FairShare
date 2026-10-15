import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import os from 'os';

function getLocalLanIp() {
  const nets = os.networkInterfaces();
  // First pass: prioritize 192.168.x.x, 10.x.x.x, or 172.x (Wi-Fi/Ethernet)
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const familyV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4;
      if (familyV4 && !net.internal) {
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.') || (net.address.startsWith('172.') && !net.address.startsWith('172.17.0.'))) {
          return net.address;
        }
      }
    }
  }
  // Second pass: any non-internal IPv4
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const familyV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4;
      if (familyV4 && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'fairshare_ledger_db.json');

let cachedLedgerState = null;

// Initialize permanent database from disk
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    cachedLedgerState = JSON.parse(raw);
    if (cachedLedgerState) {
      cachedLedgerState.groups = (cachedLedgerState.groups || []).filter(g => Number(g.id) === 1);
      cachedLedgerState.expenses = (cachedLedgerState.expenses || []).filter(e => !e.groupId || Number(e.groupId) === 1);
      cachedLedgerState.settlements = (cachedLedgerState.settlements || []).filter(s => !s.groupId || Number(s.groupId) === 1);
      cachedLedgerState.auditLogs = (cachedLedgerState.auditLogs || []).filter(l => !l.groupId || Number(l.groupId) === 1);
      cachedLedgerState.currentGroupId = 1;
    }
    console.log(`[Database] Loaded permanent ledger from disk (${cachedLedgerState?.groups?.length || 0} groups, ${cachedLedgerState?.expenses?.length || 0} expenses)`);
  }
} catch (err) {
  console.warn('[Database] Initial disk load notice:', err.message);
}

function persistStateToDisk(state) {
  if (!state) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Database] Error saving state to disk:', err.message);
  }
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
      if (Number(g.id) === 1) {
        groupMap.set(g.id, { ...g, members: [...(g.members || [])] });
      }
    }
    for (const g of update.groups) {
      if (Number(g.id) !== 1) continue;
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
    for (const e of base.expenses) {
      if (!e.groupId || Number(e.groupId) === 1) expMap.set(String(e.id), e);
    }
    for (const e of update.expenses) {
      if (e.groupId && Number(e.groupId) !== 1) continue;
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
    for (const s of base.settlements) {
      if (!s.groupId || Number(s.groupId) === 1) setMap.set(String(s.id), s);
    }
    for (const s of update.settlements) {
      if (s.groupId && Number(s.groupId) !== 1) continue;
      if (!setMap.has(String(s.id))) setMap.set(String(s.id), s);
    }
    merged.settlements = Array.from(setMap.values());
  }

  // Merge audit logs
  if (Array.isArray(base.auditLogs) && Array.isArray(update.auditLogs)) {
    const logMap = new Map();
    for (const l of base.auditLogs) {
      if (!l.groupId || Number(l.groupId) === 1) logMap.set(`${l.id}_${l.timestamp}_${l.action}`, l);
    }
    for (const l of update.auditLogs) {
      if (l.groupId && Number(l.groupId) !== 1) continue;
      const key = `${l.id}_${l.timestamp}_${l.action}`;
      if (!logMap.has(key)) logMap.set(key, l);
    }
    merged.auditLogs = Array.from(logMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  return merged;
}

const server = http.createServer((req, res) => {
  let reqPath = (req.url || '/').split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (reqPath === '/api/lan-ip') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: getLocalLanIp() }));
    return;
  }

  if (reqPath === '/api/ledger-state') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        state: cachedLedgerState,
        persistence: {
          type: 'LOCAL_DISK_JSON',
          isPermanent: true,
          provider: 'Local Disk Persistent DB (data/fairshare_ledger_db.json)',
          dbFile: DB_FILE,
        }
      }));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const incomingState = parsed.state || parsed;
          if (incomingState && (incomingState.groups || incomingState.expenses || incomingState.settlements || incomingState.auditLogs || incomingState.state)) {
            cachedLedgerState = mergeLedgerStates(cachedLedgerState, incomingState);
            persistStateToDisk(cachedLedgerState);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            persistence: {
              type: 'LOCAL_DISK_JSON',
              isPermanent: true,
            }
          }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Invalid JSON');
        }
      });
      return;
    }
  }

  let filePath = path.join(DIST_DIR, reqPath);

  // Directory handling: try index.html
  if (filePath.endsWith('/') || !path.extname(filePath)) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback to index.html
      fs.readFile(path.join(DIST_DIR, 'index.html'), (errFallback, fallback) => {
        if (errFallback) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('FairShare build not found. Please run "npm run build" first.');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallback);
        }
      });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

// Attach WebSocket relay for live peer-to-peer sync
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

server.on('upgrade', (req, socket, head) => {
  const pathname = (req.url || '').split('?')[0];
  if (pathname === '/fairshare-sync') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  clients.add(ws);

  // Immediately replay cached state to newly joined client
  if (cachedLedgerState) {
    try {
      ws.send(JSON.stringify({
        type: 'STATE_UPDATED',
        state: cachedLedgerState,
        fromCache: true,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.warn('Failed to replay cached state to new client:', err);
    }
  }

  ws.on('message', (message) => {
    const msgStr = message.toString();
    try {
      const parsed = JSON.parse(msgStr);
      if (parsed.type === 'STATE_UPDATED' && parsed.state) {
        cachedLedgerState = mergeLedgerStates(cachedLedgerState, parsed.state);
        persistStateToDisk(cachedLedgerState);
      } else if (parsed.type === 'REQUEST_SYNC' && cachedLedgerState) {
        ws.send(JSON.stringify({
          type: 'STATE_UPDATED',
          state: cachedLedgerState,
          fromCache: true,
          timestamp: Date.now(),
        }));
      }
    } catch {}

    for (const client of clients) {
      if (client !== ws && client.readyState === 1 /* OPEN */) {
        client.send(msgStr);
      }
    }
  });
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

const HOST = process.env.HOST || '0.0.0.0';

server.on('error', (err) => {
  if (err.code === 'EPERM' && HOST === '0.0.0.0') {
    console.warn(`[Server] 0.0.0.0 permission blocked. Retrying on 127.0.0.1:${PORT}...`);
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 FairShare Server Online at http://127.0.0.1:${PORT}`);
    });
  } else {
    console.error('[Server Error]:', err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🚀 FairShare Production Server Online`);
  console.log(`========================================`);
  console.log(`Web App URL      : http://localhost:${PORT}`);
  console.log(`WebSocket Relay  : ws://localhost:${PORT}/fairshare-sync`);
  console.log(`Listening on ${HOST}:${PORT}\n`);
});
