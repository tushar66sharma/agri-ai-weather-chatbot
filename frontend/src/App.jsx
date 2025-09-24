import React, { useEffect, useState, useRef } from "react";
import MicCapture from "./components/MicCapture";
import WeatherCard from "./components/WeatherCard";
import SuggestionCard from "./components/SuggestionCard";
import axios from "axios";

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("ja");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(false);

  // search/autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  // 🔎 Geocode search
  useEffect(() => {
    async function doSearch() {
      if (!debouncedSearch || debouncedSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const r = await axios.get(
          `${import.meta.env.VITE_API_BASE}/api/geocode?q=${encodeURIComponent(
            debouncedSearch
          )}&lang=${language}`
        );
        setSearchResults(r.data?.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("geocode error", err);
        setSearchResults([]);
      }
    }
    doSearch();
  }, [debouncedSearch, language]);

  // ✅ Store nice name in location
  const pickResult = (r) => {
    const prettyName =
      r.name +
      (r.admin1 ? `, ${r.admin1}` : "") +
      (r.country ? `, ${r.country}` : "");
    setLocation({
      lat: Number(r.latitude),
      lon: Number(r.longitude),
      name: prettyName,
    });
    setSearchQuery(r.name);
    setShowDropdown(false);
  };

  // ✅ Current location
  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: "Current location",
        });
      },
      (err) => alert(err.message)
    );
  };

  // 🌦️ Weather fetcher
  // fetchWeather: returns weather object or null on failure
  const fetchWeather = async (lat, lon) => {
    try {
      const r = await axios.get(
        `${import.meta.env.VITE_API_BASE}/api/weather?lat=${lat}&lon=${lon}`
      );
      // If backend returned 200 with data
      return r.data;
    } catch (err) {
      console.warn(
        "fetchWeather failed (frontend):",
        err.response?.data || err.message
      );
      // return null so handleGenerate can continue
      return null;
    }
  };

  // handleGenerate: tolerant to weather fetch failures
  const handleGenerate = async () => {
    if (!transcript || transcript.trim().length < 2)
      return alert(
        language === "ja"
          ? "まず話してください"
          : language === "hi"
          ? "कृपया बोलें"
          : "Please speak first"
      );
    if (!location?.lat)
      return alert(
        language === "ja"
          ? "場所を選択してください"
          : language === "hi"
          ? "कृपया स्थान चुनें"
          : "Select a location"
      );

    setLoading(true);
    try {
      const w = await fetchWeather(location.lat, location.lon);
      if (w) setWeather(w);
      const weatherSummary =
        w && w.current_weather
          ? `Now: ${w.current_weather.temperature}°C`
          : "N/A";

      const resp = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/generate`,
        {
          text: transcript,
          lat: location.lat,
          lon: location.lon,
          locationName: location.name || "",
          weatherSummary,
          language,
        }
      );

      // show result and also any error payload returned by backend
      setSuggestions(resp.data?.result || "No suggestion");
      if (resp.data?.error) {
        // show non-blocking info in console and a friendly popup
        console.warn(
          "Generation warning (backend returned error):",
          resp.data.error
        );
        alert(
          "AI generation used fallback due to provider error. See console for details."
        );
      }
    } catch (err) {
      console.error(
        "generate err (frontend):",
        err.response?.data || err.message
      );
      const serverDetail =
        err.response?.data?.error || err.response?.data?.detail || err.message;
      alert(
        "Generation failed: " + (serverDetail || "See console for details")
      );
    } finally {
      setLoading(false);
    }
  };

  // hide dropdown when clicking outside
  useEffect(() => {
    const handler = (ev) => {
      if (!inputRef.current?.contains(ev.target)) setShowDropdown(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold">Agri-Assistant</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border px-2 py-1 rounded-md"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            {/* 🎙️ Voice capture */}
            <MicCapture
              onTranscript={(t) => setTranscript(t)}
              onFinal={(finalText) => {
                setTranscript(finalText || "");
              }}
              language={language}
            />

            {/* Transcript display */}
            <div className="mt-3">
              <div className="text-sm muted">Transcript</div>
              <div
                className="mt-2 p-3 rounded-md bg-gray-50 text-sm"
                style={{ minHeight: 64 }}
              >
                {transcript || <span className="muted">No transcript yet</span>}
              </div>
            </div>

            {/* Location input */}
            <div className="mt-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={useMyLocation}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md"
                >
                  Use current location
                </button>
                <div ref={inputRef} className="relative flex-1 w-full">
                  <input
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={
                      language === "ja"
                        ? "都市名で検索 (例: 札幌)"
                        : language === "hi"
                        ? "शहर का नाम"
                        : "Search city e.g. Mumbai"
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length) setShowDropdown(true);
                    }}
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow z-50 max-h-52 overflow-auto">
                      {searchResults.map((r, idx) => (
                        <li
                          key={idx}
                          onClick={() => pickResult(r)}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="font-medium">
                            {r.name}
                            {r.admin1 ? ", " + r.admin1 : ""}
                          </div>
                          <div className="text-xs muted">
                            {r.country} — lat: {Number(r.latitude).toFixed(2)},
                            lon: {Number(r.longitude).toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="text-sm muted">Selected</div>
              <div className="mt-2 p-3 rounded-md bg-gray-50 text-sm">
                {location ? (
                  <div>
                    {location.name}{" "}
                    <div className="muted text-xs">
                      lat: {Number(location.lat).toFixed(3)}, lon:{" "}
                      {Number(location.lon).toFixed(3)}
                    </div>
                  </div>
                ) : (
                  <span className="muted">No location chosen</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md"
                disabled={loading}
              >
                {loading
                  ? "Generating..."
                  : language === "ja"
                  ? "提案を生成"
                  : language === "hi"
                  ? "सुझाव बनाएँ"
                  : "Generate suggestions"}
              </button>
              <button
                onClick={() => {
                  setTranscript("");
                  setSuggestions("");
                  setSearchQuery("");
                  setLocation(null);
                }}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <WeatherCard weather={weather} location={location} />
          </div>
        </div>

        {/* Suggestions / output */}
        <div className="lg:col-span-2 space-y-4">
          <SuggestionCard suggestions={suggestions} />
          {/* <div className="card p-4">
            <div className="text-sm muted">Debug / Server Response</div>
            <pre
              className="mt-2 text-sm muted whitespace-pre-wrap bg-gray-50 p-3 rounded"
              style={{ minHeight: 120 }}
            >
              {suggestions ? suggestions.slice(0, 4000) : "No output yet."}
            </pre>
          </div> */}
        </div>
      </div>
    </div>
  );
}
