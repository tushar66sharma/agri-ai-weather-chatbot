import React, { useEffect, useState, useRef, useCallback } from "react";
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

  // typing / mic collision protection
  const [lockMicUpdates, setLockMicUpdates] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // search/autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // wrapper ref for the input area (dropdown positioned relative to it)
  const wrapperRef = useRef(null);

  // 🔎 Geocode search: shared function so button + debounce can call it
  const performSearch = useCallback(
    async (q) => {
      const query = (q || "").trim();
      if (!query || query.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      setSearchLoading(true);
      try {
        const r = await axios.get(
          `${import.meta.env.VITE_API_BASE}/api/geocode?q=${encodeURIComponent(
            query
          )}&lang=${language}`
        );
        setSearchResults(r.data?.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("geocode error", err);
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    },
    [language]
  );

  // call performSearch when debouncedSearch changes (typing pause)
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    performSearch(debouncedSearch);
  }, [debouncedSearch, performSearch]);

  // ✅ Store nice name in location
  const pickResult = (r) => {
    const prettyName =
      r.name + (r.admin1 ? `, ${r.admin1}` : "") + (r.country ? `, ${r.country}` : "");
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
  const fetchWeather = async (lat, lon) => {
    try {
      const r = await axios.get(
        `${import.meta.env.VITE_API_BASE}/api/weather?lat=${lat}&lon=${lon}`
      );
      return r.data;
    } catch (err) {
      console.warn(
        "fetchWeather failed (frontend):",
        err.response?.data || err.message
      );
      return null;
    }
  };

  // handleGenerate
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
        w && w.current_weather ? `Now: ${w.current_weather.temperature}°C` : "N/A";

      const resp = await axios.post(`${import.meta.env.VITE_API_BASE}/api/generate`, {
        text: transcript,
        lat: location.lat,
        lon: location.lon,
        locationName: location.name || "",
        weatherSummary,
        language,
      });

      setSuggestions(resp.data?.result || "No suggestion");
      if (resp.data?.error) {
        console.warn("Generation warning (backend returned error):", resp.data.error);
        alert("AI generation used fallback due to provider error. See console for details.");
      }
    } catch (err) {
      console.error("generate err (frontend):", err.response?.data || err.message);
      const serverDetail =
        err.response?.data?.error || err.response?.data?.detail || err.message;
      alert("Generation failed: " + (serverDetail || "See console for details"));
    } finally {
      setLoading(false);
    }
  };

  // hide dropdown when clicking outside wrapperRef
  useEffect(() => {
    const handler = (ev) => {
      if (!wrapperRef.current?.contains(ev.target)) setShowDropdown(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  // handlers from MicCapture - interim results will come via onTranscript
  const handleTranscriptUpdate = (t) => {
    if (isEditing && lockMicUpdates) return;
    setTranscript(t || "");
  };
  const handleFinal = (finalText) => {
    if (isEditing && lockMicUpdates) return;
    setTranscript(finalText || "");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agri-Assistant</h1>
                <p className="text-sm text-gray-500 mt-1">Get crop & weather advice from speech or typed input</p>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border px-3 py-2 rounded-md text-sm"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>

            <div className="space-y-3">
              <MicCapture
                onTranscript={handleTranscriptUpdate}
                onFinal={handleFinal}
                language={language}
              />

              <div>
                <div className="text-sm text-gray-500 mb-2">Transcript</div>
                <textarea
                  className="w-full p-3 rounded-lg bg-gray-50 border text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
                  style={{ minHeight: 96, resize: "vertical" }}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                  placeholder={
                    language === "ja"
                      ? "ここにテキストが表示されます..."
                      : language === "hi"
                      ? "यहाँ ट्रांसक्रिप्ट दिखेगा..."
                      : "Transcript will appear here..."
                  }
                />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div>You can edit the text above after the mic stops.</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lockMicUpdates}
                      onChange={(e) => setLockMicUpdates(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>Lock mic updates</span>
                  </label>
                </div>
              </div>

              {/* Location input - stacked vertically: Use Current on top, search row below */}
              <div className="mt-3">
                <div className="flex flex-col gap-2 mb-2">
                  {/* Use current location button (two-line) */}
                  <button
                    onClick={useMyLocation}
                    aria-label="Use current Location"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm min-w-[120px] flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-sm font-medium leading-tight">Use current</span>
                    <span className="text-sm font-medium leading-tight">Location</span>
                  </button>

                  {/* Input + small search button; dropdown positioned relative to this container */}
                  <div className="relative w-full" ref={wrapperRef}>
                    <div className="flex w-full">
                      <input
                        className="flex-1 min-w-0 px-3 py-2 border rounded-l-md focus:outline-none"
                        placeholder={
                          language === "ja"
                            ? "都市名で検索 (例: 札幌)"
                            : language === "hi"
                            ? "शहर का नाम"
                            : "Search city e.g. Mumbai"
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length) setShowDropdown(true); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            performSearch(searchQuery);
                          }
                        }}
                        aria-label="Location search"
                      />
                      <button
                        onClick={() => performSearch(searchQuery)}
                        className="px-2 py-2 border rounded-r-md bg-gray-100 hover:bg-gray-200 flex-shrink-0 w-12"
                        disabled={searchLoading}
                        aria-label="Search location"
                        title="Search"
                      >
                        {searchLoading ? "..." : "Go"}
                      </button>
                    </div>

                    {showDropdown && searchResults.length > 0 && (
                      <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-56 overflow-auto divide-y">
                        {searchResults.map((r, idx) => (
                          <li
                            key={idx}
                            onClick={() => pickResult(r)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="font-medium text-gray-800">
                              {r.name}
                              {r.admin1 ? ", " + r.admin1 : ""}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {r.country} — lat: {Number(r.latitude).toFixed(2)}, lon: {Number(r.longitude).toFixed(2)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-500">Selected</div>
                <div className="mt-2 p-3 rounded-md bg-gray-50 text-sm border">
                  {location ? (
                    <div>
                      <div className="font-medium text-gray-800">{location.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        lat: {Number(location.lat).toFixed(3)}, lon: {Number(location.lon).toFixed(3)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">No location chosen</span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleGenerate}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold shadow-sm ${loading ? "bg-emerald-300" : "bg-emerald-500 hover:bg-emerald-600"}`}
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
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 bg-white rounded-lg border"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <WeatherCard weather={weather} location={location} />
        </div>

        {/* Right column: suggestions */}
        <div className="lg:col-span-2">
          <SuggestionCard suggestions={suggestions} />
        </div>
      </div>
    </div>
  );
}
