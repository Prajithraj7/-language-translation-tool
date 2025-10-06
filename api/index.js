import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();

// DeepL configuration
const deeplEndpoint = (process.env.DEEPL_ENDPOINT || 'https://api-free.deepl.com').replace(/\/$/, '');
const deeplApiKey = process.env.DEEPL_API_KEY || '';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Language Translation Tool API is running!' });
});

// DeepL languages (target languages)
app.get('/api/languages', async (req, res) => {
  try {
    if (!deeplApiKey) {
      return res.status(500).json({ error: 'DeepL API key not configured' });
    }
    
    const url = `${deeplEndpoint}/v2/languages?type=target`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `DeepL-Auth-Key ${deeplApiKey}` }
    });
    
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'Failed to fetch languages', details: text });
    }
    
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('Languages fetch error:', err);
    res.status(500).json({ error: 'Languages fetch error', details: String(err) });
  }
});

// Translate endpoint (DeepL)
app.post('/api/translate', async (req, res) => {
  try {
    if (!deeplApiKey) {
      return res.status(500).json({ error: 'DeepL API key not configured' });
    }
    
    const { text, to } = req.body || {};
    if (!text || !to) {
      return res.status(400).json({ error: 'Missing required fields: text and to' });
    }

    const url = `${deeplEndpoint}/v2/translate`;
    const form = new URLSearchParams();
    form.set('text', text);
    form.set('target_lang', String(to).toUpperCase());

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    if (!resp.ok) {
      const textBody = await resp.text();
      return res.status(resp.status).json({ error: 'Translation failed', details: textBody });
    }

    const result = await resp.json();
    const translatedText = result?.translations?.[0]?.text || '';
    
    res.json({ translatedText, raw: result });
  } catch (err) {
    console.error('Translate error:', err);
    res.status(500).json({ error: 'Translate error', details: String(err) });
  }
});

// Simple auth endpoints (without file storage for now)
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Registration temporarily disabled for deployment' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login temporarily disabled for deployment' });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json(null);
});

app.get('/api/history', (req, res) => {
  res.json([]);
});

// Serve static files
app.get('*', (req, res) => {
  res.sendFile('public/index.html', { root: process.cwd() });
});

// For Vercel
export default app;