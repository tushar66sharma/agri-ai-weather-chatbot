# 🌾 Agri-AI Weather Chatbot

An AI-powered agricultural assistant that combines **real-time weather**, **location**, and **generative AI** to produce practical, multilingual crop-care suggestions.  
Built with a React + Vite frontend and a Node.js + Express backend using **OpenRouter** for LLM completions and **Open-Meteo** for weather data.

---

## 🚀 Tech stack
- **Frontend**: React, Vite, Tailwind CSS  
- **Backend**: Node.js, Express, Axios, dotenv, cors  
- **AI**: OpenRouter (chat completions)  
- **Weather**: Open-Meteo (free)  
- **Speech**: Browser Web Speech API (voice input)  
- **Deployment (recommended)**: Vercel (frontend) + Render (backend)

---

## ✨ Features
- 🎤 Voice input (Japanese / English / Hindi) via the Web Speech API  
- 📍 Location search + “Use current location” (Open-Meteo geocoding)  
- ☁️ Live weather fetch and included in AI prompt (Open-Meteo)  
- 🤖 Generative suggestions by OpenRouter using: **voice transcript + selected location + weather**  
- 🔁 Local fallback generator when external LLM fails (keeps UI responsive)  
- 🎨 Modern responsive UI with Tailwind  
- 📄 Copy / download suggestions (UI buttons)

---
## 📁 Project structure
- **agri-ai-weather-chatbot/**
  - **backend/**
    - **server.js**
    - **package.json**
    - **routes/**
      - **generate.js # AI integration + local fallback**
      - **weather.js # geocode + weather (Open-Meteo)**
    - **.env # backend env (local only - don't commit)**
  - **frontend/**
    - **package.json**
    - **src/**
      - **App.jsx**
    - **components/**
      - **MicCapture.jsx**
      - **WeatherCard.jsx**
      - **SuggestionCard.jsx**
    - **.env # frontend env (Vite: VITE_API_BASE)**


## 📂 Backend
```bash
cd backend
npm install
cp .env.example .env
PORT=4000
GENERATOR_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_openrouter_XXXXXXXXXXXXXXXX
OPENROUTER_MODEL=openrouter/o3
ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app,*.vercel.app
npm run dev
```
## 📂 Frontend

```bash
cd frontend
npm install
npm start
# Edit .env:
VITE_API_BASE=http://localhost:4000
```
---
## 🔌 OpenRouter setup (get API key & test)

 - Sign up / log in at https://openrouter.ai/
 - Create an API key in the dashboard → copy it.
 - Put the key into backend/.env as OPENROUTER_API_KEY. Set OPENROUTER_MODEL to a model listed in your OpenRouter dashboard (default example: openrouter/o3).
---

---
## 🚀 Deploy (recommended flow)
- Backend → Render
- Push repo to GitHub.
- On Render, create New → Web Service, connect the repo.
- Set Root Directory to backend.
- Build command: npm install
- Start command: npm start (ensure backend/package.json has "start": "node server.js").
- Add environment variables on Render (OPENROUTER_API_KEY, OPENROUTER_MODEL, GENERATOR_PROVIDER, ALLOWED_ORIGINS).
- Deploy — note the public URL (e.g., https://your-backend.onrender.com).
- Frontend → Vercel
- Import repo in Vercel.
- Configure project: Root Directory = frontend.
- Build: npm run build, Output directory: dist.
- Add environment variable VITE_API_BASE=https://your-backend.onrender.com.
- Deploy — open your Vercel URL.
- CORS tip: Set ALLOWED_ORIGINS on the backend to include the exact Vercel origin, or use *.vercel.app to cover previews.
---
---
## 🔎 Troubleshooting (common issues)

- CORS errors (browser)
- Ensure backend ALLOWED_ORIGINS includes your frontend origin(s). Use wildcard *.vercel.app if you want to include preview URLs. Restart/redeploy backend after changing env.
- OpenRouter 401
- API key missing/invalid. Regenerate key in OpenRouter dashboard and update OPENROUTER_API_KEY.
- OpenRouter 400
- Request body shape wrong (OpenRouter expects messages with {role, content}). Use the chat completions format.
- Speech recognition not working
- Use Chrome/Edge. Firefox/Safari support is inconsistent.
- Weather API timeouts
- Increase axios timeout in backend/routes/weather.js or implement a retry / fallback so generation still runs with weatherSummary = 'N/A'.
- Backend works locally but not from deployed frontend
- Likely CORS/env mismatch or backend not reachable (check backend logs and ensure VITE_API_BASE is correct in Vercel).
---
