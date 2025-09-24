import React from 'react';

export default function WeatherCard({ weather, location }) {
  if (!weather) {
    return <div className="card p-4 text-sm muted">No weather data yet. Choose a location or use current location.</div>;
  }
  const cur = weather.current_weather || {};
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <div className="text-sm muted">Location</div>
        <div className="text-lg font-semibold">{location?.name || 'Unknown'}</div>
        <div className="text-sm muted mt-1">lat: {Number(weather.latitude).toFixed(2)}, lon: {Number(weather.longitude).toFixed(2)}</div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold">{cur.temperature ?? 'N/A'}°C</div>
        <div className="text-sm muted mt-1">wind: {cur.windspeed ?? '-'} m/s</div>
      </div>
    </div>
  );
}
