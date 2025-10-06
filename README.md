# 🌐 Language Translation Tool

A beautiful, modern web application for translating text between languages using DeepL API. Features user authentication, translation history, and a stunning glassmorphism UI.

![Language Translation Tool](https://img.shields.io/badge/Status-Live-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)

## ✨ Features

- 🔄 **Real-time Translation** - Powered by DeepL API for accurate translations
- 🎨 **Modern UI** - Beautiful glassmorphism design with subtle color palette
- 👤 **User Authentication** - Register, login, and manage your account
- 📚 **Translation History** - Save and view your past translations
- 🔊 **Text-to-Speech** - Listen to translated text in the target language
- 📋 **Copy to Clipboard** - Easy copying of translated text
- 📱 **Responsive Design** - Works perfectly on desktop and mobile

## 🚀 Live Demo

**🌐 [View Live Application](https://your-app-name.vercel.app)**

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Express Sessions, bcryptjs
- **Translation API**: DeepL
- **Storage**: JSON file-based storage
- **Deployment**: Vercel

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- DeepL API Key (free tier available)

### 1. Clone the Repository
```bash
git clone https://github.com/Prajithraj7/-language-translation-tool.git
cd language-translation-tool
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
DEEPL_API_KEY=your_deepl_api_key_here
DEEPL_ENDPOINT=https://api-free.deepl.com
PORT=3002
SESSION_SECRET=your-secret-key-change-this-in-production
```

### 4. Get DeepL API Key
1. Visit [DeepL API](https://www.deepl.com/pro-api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### 5. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3002` to see your application!

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Click "New Project"
   - Import your repository: `Prajithraj7/-language-translation-tool`

2. **Configure Environment Variables**:
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add your DeepL API key and other variables

3. **Deploy**:
   - Click "Deploy" and get your live URL!

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. Connect GitHub and select your repository
3. Add environment variables in Railway dashboard
4. Deploy automatically

### Option 3: Netlify Functions

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub and deploy
3. Configure serverless functions for API endpoints

## 📁 Project Structure

```
language-translation-tool/
├── public/                 # Frontend files
│   ├── index.html         # Main application page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Application styles
├── .github/
│   └── workflows/        # GitHub Actions
├── data/                 # User data storage (auto-created)
├── server.js            # Backend server
├── storage.js           # Data persistence layer
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment config
└── README.md           # This file
```

## 🔧 API Endpoints

- `GET /api/health` - Health check
- `GET /api/languages` - Get supported languages
- `POST /api/translate` - Translate text
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/history` - Get translation history

## 🎨 UI Features

- **Glassmorphism Design** - Modern frosted glass effect
- **Subtle Color Palette** - Professional and easy on the eyes
- **Responsive Layout** - Adapts to all screen sizes
- **Smooth Animations** - Polished user experience
- **Personalized Banner** - Custom branding area

## 🔒 Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Input validation and sanitization
- CORS protection
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Prajithraj R**
- GitHub: [@Prajithraj7](https://github.com/Prajithraj7)
- Project: [Language Translation Tool](https://github.com/Prajithraj7/-language-translation-tool)

## 🙏 Acknowledgments

- DeepL for providing excellent translation API
- Express.js community for the robust framework
- All contributors and users of this project

---

⭐ **Star this repository if you found it helpful!**
