import React from 'react';

export default function WeatherCard({ weather, location }) {
  if (!weather) {
    return <div className="bg-white rounded-xl shadow p-4 text-sm text-gray-600">No weather data yet. Choose a location or use current location.</div>;
  }
  const cur = weather.current_weather || {};
  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
      <div>
        <div className="text-xs text-gray-400">Location</div>
        <div className="text-lg font-semibold text-gray-800">{location?.name || 'Unknown'}</div>
        <div className="text-xs text-gray-400 mt-1">lat: {Number(weather.latitude).toFixed(2)}, lon: {Number(weather.longitude).toFixed(2)}</div>
      </div>

      <div className="text-right">
        <div className="text-4xl font-bold text-gray-900">{cur.temperature ?? 'N/A'}°C</div>
        <div className="text-sm text-gray-500 mt-1">wind: {cur.windspeed ?? '-'} m/s</div>
      </div>
    </div>
  );
}
