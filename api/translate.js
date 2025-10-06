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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deeplApiKey = process.env.DEEPL_API_KEY;
    if (!deeplApiKey) {
      return res.status(500).json({ error: 'DeepL API key not configured' });
    }
    
    const { text, to } = req.body || {};
    if (!text || !to) {
      return res.status(400).json({ error: 'Missing required fields: text and to' });
    }

    const url = 'https://api-free.deepl.com/v2/translate';
    const form = new URLSearchParams();
    form.set('text', text);
    form.set('target_lang', String(to).toUpperCase());

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    if (!response.ok) {
      const textBody = await response.text();
      return res.status(response.status).json({ error: 'Translation failed', details: textBody });
    }

    const result = await response.json();
    const translatedText = result?.translations?.[0]?.text || '';
    
    res.status(200).json({ translatedText, raw: result });
  } catch (err) {
    console.error('Translate error:', err);
    res.status(500).json({ error: 'Translate error', details: String(err) });
  }
}
