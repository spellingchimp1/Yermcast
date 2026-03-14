import { useState, useEffect } from 'react';
import { useWeather } from './hooks/useWeather';
import { getTimeOfDayGradient } from './utils/weatherUtils';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import WeeklyForecast from './components/WeeklyForecast';
import RadarMap from './components/RadarMap';
import ForecastDiscussion from './components/ForecastDiscussion';
import './App.css';

export default function App() {
  const [query, setQuery] = useState(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) { setQuery('28801'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setQuery({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setQuery('28801'),
      { timeout: 8000 }
    );
  }, []);

  const { weather, loading, error, locationName } = useWeather(query);

  function startEditing() {
    setInputVal('');
    setEditing(true);
  }

  function commitEdit() {
    const val = inputVal.trim();
    if (val) setQuery(val);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div className="app" style={{ background: getTimeOfDayGradient() }}>
      <h1 className="app-title">YermCast</h1>
      <div className="card">
        {loading && (
          <div className="loading">
            <div className="loading-icon">☁️</div>
            <p>Loading weather…</p>
          </div>
        )}

        {error && (
          <div className="error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => setQuery(query)}>Try again</button>
          </div>
        )}

        {weather && !loading && (
          <>
            <CurrentWeather
              current={weather.current}
              todayLow={weather.todayLow}
              todayHigh={weather.todayHigh}
              locationName={locationName}
              hourly={weather.hourly}
              alert={weather.alert}
              editing={editing}
              inputVal={inputVal}
              onLocationClick={startEditing}
              onInputChange={(e) => setInputVal(e.target.value)}
              onInputBlur={commitEdit}
              onInputKeyDown={handleKeyDown}
            />
            <HourlyForecast hourly={weather.hourly} />
            <WeeklyForecast weekly={weather.weekly} />
            <RadarMap coords={weather.coords} />
            <ForecastDiscussion office={weather.office} isNWS={weather.isNWS} />
          </>
        )}

        {/* Show location editor even while loading if user triggered it */}
        {loading && editing && (
          <div className="location-edit-overlay">
            <input
              className="location-input"
              autoFocus
              placeholder="City or zip code…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}
      </div>

      <footer className="footer">
        Data from{' '}
        {weather?.isNWS === false
          ? <strong>Open-Meteo</strong>
          : <strong>National Weather Service</strong>
        }
      </footer>
    </div>
  );
}
