// backend/server.js (minimal server + robust CORS, safe for Render/Vercel)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// ALLOWED_ORIGINS environment variable expected (comma separated)
// Example: "https://my-front.vercel.app,*.vercel.app,http://localhost:5173"
const allowedRaw = (process.env.ALLOWED_ORIGINS || '').trim();
const allowedList = allowedRaw ? allowedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

// helper: support exact and wildcard like *.vercel.app
function originAllowed(origin) {
  if (!origin) return true; // allow non-browser (curl / server-to-server)
  if (allowedList.includes(origin)) return true;
  for (const entry of allowedList) {
    if (entry === '*') return true;
    if (entry.startsWith('*.')) {
      try {
        const host = new URL(origin).host; // e.g. 'abc.vercel.app'
        const domain = entry.slice(2);     // 'vercel.app'
        if (host === domain) continue;
        if (host.endsWith('.' + domain)) return true;
      } catch (e) {
        // ignore
      }
    }
  }
  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    if (originAllowed(origin)) return callback(null, true);
    console.warn('[CORS] blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 204
};

// Apply CORS to all routes (this also handles preflight internally)
app.use(cors(corsOptions));

// --- your route mounts (unchanged) ---
const generateRouter = require('./routes/generate');
const weatherRouter = require('./routes/weather');

app.use('/api', generateRouter);
app.use('/api', weatherRouter);

// optional health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  console.log('CORS allowed list:', allowedList.length ? allowedList : 'none (local defaults allow)');
});
