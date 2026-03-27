// /api/airtable.js
// Serverless proxy — keeps AIRTABLE_TOKEN server-side only.
// Usage: GET /api/airtable?table=tblXXX&offset=XXXX

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table, offset } = req.query;

  if (!table) {
    return res.status(400).json({ error: 'Missing table parameter' });
  }

  // Allowlist — only permit known table IDs to prevent arbitrary Airtable access
  const ALLOWED_TABLES = new Set([
    'tblrzWPnDsJUJyrXd', // funds
    'tblEn1mjWUcGrSpZt', // investors
    'tblJaOtCGMcs6i5Gv', // partners
    'tblNOHxtryoELutOG', // events
    'tblgqjHZRHygZoAQA', // dispatch
  ]);

  if (!ALLOWED_TABLES.has(table)) {
    return res.status(403).json({ error: 'Table not permitted' });
  }

  const BASE  = process.env.AIRTABLE_BASE;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  if (!BASE || !TOKEN) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const airtableUrl = `https://api.airtable.com/v0/${BASE}/${table}${offset ? `?offset=${encodeURIComponent(offset)}` : ''}`;

  try {
    const upstream = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('Airtable error:', upstream.status, text);
      return res.status(upstream.status).json({ error: 'Upstream error' });
    }

    const data = await upstream.json();

    // Cache for 5 minutes (CDN + browser) — adjust as needed
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy fetch error:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
}
