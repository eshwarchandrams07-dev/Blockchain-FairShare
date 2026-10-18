import { getReceipt, normalizeCid } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end();
  }

  try {
    // Extract CID from query or path rewrites
    let rawCid = req.query?.cid || req.query?.path || req.query?.id || '';
    if (!rawCid && req.url) {
      const pathname = req.url.split('?')[0];
      if (pathname.startsWith('/ipfs/')) {
        rawCid = pathname.replace('/ipfs/', '');
      } else if (pathname.startsWith('/api/receipts/')) {
        rawCid = pathname.replace('/api/receipts/', '');
      } else if (pathname.startsWith('/api/ipfs/')) {
        rawCid = pathname.replace('/api/ipfs/', '');
      }
    }
    const cleanCid = normalizeCid(rawCid);

    if (!cleanCid) {
      return res.status(400).json({ error: 'Missing IPFS CID parameter' });
    }

    const receipt = await getReceipt(cleanCid);

    if (!receipt || !receipt.buffer) {
      // Return a clean fallback notice instead of hanging or returning HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>IPFS Document - FairShare</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
              .card { max-width: 480px; padding: 32px; background: #1e293b; border-radius: 16px; border: 1px solid #334155; text-align: center; }
              .mono { font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all; background: #0f172a; padding: 8px; border-radius: 6px; margin: 12px 0; }
              .btn { display: inline-block; padding: 10px 18px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>📦 IPFS Content Processing</h2>
              <p>The document for CID is syncing across the decentralized network:</p>
              <div class="mono">${cleanCid}</div>
              <p style="font-size: 13px; color: #94a3b8;">If this receipt was created on another device, ensure it has synced via the live ledger.</p>
              <a href="/" class="btn">Return to FairShare Ledger</a>
            </div>
          </body>
        </html>
      `);
    }

    const mimeType = receipt.mimeType || 'application/pdf';
    const fileName = receipt.fileName || `${cleanCid}.pdf`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', receipt.buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Ipfs-Path', `/ipfs/${cleanCid}`);

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    return res.status(200).end(receipt.buffer);
  } catch (err) {
    console.error('IPFS resolution error on Vercel:', err);
    return res.status(500).json({ error: 'Internal error resolving IPFS document' });
  }
}
