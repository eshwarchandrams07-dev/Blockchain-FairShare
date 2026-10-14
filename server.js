import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import os from 'os';

function getLocalLanIp() {
  const nets = os.networkInterfaces();
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

let cachedLedgerState = null;

const server = http.createServer((req, res) => {
  let reqPath = (req.url || '/').split('?')[0];

  if (reqPath === '/api/lan-ip') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip: getLocalLanIp() }));
    return;
  }

  if (reqPath === '/api/ledger-state') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ state: cachedLedgerState }));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && (parsed.groups || parsed.state)) {
            cachedLedgerState = parsed.state || parsed;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
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
        cachedLedgerState = parsed.state;
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 FairShare Production Server Online`);
  console.log(`========================================`);
  console.log(`Web App URL      : http://localhost:${PORT}`);
  console.log(`WebSocket Relay  : ws://localhost:${PORT}/fairshare-sync`);
  console.log(`Listening on all network interfaces (0.0.0.0:${PORT})\n`);
});
