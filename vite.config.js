import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { WebSocketServer } from 'ws'
import os from 'os'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'fairshare_ledger_db.json')
const RECEIPTS_DIR = path.join(DATA_DIR, 'receipts')

function getLocalLanIp() {
  const nets = os.networkInterfaces()
  // First pass: prioritize 192.168.x.x, 10.x.x.x, or 172.x (Wi-Fi/Ethernet)
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const familyV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4
      if (familyV4 && !net.internal) {
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.') || (net.address.startsWith('172.') && !net.address.startsWith('172.17.0.'))) {
          return net.address
        }
      }
    }
  }
  // Second pass: any non-internal IPv4
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const familyV4 = typeof net.family === 'string' ? net.family === 'IPv4' : net.family === 4
      if (familyV4 && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

let cachedLedgerState = null

// Initialize permanent database from disk
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(RECEIPTS_DIR)) {
    fs.mkdirSync(RECEIPTS_DIR, { recursive: true })
  }
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    cachedLedgerState = JSON.parse(raw)
    if (cachedLedgerState) {
      if (!Array.isArray(cachedLedgerState.groups)) cachedLedgerState.groups = []
      // Ensure Group #1 (Public Ledger) is always present
      if (!cachedLedgerState.groups.some(g => Number(g.id) === 1)) {
        cachedLedgerState.groups.unshift({
          id: 1,
          name: 'Public Ledger',
          isPrivate: false,
          ledgerId: 'PUB-101',
          password: '',
          inviteCode: 'PUBLIC',
          currency: '₹',
          description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
          members: [],
        })
      }
      for (const g of cachedLedgerState.groups) {
        if (Array.isArray(g.members)) {
          g.members = sanitizeGoogleMembers(g.members)
        }
      }
    }
  }
} catch (err) {
  console.warn('[Vite DB] Initial disk load notice:', err.message)
}

function persistStateToDisk(state) {
  if (!state) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[Vite DB] Error saving state to disk:', err.message)
  }
}

function sanitizeGoogleMembers(members) {
  if (!Array.isArray(members)) return []
  const seenEmails = new Set()
  const seenAddrs = new Set()
  const clean = []
  for (const m of members) {
    if (!m) continue
    const email = (m.email || '').trim().toLowerCase()
    const address = (m.address || '').trim().toLowerCase()
    const name = (m.name || '').trim()

    // Strictly require a valid email address
    if (!email || !email.includes('@') || !email.includes('.')) continue

    // Filter out dummy/mock personas
    if (
      name.startsWith('Phone User (') ||
      name === 'Samsung' ||
      name === 'Priya Sharma' ||
      name === 'Rohan Verma' ||
      name === 'Ananya Iyer' ||
      name === 'Kabir Mehta'
    ) {
      continue
    }

    if (seenEmails.has(email) || (address && seenAddrs.has(address))) continue
    seenEmails.add(email)
    if (address) seenAddrs.add(address)

    clean.push({
      ...m,
      email,
      provider: 'google',
    })
  }

  // If there are verified Google members but none has role 'ADMIN', ensure the first joined Google user is ADMIN
  if (clean.length > 0 && !clean.some(m => m.role === 'ADMIN')) {
    clean[0].role = 'ADMIN'
    clean[0].avatar = '👑'
  }

  return clean
}

