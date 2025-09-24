// backend/routes/generate.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const PROVIDER = (process.env.GENERATOR_PROVIDER || "openrouter").toLowerCase();
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/o3"; // default safe value

function nowLabel() { return new Date().toISOString(); }

function localGenerator({ text, lat, lon, locationName, weatherSummary, language }) {
  // minimal local fallback to avoid empty UI
  const lang = (language === "ja") ? "ja" : (language === "hi") ? "hi" : "en";
  const header = (lang === "ja") ? `あなたの相談: ${text}` : (lang === "hi") ? `आपका संदेश: ${text}` : `User: ${text}`;
  const body = (lang === "ja") ? "まず土壌の湿度を確認してください。" : (lang === "hi") ? "पहले मिट्टी की नमी जाँचें।" : "First check soil moisture and drainage.";
  return `• ${header}\n• ${body}\n• Generated at ${nowLabel()}`;
}

/** call OpenRouter chat completions */
async function callOpenRouterChat({ messages, model }) {
  if (!OPENROUTER_KEY) throw new Error("OpenRouter API key not configured");
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const body = { model, messages, temperature: 0.7, max_tokens: 600 };
  const headers = { Authorization: `Bearer ${OPENROUTER_KEY}`, "Content-Type": "application/json" };
  const r = await axios.post(url, body, { headers, timeout: 60000 });
  // OpenRouter returns choices[0].message.content
  return r.data;
}

router.post("/generate", async (req, res) => {
  try {
    const { text = "", lat = "", lon = "", weatherSummary = "", language = "en", locationName = "" } = req.body;
    console.log("[/api/generate] got:", { text: (text||"").slice(0,200), lat, lon, language, locationName });

    const promptUser = `User question: "${text}"\nLocation: ${locationName || `${lat},${lon}`}\nWeather: ${weatherSummary}\nPlease provide 3-6 practical agricultural suggestions in language code: ${language}. Use short bullet points.`;

    if (PROVIDER === "openrouter") {
      try {
        const messages = [
          { role: "system", content: "You are an experienced agricultural advisor. Provide concise actionable bullet suggestions." },
          { role: "user", content: promptUser }
        ];
        const openResp = await callOpenRouterChat({ messages, model: OPENROUTER_MODEL });
        const choice = openResp?.choices?.[0];
        const aiText = choice?.message?.content ?? (openResp?.output ?? JSON.stringify(openResp).slice(0,2000));
        console.log("[/api/generate] OpenRouter success - returning result");
        return res.json({ result: aiText, source: "openrouter", raw: openResp });
      } catch (err) {
        // log detailed info for you to paste here
        console.error("[/api/generate] OpenRouter error status:", err.response?.status);
        console.error("[/api/generate] OpenRouter error body:", JSON.stringify(err.response?.data || err.message).slice(0,5000));
        // fallback to local generator but surface the error to frontend
        const local = localGenerator({ text, lat, lon, locationName, weatherSummary, language });
        return res.json({ result: local, source: "local", error: err.response?.data || err.message });
      }
    } else {
      // purely local generator
      const local = localGenerator({ text, lat, lon, locationName, weatherSummary, language });
      return res.json({ result: local, source: "local" });
    }
  } catch (err) {
    console.error("[/api/generate] fatal:", err);
    return res.status(500).json({ error: "generation failed", detail: err.message });
  }
});

module.exports = router;
