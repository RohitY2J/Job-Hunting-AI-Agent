# AI Job Agent - LinkedIn Scraper Edition 🤖

Manual LinkedIn job scraping with AI-powered extraction using Ollama + Groq.

## 🎯 Features

### 1. **Chat Interface** - Paste HTML & Extract Jobs
- Paste LinkedIn HTML directly into chat
- AI extracts jobs and companies automatically
- Preview before saving to database
- Powered by Ollama (DeepSeek-R1) + Groq fallback

### 2. **Chrome Extension** - One-Click Extraction
- Extract jobs from LinkedIn pages
- Download as JSON or send to local API
- Works on job search and detail pages
- No automation = No ToS violation

### 3. **Dual LLM System**
- **Primary**: Ollama + DeepSeek-R1 (1.5B) - Local, free, private
- **Fallback**: Groq API (DeepSeek-R1-Distill-70B) - Cloud, free tier

## 🚀 Quick Start

### 1. Install Ollama

**Windows:**
```bash
# Download from https://ollama.com/download
# Then pull the model:
ollama pull deepseek-r1:1.5b
```

**Mac/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull deepseek-r1:1.5b
```

### 2. Get Groq API Key (Optional Fallback)

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env`: `GROQ_API_KEY=your_key_here`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start MongoDB

```bash
mongod
```

### 5. Run the App

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📋 Usage Guide

### Method 1: Chat Interface (Paste HTML)

1. Go to LinkedIn jobs page
2. Right-click → "View Page Source" or press `Ctrl+U`
3. Copy the HTML
4. Go to AI Chat tab in the app
5. Paste HTML in the chat
6. AI extracts jobs → Preview → Click "Save to Database"

### Method 2: Chrome Extension

#### Install Extension:
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `ai-job-agent/extension` folder

#### Use Extension:
1. Go to LinkedIn jobs page
2. Click extension icon
3. Click "Extract Jobs from Page"
4. Choose:
   - **Download JSON**: Save locally
   - **Send to Database**: Auto-save to MongoDB

## 🏗️ Project Structure

```
ai-job-agent/
├── client/                    # React frontend
│   └── src/
│       └── components/
│           └── AIChat.jsx     # Updated with HTML paste support
├── server/
│   ├── services/
│   │   ├── llmService.js      # Ollama + Groq integration
│   │   └── htmlParserService.js  # Job extraction logic
│   ├── models/
│   │   ├── Job.js
│   │   └── Company.js
│   └── index.js               # API endpoints
├── extension/                 # Chrome extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── content.js             # LinkedIn page scraper
│   └── background.js
└── .env                       # Configuration
```

## 🔧 Configuration

### Environment Variables (`.env`)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/ai-job-agent

# Ollama (Local LLM)
OLLAMA_URL=http://localhost:11434

# Groq (Fallback LLM)
GROQ_API_KEY=your_groq_api_key_here

# Server
PORT=3001
NODE_ENV=development
```

## 🌐 API Endpoints

### Extract Jobs from HTML
```bash
POST /api/jobs/extract-html
Body: { "html": "<html>...</html>" }
Response: { "jobs": [...], "companies": [...] }
```

### Save Extracted Jobs
```bash
POST /api/jobs/save-extracted
Body: { "jobs": [...], "companies": [...] }
Response: { "saved": { "jobs": 5, "companies": 3 } }
```

### AI Chat (with HTML support)
```bash
POST /api/chat
Body: { "message": "paste HTML or ask question" }
Response: { "type": "job_extraction", "data": {...} }
```

## 🤖 LLM Models

### Ollama (Primary)
- **Model**: deepseek-r1:1.5b
- **Size**: ~1GB
- **Speed**: Fast on CPU
- **Cost**: Free
- **Privacy**: 100% local

### Groq (Fallback)
- **Model**: deepseek-r1-distill-llama-70b
- **Speed**: Very fast (cloud)
- **Cost**: Free tier (30 req/min)
- **Privacy**: Cloud-based

## 📊 Database Schema

### Job
```javascript
{
  title: String,
  company: ObjectId,
  companyName: String,
  description: String,
  skills: [String],
  category: String,
  location: { city, state, country, remote, hybrid },
  salary: { min, max, currency, period },
  jobType: String,
  applicationUrl: String,
  source: 'Manual',
  datePosted: Date
}
```

### Company
```javascript
{
  name: String,
  industry: String,
  location: String,
  description: String
}
```

## 🎨 Chrome Extension Features

- ✅ Extract from job search pages
- ✅ Extract from job detail pages
- ✅ Download as JSON
- ✅ Send to local API
- ✅ Configurable API endpoint
- ✅ Visual feedback

## 🔒 Legal & Safe

- ✅ Manual copying (no automation)
- ✅ Personal use only
- ✅ No ToS violation
- ✅ No account risk
- ✅ Local processing (Ollama)

## 🛠️ Troubleshooting

### Ollama not working?
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### Extension not extracting?
- Make sure you're on a LinkedIn jobs page
- LinkedIn changes selectors frequently - may need updates
- Check browser console for errors

### Database connection failed?
```bash
# Check MongoDB status
mongod --version

# Start MongoDB
mongod
```

## 📈 Future Enhancements

- [ ] Support for other job sites (Indeed, Seek)
- [ ] Batch HTML upload
- [ ] Job deduplication
- [ ] Email notifications for new jobs
- [ ] Resume matching score

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR

## 📝 License

MIT License - Free for personal and commercial use

---

**Built for job seekers who want control over their data! 🚀**
