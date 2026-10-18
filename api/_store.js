// Shared Persistence & IPFS Receipt Storage for Vercel Serverless Functions
import fs from 'fs';
import path from 'path';
import os from 'os';

const TMP_RECEIPTS_DIR = path.join(os.tmpdir(), 'fairshare_receipts');
try {
  if (!fs.existsSync(TMP_RECEIPTS_DIR)) {
    fs.mkdirSync(TMP_RECEIPTS_DIR, { recursive: true });
  }
} catch {}

globalThis.__fairshare_receipts = globalThis.__fairshare_receipts || new Map();
globalThis.__fairshare_ledger_state = globalThis.__fairshare_ledger_state || null;

export function getPersistenceAdapter() {
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

export async function loadPersistedState(adapter) {
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
            globalThis.__fairshare_ledger_state = parsed;
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
          globalThis.__fairshare_ledger_state = rows[0].state;
          return rows[0].state;
        }
      }
    } catch (err) {
      console.warn('Failed to load from Supabase:', err);
    }
  }

  return globalThis.__fairshare_ledger_state;
}

export async function savePersistedState(adapter, state) {
  globalThis.__fairshare_ledger_state = state;

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

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    try {
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      return { buffer, mimeType };
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveReceipt(cid, fileName, dataUrl) {
  if (!cid || !dataUrl) return false;
  const cleanCid = cid.replace(/^ipfs:\/\//, '').trim();
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return false;

  const receiptItem = {
    cid: cleanCid,
    fileName: fileName || `${cleanCid}.pdf`,
    mimeType: parsed.mimeType,
    dataUrl,
    buffer: parsed.buffer,
    timestamp: Date.now(),
  };

  // 1. Store in memory map
  globalThis.__fairshare_receipts.set(cleanCid, receiptItem);

  // 2. Store in /tmp on container
  try {
    const filePath = path.join(TMP_RECEIPTS_DIR, cleanCid);
    fs.writeFileSync(filePath, parsed.buffer);
    fs.writeFileSync(
      `${filePath}.meta.json`,
      JSON.stringify({ fileName: receiptItem.fileName, mimeType: parsed.mimeType })
    );
  } catch {}

  // 3. Store in Upstash KV if available
  const adapter = getPersistenceAdapter();
  if (adapter.type === 'UPSTASH_KV') {
    try {
      await fetch(`${adapter.kvUrl}/set/fairshare_rcpt_${cleanCid}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adapter.kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify({
          fileName: receiptItem.fileName,
          mimeType: parsed.mimeType,
          dataUrl,
        })),
      });
    } catch {}
  }

  return true;
}

export async function getReceipt(cid) {
  if (!cid) return null;
  const cleanCid = cid.replace(/^ipfs:\/\//, '').trim();

  // 1. Check in-memory map
  const inMem = globalThis.__fairshare_receipts.get(cleanCid);
  if (inMem && inMem.buffer) {
    return inMem;
  }

  // 2. Check /tmp disk cache
  try {
    const filePath = path.join(TMP_RECEIPTS_DIR, cleanCid);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      let fileName = 'receipt.pdf';
      let mimeType = 'application/pdf';

      const metaPath = `${filePath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.fileName) fileName = meta.fileName;
          if (meta.mimeType) mimeType = meta.mimeType;
        } catch {}
      } else {
        const head = buffer.subarray(0, 8);
        if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
          mimeType = 'image/png';
          fileName = 'receipt.png';
        } else if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
          mimeType = 'image/jpeg';
          fileName = 'receipt.jpg';
        }
      }

      const item = { buffer, mimeType, fileName, cid: cleanCid };
      globalThis.__fairshare_receipts.set(cleanCid, item);
      return item;
    }
  } catch {}

  // 3. Check Upstash KV for dedicated receipt key
  const adapter = getPersistenceAdapter();
  if (adapter.type === 'UPSTASH_KV') {
    try {
      const res = await fetch(`${adapter.kvUrl}/get/fairshare_rcpt_${cleanCid}`, {
        headers: { Authorization: `Bearer ${adapter.kvToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const parsedMeta = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (parsedMeta && parsedMeta.dataUrl) {
            const parsed = parseDataUrl(parsedMeta.dataUrl);
            if (parsed) {
              const item = {
                buffer: parsed.buffer,
                mimeType: parsedMeta.mimeType || parsed.mimeType,
                fileName: parsedMeta.fileName || 'receipt.pdf',
                cid: cleanCid,
              };
              globalThis.__fairshare_receipts.set(cleanCid, item);
              return item;
            }
          }
        }
      }
    } catch {}
  }

  // 4. Check global ledger state expenses
  try {
    const state = (await loadPersistedState(adapter)) || globalThis.__fairshare_ledger_state;
    if (state && Array.isArray(state.expenses)) {
      const matching = state.expenses.find(e => {
        if (!e) return false;
        const expCid = (e.ipfsCid || '').replace(/^ipfs:\/\//, '').trim();
        const expHash = (e.receiptHash || '').toLowerCase();
        return (expCid === cleanCid || expHash === cleanCid.toLowerCase()) && e.receiptDataUrl;
      });

      if (matching && matching.receiptDataUrl) {
        const parsed = parseDataUrl(matching.receiptDataUrl);
        if (parsed) {
          const item = {
            buffer: parsed.buffer,
            mimeType: parsed.mimeType,
            fileName: matching.receiptFileName || 'receipt.pdf',
            cid: cleanCid,
          };
          globalThis.__fairshare_receipts.set(cleanCid, item);
          return item;
        }
      }
    }
  } catch {}

  // 5. Fallback: Query public IPFS gateways with timeout
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cleanCid}`,
    `https://cloudflare-ipfs.com/ipfs/${cleanCid}`,
    `https://ipfs.io/ipfs/${cleanCid}`,
    `https://dweb.link/ipfs/${cleanCid}`,
  ];

  for (const gwUrl of gateways) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(gwUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mimeType = res.headers.get('content-type') || 'application/pdf';
        const item = {
          buffer,
          mimeType,
          fileName: `receipt-${cleanCid.slice(0, 8)}.pdf`,
          cid: cleanCid,
        };
        globalThis.__fairshare_receipts.set(cleanCid, item);
        return item;
      }
    } catch {}
  }

  return null;
}