function mergeLedgerStates(base, update) {
  if (!base) {
    if (!update) return null
    const cleanedGroups = (Array.isArray(update.groups) ? update.groups : []).map(g => ({
      ...g,
      members: sanitizeGoogleMembers(g.members),
    }))
    return {
      ...update,
      groups: cleanedGroups,
      expenses: Array.isArray(update.expenses) ? update.expenses : [],
      settlements: Array.isArray(update.settlements) ? update.settlements : [],
      auditLogs: Array.isArray(update.auditLogs) ? update.auditLogs : [],
    }
  }
  if (!update) return base

  // Merge groups (preserving both Public Ledger #1 and all Private Ledgers)
  const groupMap = new Map()
  for (const g of base.groups || []) {
    groupMap.set(Number(g.id), { ...g, members: sanitizeGoogleMembers(g.members) })
  }
  for (const g of update.groups || []) {
    const gId = Number(g.id)
    const existing = groupMap.get(gId)
    if (!existing) {
      groupMap.set(gId, { ...g, members: sanitizeGoogleMembers(g.members) })
    } else {
      const combined = [...(existing.members || []), ...(g.members || [])]
      groupMap.set(gId, {
        ...existing,
        ...g,
        isPrivate: g.isPrivate !== undefined ? g.isPrivate : existing.isPrivate,
        ledgerId: g.ledgerId || existing.ledgerId,
        password: g.password || existing.password,
        inviteCode: g.inviteCode || existing.inviteCode,
        members: sanitizeGoogleMembers(combined),
      })
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
      currency: '₹',
      description: 'Decentralized public expense ledger. Open for verified Google users and multi-device settlement.',
      members: [],
    })
  }

  // Merge expenses across all groups
  const expMap = new Map()
  for (const e of base.expenses || []) {
    if (e && e.id) expMap.set(String(e.id), e)
  }
  for (const e of update.expenses || []) {
    if (!e || !e.id) continue
    const existing = expMap.get(String(e.id))
    if (!existing || (e.timestamp || 0) >= (existing.timestamp || 0)) {
      expMap.set(String(e.id), e)
    }
  }

  // Merge settlements across all groups
  const setMap = new Map()
  for (const s of base.settlements || []) {
    if (s && s.id) setMap.set(String(s.id), s)
  }
  for (const s of update.settlements || []) {
    if (s && s.id) setMap.set(String(s.id), s)
  }

  // Merge audit logs across all groups
  const logMap = new Map()
  for (const l of base.auditLogs || []) {
    if (l && l.id) logMap.set(`${l.id}_${l.timestamp}_${l.action}`, l)
  }
  for (const l of update.auditLogs || []) {
    if (l && l.id) logMap.set(`${l.id}_${l.timestamp}_${l.action}`, l)
  }

  return {
    ...base,
    ...update,
    groups: Array.from(groupMap.values()),
    expenses: Array.from(expMap.values()),
    settlements: Array.from(setMap.values()),
    auditLogs: Array.from(logMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)),
  }
}

function setupWebSocketRelay(server) {
  const wss = new WebSocketServer({ noServer: true })
  const clients = new Set()

  if (server.httpServer) {
    server.httpServer.on('upgrade', (req, socket, head) => {
      const pathname = (req.url || '').split('?')[0]
      if (pathname === '/fairshare-sync') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      }
    })
  }

  wss.on('connection', (ws) => {
    clients.add(ws)

    // Immediately replay cached state to newly connected client/phone
    if (cachedLedgerState) {
      try {
        ws.send(JSON.stringify({
          type: 'STATE_UPDATED',
          state: cachedLedgerState,
          fromCache: true,
          timestamp: Date.now(),
        }))
      } catch (err) {
        console.warn('Failed to replay cached state to new client:', err)
      }
    }

    ws.on('message', (message) => {
      const msgStr = message.toString()
      try {
        const parsed = JSON.parse(msgStr)
        if (parsed.type === 'STATE_UPDATED' && parsed.state) {
          cachedLedgerState = mergeLedgerStates(cachedLedgerState, parsed.state)
          persistStateToDisk(cachedLedgerState)
        } else if (parsed.type === 'REQUEST_SYNC' && cachedLedgerState) {
          ws.send(JSON.stringify({
            type: 'STATE_UPDATED',
            state: cachedLedgerState,
            fromCache: true,
            timestamp: Date.now(),
          }))
        }
      } catch {}

      // Broadcast to all other connected devices/tabs
      for (const client of clients) {
        if (client !== ws && client.readyState === 1 /* OPEN */) {
          client.send(msgStr)
        }
      }
    })
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
  })
}

function handleStateEndpoint(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      state: cachedLedgerState,
      persistence: {
        type: 'LOCAL_DISK_JSON',
        isPermanent: true,
        provider: 'Local Disk Persistent DB (data/fairshare_ledger_db.json)',
        dbFile: DB_FILE,
      }
    }))
  } else if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        const incomingState = parsed.state || parsed
        if (incomingState && (incomingState.groups || incomingState.expenses || incomingState.settlements || incomingState.auditLogs || incomingState.state)) {
          cachedLedgerState = mergeLedgerStates(cachedLedgerState, incomingState)
          persistStateToDisk(cachedLedgerState)
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          success: true,
          persistence: {
            type: 'LOCAL_DISK_JSON',
            isPermanent: true,
          }
        }))
      } catch {
        res.statusCode = 400
        res.end('Invalid JSON')
      }
    })
  } else {
    res.statusCode = 405
    res.end()
  }
}

