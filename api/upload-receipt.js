import { saveReceipt, normalizeCid } from './_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { cid, fileName, dataUrl } = body || {};

    if (!cid || !dataUrl) {
      return res.status(400).json({ error: 'Missing cid or dataUrl parameter' });
    }

    const cleanCid = normalizeCid(cid);
    await saveReceipt(cleanCid, fileName, dataUrl);

    return res.status(200).json({
      success: true,
      cid: cleanCid,
      url: `/ipfs/${cleanCid}`,
    });
  } catch (err) {
    console.error('Error saving uploaded receipt on Vercel:', err);
    return res.status(500).json({ error: err.message || 'Internal error saving receipt' });
  }
}
