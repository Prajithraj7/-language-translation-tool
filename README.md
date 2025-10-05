## Language Translation Tool

A simple web app that translates text between languages using Microsoft Translator (Azure Cognitive Services). Includes copy-to-clipboard and text-to-speech.

### Prerequisites
- Node.js 18+
- Azure Cognitive Services Translator resource
  - Translator Key
  - Translator Endpoint (e.g., https://api.cognitive.microsofttranslator.com)
  - Translator Region (e.g., eastus) if your endpoint requires it

### Setup
1. Create a `.env` at project root based on `.env.example`.
2. Install dependencies and run:

```bash
npm install
npm run dev
```

3. Open `http://localhost:3000` in your browser.

### Build & Run (production)
```bash
npm run build
npm start
```

### Notes
- The backend proxies API calls so your key is not exposed to the browser.
- If you prefer Google Cloud Translate, swap the backend implementation accordingly.