function handleUploadReceiptEndpoint(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        const { cid, fileName, dataUrl } = parsed
        if (cid && dataUrl) {
          const cleanCid = cid.replace(/[^a-zA-Z0-9]/g, '')
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            const mimeType = match[1]
            const buffer = Buffer.from(match[2], 'base64')
            fs.writeFileSync(path.join(RECEIPTS_DIR, cleanCid), buffer)
            fs.writeFileSync(
              path.join(RECEIPTS_DIR, `${cleanCid}.meta.json`),
              JSON.stringify({ fileName, mimeType, timestamp: Date.now() }, null, 2)
            )
          }
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true }))
      } catch (err) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
  } else {
    res.statusCode = 405
    res.end()
  }
}

function handleGetReceiptEndpoint(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const rawCid = (req.url || '').replace(/^\//, '').split('?')[0]
  if (!rawCid) {
    if (typeof next === 'function') return next()
    res.statusCode = 404
    res.end()
    return
  }

  const cleanCid = rawCid.replace(/[^a-zA-Z0-9]/g, '')
  const receiptPath = path.join(RECEIPTS_DIR, cleanCid)
  const metaPath = path.join(RECEIPTS_DIR, `${cleanCid}.meta.json`)

  if (!fs.existsSync(receiptPath) && cachedLedgerState && Array.isArray(cachedLedgerState.expenses)) {
    const matchingExp = cachedLedgerState.expenses.find(e => 
      e && (e.ipfsCid || '').replace('ipfs://', '').trim() === cleanCid && e.receiptDataUrl
    );
    if (matchingExp && matchingExp.receiptDataUrl) {
      try {
        const match = matchingExp.receiptDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const buffer = Buffer.from(match[2], 'base64');
          fs.writeFileSync(receiptPath, buffer);
          fs.writeFileSync(
            metaPath,
            JSON.stringify({ fileName: matchingExp.receiptFileName || 'receipt.pdf', mimeType, timestamp: Date.now() }, null, 2)
          );
        }
      } catch {}
    }
  }

  if (fs.existsSync(receiptPath)) {
    let mimeType = 'application/octet-stream'
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        if (meta.mimeType) mimeType = meta.mimeType
      } catch {}
    } else {
      const head = fs.readFileSync(receiptPath, { flag: 'r' }).subarray(0, 8)
      if (head.includes(Buffer.from('%PDF'))) mimeType = 'application/pdf'
      else if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) mimeType = 'image/png'
      else if (head[0] === 0xff && head[1] === 0xd8) mimeType = 'image/jpeg'
    }

    res.statusCode = 200
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('X-Ipfs-Path', `/ipfs/${cleanCid}`)
    res.setHeader('X-Ipfs-Roots', cleanCid)
    res.setHeader('Access-Control-Expose-Headers', 'X-Ipfs-Path, X-Ipfs-Roots')
    fs.createReadStream(receiptPath).pipe(res)
  } else {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Receipt not found on IPFS' }))
  }
}

function fairShareSyncPlugin() {
  return {
    name: 'fairshare-sync-relay',
    configureServer(server) {
      setupWebSocketRelay(server)
      server.middlewares.use('/api/lan-ip', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ip: getLocalLanIp() }))
      })
      server.middlewares.use('/api/ledger-state', handleStateEndpoint)
      server.middlewares.use('/api/upload-receipt', handleUploadReceiptEndpoint)
      server.middlewares.use('/api/receipts', handleGetReceiptEndpoint)
      server.middlewares.use('/ipfs', handleGetReceiptEndpoint)
    },
    configurePreviewServer(server) {
      setupWebSocketRelay(server)
      server.middlewares.use('/api/lan-ip', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ip: getLocalLanIp() }))
      })
      server.middlewares.use('/api/ledger-state', handleStateEndpoint)
      server.middlewares.use('/api/upload-receipt', handleUploadReceiptEndpoint)
      server.middlewares.use('/api/receipts', handleGetReceiptEndpoint)
      server.middlewares.use('/ipfs', handleGetReceiptEndpoint)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fairShareSyncPlugin()],
  server: {
    host: true, // Exposes to local network (0.0.0.0) so phones/laptops on same Wi-Fi can connect
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/ethers')) {
            return 'vendor-ethers';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})


