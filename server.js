import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDataFiles, readJson, writeJson, findUserByEmail, createUser, verifyPassword, getUserById, appendHistoryForUser, getHistoryForUser } from './storage.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// DeepL configuration
const deeplEndpoint = (process.env.DEEPL_ENDPOINT || 'https://api-free.deepl.com').replace(/\/$/, '');
const deeplApiKey = process.env.DEEPL_API_KEY || '';

// Sessions
const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-change-me';
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure data files exist
ensureDataFiles();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const user = await createUser({ email, password, name: name || email.split('@')[0] });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Register failed', details: String(err) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: String(err) });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.json(null);
  const user = await getUserById(req.session.userId);
  if (!user) return res.json(null);
  res.json({ id: user.id, email: user.email, name: user.name });
});

app.get('/api/history', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const items = await getHistoryForUser(req.session.userId);
  res.json(items);
});

// DeepL languages (target languages)
app.get('/api/languages', async (req, res) => {
  try {
    const url = `${deeplEndpoint}/v2/languages?type=target`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `DeepL-Auth-Key ${deeplApiKey}` }
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'Failed to fetch languages', details: text });
    }
    const data = await resp.json(); // [{ language: 'EN', name: 'English (American)', supports_formality: false }]
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Languages fetch error', details: String(err) });
  }
});

// Translate endpoint (DeepL)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, to } = req.body || {};
    if (!text || !to) {
      return res.status(400).json({ error: 'Missing required fields: text and to' });
    }

    const url = `${deeplEndpoint}/v2/translate`;
    const form = new URLSearchParams();
    form.set('text', text);
    // DeepL expects uppercase language codes like EN, ES, FR; accept lower and upper from client
    form.set('target_lang', String(to).toUpperCase());
    // Omit source_lang to let DeepL auto-detect

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
    // Expected shape: { translations: [{ detected_source_language, text }] }
    const translatedText = result?.translations?.[0]?.text || '';
    // Persist history for logged-in users
    if (req.session.userId) {
      await appendHistoryForUser(req.session.userId, {
        originalText: text,
        translatedText,
        targetLang: String(to).toUpperCase(),
        createdAt: new Date().toISOString()
      });
    }
    res.json({ translatedText, raw: result });
  } catch (err) {
    res.status(500).json({ error: 'Translate error', details: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


