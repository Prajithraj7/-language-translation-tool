// DOM elements
const sourceTextEl = document.getElementById('sourceText');
const translatedTextEl = document.getElementById('translatedText');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const statusEl = document.getElementById('status');

// Auth elements
const userNameDisplay = document.getElementById('userNameDisplay');
const loginLink = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const logoutBtn = document.getElementById('logoutBtn');
const historySection = document.getElementById('historySection');
const translationHistoryList = document.getElementById('translationHistoryList');

// Status display
function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = isError ? 'status error' : 'status';
}

// Fetch and populate languages
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

function populateLanguageSelects(languages) {
  // DeepL returns array: [{ language: 'EN', name: 'English (American)', supports_formality: false }]
  const entries = Array.isArray(languages)
    ? languages.map(l => [l.language, { name: l.name }])
    : Object.entries(languages || {});
  
  // Preferred defaults
  const defaultSource = 'auto';
  const defaultTarget = 'EN'; // DeepL uses uppercase codes

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

// Translation function
async function translate() {
  const text = sourceTextEl.value.trim();
  const from = sourceLangSelect.value === 'auto' ? undefined : sourceLangSelect.value;
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
      body: JSON.stringify({ text, from, to })
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
    await renderHistory(); // Refresh history after translation
  } catch (err) {
    console.error(err);
    setStatus(String(err?.message || err || 'Translation failed'), true);
  }
}

// Copy to clipboard
async function copyToClipboard() {
  const text = translatedTextEl.value;
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard!');
    setTimeout(() => setStatus(''), 2000);
  } catch (err) {
    console.error('Copy failed:', err);
    setStatus('Copy failed', true);
  }
}

// Text-to-speech
let voicesLoaded = false;
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    voicesLoaded = true;
  };
}

function getVoiceForLanguage(langCode) {
  const voices = speechSynthesis.getVoices();
  // DeepL codes are often like EN, ES, FR. BCP-47 tags are en-US, es-ES, fr-FR.
  // Try to find a voice that starts with the DeepL code (case-insensitive)
  const primaryMatch = voices.find(v => v.lang?.toLowerCase().startsWith(langCode.toLowerCase()));
  if (primaryMatch) return primaryMatch;

  // Fallback for common variants if primary not found
  if (langCode === 'EN') return voices.find(v => v.lang?.toLowerCase().startsWith('en-us') || v.lang?.toLowerCase().startsWith('en-gb'));
  if (langCode === 'PT') return voices.find(v => v.lang?.toLowerCase().startsWith('pt-br') || v.lang?.toLowerCase().startsWith('pt-pt'));

  return null; // No suitable voice found
}

function speakText() {
  const text = translatedTextEl.value;
  if (!text || !('speechSynthesis' in window)) return;

  const performSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const targetCode = targetLangSelect.value;
    const voice = getVoiceForLanguage(targetCode);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang; // Set lang on utterance for better voice matching
    } else {
      // Fallback to target language code if no specific voice found
      utterance.lang = targetCode.toLowerCase();
    }
    speechSynthesis.speak(utterance);
  };

  if (voicesLoaded) {
    performSpeak();
  } else {
    // Wait for voices to load if not already
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      performSpeak();
    };
  }
}

// Auth functions
async function checkSession() {
  try {
    const resp = await fetch('/api/auth/me');
    const user = await resp.ok ? await resp.json() : null;
    renderAuthUI(user);
    if (user) {
      await renderHistory();
    }
  } catch (err) {
    console.error('Session check failed:', err);
    renderAuthUI(null);
  }
}

function renderAuthUI(user) {
  if (user) {
    userNameDisplay.textContent = user.name || user.email;
    userNameDisplay.style.display = 'inline';
    loginLink.style.display = 'none';
    registerLink.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    historySection.style.display = 'block';
  } else {
    userNameDisplay.style.display = 'none';
    loginLink.style.display = 'inline';
    registerLink.style.display = 'inline';
    logoutBtn.style.display = 'none';
    historySection.style.display = 'none';
  }
}

async function renderHistory() {
  if (!translationHistoryList) return;
  
  try {
    const resp = await fetch('/api/history');
    if (!resp.ok) return;
    const items = await resp.json();
    
    translationHistoryList.innerHTML = items.length === 0 
      ? '<li class="no-history">No translations yet</li>'
      : items.slice(0, 10).map(item => `
          <li class="history-item">
            <div class="history-text">
              <strong>${item.originalText}</strong>
              <span class="history-arrow">→</span>
              <em>${item.translatedText}</em>
            </div>
            <div class="history-meta">
              ${item.targetLang} • ${new Date(item.createdAt).toLocaleDateString()}
            </div>
          </li>
        `).join('');
  } catch (err) {
    console.error('History load failed:', err);
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    renderAuthUI(null);
    translationHistoryList.innerHTML = '';
  } catch (err) {
    console.error('Logout failed:', err);
  }
}

// Event listeners
if (translateBtn) translateBtn.addEventListener('click', translate);
if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
if (speakBtn) speakBtn.addEventListener('click', speakText);
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Enter key for translation
if (sourceTextEl) {
  sourceTextEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      translate();
    }
  });
}

// Initialize
fetchLanguages();
checkSession();
