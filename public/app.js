const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const sourceTextEl = document.getElementById('sourceText');
const translatedTextEl = document.getElementById('translatedText');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const statusEl = document.getElementById('status');
const authStatusEl = document.getElementById('authStatus');
const logoutBtn = document.getElementById('logoutBtn');

function setStatus(message, isError = false) {
  statusEl.textContent = message || '';
  statusEl.className = isError ? 'status error' : 'status';
}

async function fetchLanguages() {
  setStatus('Loading languages...');
  try {
    const resp = await fetch('/api/languages');
    if (!resp.ok) throw new Error('Failed to load languages');
    const data = await resp.json();
    populateLanguageSelects(data);
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus('Could not load languages', true);
  }
}

async function refreshAuth() {
  try {
    const resp = await fetch('/api/auth/me');
    const me = await resp.json();
    if (me && me.email) {
      if (authStatusEl) authStatusEl.textContent = `Logged in as ${me.name || me.email}`;
      if (logoutBtn) logoutBtn.style.display = '';
      const historySection = document.getElementById('historySection');
      if (historySection) historySection.style.display = '';
      await loadHistory();
    } else {
      if (authStatusEl) authStatusEl.textContent = 'Not logged in';
      if (logoutBtn) logoutBtn.style.display = 'none';
      const historySection = document.getElementById('historySection');
      if (historySection) historySection.style.display = 'none';
    }
  } catch {}
}

async function loadHistory() {
  try {
    const resp = await fetch('/api/history');
    if (!resp.ok) return;
    const items = await resp.json();
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = '';
    for (const item of items) {
      const li = document.createElement('li');
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${new Date(item.createdAt).toLocaleString()} · → ${item.targetLang}`;
      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = `${item.originalText}\n—\n${item.translatedText}`;
      li.appendChild(meta);
      li.appendChild(text);
      list.appendChild(li);
    }
  } catch {}
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refreshAuth();
    } catch {}
  });
}

function populateLanguageSelects(languages) {
  // DeepL returns array: [{ language: 'EN', name: 'English (American)', supports_formality: false }]
  const entries = Array.isArray(languages)
    ? languages.map(l => [l.language, { name: l.name }])
    : Object.entries(languages || {});
  // Preferred defaults
  const defaultSource = 'auto';
  const defaultTarget = 'EN';

  // Add Auto-detect for source
  const autoOption = document.createElement('option');
  autoOption.value = 'auto';
  autoOption.textContent = 'Auto-detect';
  sourceLangSelect.appendChild(autoOption);

  for (const [code, meta] of entries) {
    const name = meta?.name || code;

    const opt1 = document.createElement('option');
    opt1.value = code;
    opt1.textContent = `${name} (${code})`;
    sourceLangSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = code;
    opt2.textContent = `${name} (${code})`;
    targetLangSelect.appendChild(opt2);
  }

  sourceLangSelect.value = defaultSource;
  if ([...targetLangSelect.options].some(o => o.value === defaultTarget)) {
    targetLangSelect.value = defaultTarget;
  }
}

async function translate() {
  const text = sourceTextEl.value.trim();
  const to = targetLangSelect.value;

  if (!text) {
    setStatus('Please enter text to translate', true);
    return;
  }
  if (!to) {
    setStatus('Please select a target language', true);
    return;
  }

  setStatus('Translating...');
  translatedTextEl.value = '';

  try {
    const resp = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, to })
    });
    const data = await resp.json();
    if (!resp.ok) {
      const serverMsg = [data?.error, data?.message, data?.details]
        .filter(Boolean)
        .join(' – ');
      throw new Error(serverMsg || 'Translation failed');
    }
    translatedTextEl.value = data.translatedText || '';
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus(String(err?.message || err || 'Translation failed'), true);
  }
}

async function copyToClipboard() {
  const text = translatedTextEl.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard');
    setTimeout(() => setStatus(''), 1500);
  } catch (err) {
    console.error(err);
    setStatus('Copy failed', true);
  }
}

// Map DeepL language codes to BCP-47 language tags for TTS
const deeplToBCP47 = {
  EN: 'en-US', 'EN-GB': 'en-GB', 'EN-US': 'en-US', ES: 'es-ES', FR: 'fr-FR', DE: 'de-DE', IT: 'it-IT',
  PT: 'pt-PT', 'PT-PT': 'pt-PT', 'PT-BR': 'pt-BR', NL: 'nl-NL', PL: 'pl-PL', RU: 'ru-RU', JA: 'ja-JP',
  ZH: 'zh-CN', ZH_CN: 'zh-CN', ZH_TW: 'zh-TW', KO: 'ko-KR', AR: 'ar-SA', SV: 'sv-SE', NO: 'nb-NO',
  DA: 'da-DK', FI: 'fi-FI', CS: 'cs-CZ', TR: 'tr-TR', RO: 'ro-RO', HU: 'hu-HU', ID: 'id-ID', UK: 'uk-UA',
  EL: 'el-GR', BG: 'bg-BG', SK: 'sk-SK', SL: 'sl-SI', LT: 'lt-LT', LV: 'lv-LV', ET: 'et-EE'
};

function ensureVoicesLoaded() {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length) return resolve(voices);
    const onVoices = () => {
      const v = speechSynthesis.getVoices();
      if (v && v.length) {
        speechSynthesis.onvoiceschanged = null;
        resolve(v);
      }
    };
    speechSynthesis.onvoiceschanged = onVoices;
    // Fallback timeout in case event doesn't fire
    setTimeout(() => resolve(speechSynthesis.getVoices()), 500);
  });
}

async function speakText() {
  const text = translatedTextEl.value;
  if (!text || !('speechSynthesis' in window)) return;

  // Stop any ongoing speech
  speechSynthesis.cancel();

  const targetCode = (targetLangSelect.value || '').toUpperCase();
  const desiredLang = deeplToBCP47[targetCode] || targetCode.toLowerCase();

  const utterance = new SpeechSynthesisUtterance(text);
  if (desiredLang) utterance.lang = desiredLang;

  try {
    const voices = await ensureVoicesLoaded();
    if (voices && voices.length) {
      const lower = (desiredLang || '').toLowerCase();
      const exact = voices.find(v => v.lang?.toLowerCase() === lower);
      const starts = exact || voices.find(v => v.lang?.toLowerCase().startsWith(lower.slice(0, 2)));
      if (starts) utterance.voice = starts;
    }
  } catch {}

  speechSynthesis.speak(utterance);
}

translateBtn.addEventListener('click', translate);
copyBtn.addEventListener('click', copyToClipboard);
speakBtn.addEventListener('click', speakText);

// Load voices early for some browsers
if ('speechSynthesis' in window) {
  // Trigger lazy loading of voices in some browsers
  speechSynthesis.getVoices();
}

fetchLanguages();
refreshAuth();


