// backend/test-openrouter.js
require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const key = (process.env.OPENROUTER_API_KEY || '').trim();
    console.log('OPENROUTER_API_KEY present?', !!key);
    if (!key) return console.error('No OPENROUTER_API_KEY set in .env');

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const body = {
      model: process.env.OPENROUTER_MODEL || 'openrouter/o3',
      messages: [
        { role: 'system', content: 'You are a small test assistant.' },
        { role: 'user', content: 'Say hello in one short sentence.' }
      ],
      temperature: 0.2,
      max_tokens: 60
    };

    const resp = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout: 20000
    });
    console.log('OK status:', resp.status);
    console.log('Choice text:', resp.data?.choices?.[0]?.message?.content || JSON.stringify(resp.data).slice(0,400));
  } catch (err) {
    console.error('Request failed status:', err.response?.status);
    console.error('Response body:', JSON.stringify(err.response?.data || err.message, null, 2));
  }
})();
