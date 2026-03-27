// /api/contact.js
// Accepts POST from the GET LISTED form, writes to Airtable "Contact Submissions" table.
// Create a table named "Contact Submissions" in your Airtable base with fields:
//   Name (text), Email (email), Type (text), Organization (text), Region (text), Message (long text), Submitted At (date)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, type, organization, region, message } = req.body || {};

  // Basic validation
  if (!name || !email || !type || !organization || !region) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Rudimentary email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const BASE  = process.env.AIRTABLE_BASE;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const CONTACT_TABLE = process.env.AIRTABLE_CONTACT_TABLE || 'Contact Submissions';

  if (!BASE || !TOKEN) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const airtableUrl = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(CONTACT_TABLE)}`;

  try {
    const upstream = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'Name':         name.slice(0, 200),
            'Email':        email.slice(0, 200),
            'Type':         type.slice(0, 100),
            'Organization': organization.slice(0, 200),
            'Region':       region.slice(0, 100),
            'Message':      (message || '').slice(0, 2000),
            'Submitted At': new Date().toISOString().split('T')[0],
          },
        }],
        typecast: true,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error('Airtable contact error:', upstream.status, text);
      return res.status(500).json({ error: 'Failed to save submission' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact proxy error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
