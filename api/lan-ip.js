export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // On Vercel edge/serverless, return client host or cloud indicator
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'vercel';
  return res.status(200).json({ ip: host.split(':')[0] });
}
