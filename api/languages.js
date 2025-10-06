export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deeplApiKey = process.env.DEEPL_API_KEY;
    if (!deeplApiKey) {
      return res.status(500).json({ error: 'DeepL API key not configured' });
    }
    
    const url = 'https://api-free.deepl.com/v2/languages?type=target';
    const response = await fetch(url, {
      headers: { 'Authorization': `DeepL-Auth-Key ${deeplApiKey}` }
    });
    
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Failed to fetch languages', details: text });
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Languages fetch error:', err);
    res.status(500).json({ error: 'Languages fetch error', details: String(err) });
  }
}
