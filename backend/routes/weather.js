// backend/routes/weather.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/geocode", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const lang = req.query.lang || "en";
    if (!q) return res.status(400).json({ error: "q query param required" });

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=10&language=${encodeURIComponent(lang)}&format=json`;

    const r = await axios.get(url, { timeout: 30000 });
    const results = r.data?.results || [];
    return res.json({ results });
  } catch (err) {
    console.error("geocode error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: "geocoding failed", detail: err.response?.data || err.message });
  }
});

router.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (lat == null || lon == null) {
      return res.status(400).json({ error: "lat and lon required" });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(
      lon
    )}&hourly=temperature_2m,precipitation,cloudcover,windspeed_10m&current_weather=true&timezone=auto&forecast_days=3`;

    const r = await axios.get(url, { timeout: 30000 });
    return res.json(r.data);
  } catch (err) {
    console.error("weather fetch failed:", err.response?.data || err.message);
    return res.status(502).json({
      error: "weather fetch failed",
      detail: err.response?.data || err.message,
      fallback: {
        latitude: req.query.lat || null,
        longitude: req.query.lon || null,
        current_weather: null,
      },
    });
  }
});

module.exports = router;
