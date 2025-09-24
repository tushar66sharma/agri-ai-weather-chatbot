import React from "react";

function parseSuggestions(text) {
  if (!text) return [];
  const normalized = text.replace(/\r/g, "").split("\n").map(s => s.trim()).filter(Boolean);
  const items = [];
  normalized.forEach(line => {
    if (/^[-•\u2022]?\s*\d+\.|^[-•\u2022]/.test(line)) {
      const cleaned = line.replace(/^[-•\u2022]?\s*\d*\.*\s*/, "");
      items.push(cleaned);
    } else {
      if (items.length === 0) items.push(line);
      else {
        const last = items.pop();
        items.push((last + " " + line).trim());
      }
    }
  });
  return items;
}

export default function SuggestionCard({ suggestions }) {
  const items = parseSuggestions(suggestions || "");

  return (
    <div className="card p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">AI Suggestions</h2>
          <p className="text-sm text-gray-500">Practical agricultural tips for your crop & weather</p>
        </div>
        <div className="text-sm text-gray-400">{items.length ? `${items.length} suggestions` : ""}</div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 bg-white rounded-lg border text-center text-gray-500">No suggestions yet. Speak and choose a location to get tailored tips.</div>
      ) : (
        <ol className="space-y-4">
          {items.map((it, i) => (
            <li key={i} className="p-4 bg-white rounded-2xl shadow-sm border">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold mb-1 text-gray-800">{it.split(":")[0].slice(0, 120)}</div>
                  <div className="text-sm text-gray-600">{it}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
