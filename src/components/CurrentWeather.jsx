import { useState } from 'react';
import { getWeatherEmoji, formatHour, getYermCastImage } from '../utils/weatherUtils';

const ALERT_COLORS = {
  Extreme: { bg: 'rgba(180,20,20,0.85)', border: 'rgba(255,80,80,0.6)' },
  Severe:  { bg: 'rgba(180,70,10,0.85)', border: 'rgba(255,140,60,0.6)' },
  Moderate:{ bg: 'rgba(160,120,0,0.80)', border: 'rgba(255,200,50,0.6)' },
  Minor:   { bg: 'rgba(30,80,30,0.80)',  border: 'rgba(80,200,80,0.5)' },
};

export default function CurrentWeather({
  current, todayLow, todayHigh, locationName, hourly, alert,
  editing, inputVal, onLocationClick, onInputChange, onInputBlur, onInputKeyDown,
}) {
  const [hourIdx, setHourIdx] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);

  const displayed = hourly?.[hourIdx] ?? current;
  const temp = displayed.temperature;
  const feels = displayed.windChill?.value
    ? Math.round((displayed.windChill.value * 9) / 5 + 32)
    : displayed.heatIndex?.value
    ? Math.round((displayed.heatIndex.value * 9) / 5 + 32)
    : null;
  const humidity = displayed.relativeHumidity?.value;
  const emoji = getWeatherEmoji(displayed.shortForecast);
  const yermImg = getYermCastImage(displayed.shortForecast, temp, displayed.isDaytime !== false);
  const isNow = hourIdx === 0;

  const timeLabel = isNow
    ? 'Now'
    : formatHour(displayed.startTime);

  return (
    <div className="current-section">
      {editing ? (
        <input
          className="location-input"
          autoFocus
          placeholder="City or zip code…"
          value={inputVal}
          onChange={onInputChange}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
        />
      ) : (
        <button className="location-name" onClick={onLocationClick} title="Tap to change location">
          {locationName}
          <span className="location-edit-hint">›</span>
        </button>
      )}

      {alert && (() => {
        const c = ALERT_COLORS[alert.severity] ?? ALERT_COLORS.Minor;
        return (
          <div className="alert-wrap">
            <button
              className="alert-banner"
              style={{ background: c.bg, border: `1px solid ${c.border}` }}
              onClick={() => setAlertOpen((o) => !o)}
            >
              <span className="alert-icon">⚠️</span>
              <span className="alert-event">{alert.event}</span>
              <span className="alert-chevron" style={{ transform: alertOpen ? 'rotate(90deg)' : 'none' }}>›</span>
            </button>
            {alertOpen && (
              <div className="alert-detail" style={{ borderColor: c.border }}>
                <p className="alert-headline">{alert.headline}</p>
                {alert.description && (
                  <p className="alert-description">{alert.description}</p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <img src={yermImg} alt={displayed.shortForecast} className="current-yerm-img" />
      <div className="current-temp">{temp}°</div>
      <div className="condition-text">{displayed.shortForecast}</div>

      {isNow
        ? <div className="temp-range">H:{todayHigh}°  L:{todayLow}°</div>
        : <div className="temp-range time-label">{timeLabel}</div>
      }

      {hourly && hourly.length > 1 && (
        <div className="time-slider-wrap">
          <input
            type="range"
            min={0}
            max={hourly.length - 1}
            value={hourIdx}
            onChange={(e) => setHourIdx(Number(e.target.value))}
            className="time-slider"
          />
          <div className="time-slider-labels">
            <span>Now</span>
            <span>{formatHour(hourly[Math.floor(hourly.length / 2)].startTime)}</span>
            <span>{formatHour(hourly[hourly.length - 1].startTime)}</span>
          </div>
        </div>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Feels Like</div>
          <div className="stat-value">{feels ?? temp}°</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Humidity</div>
          <div className="stat-value">{humidity ?? '--'}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Wind</div>
          <div className="stat-value">{displayed.windSpeed}</div>
          <div className="stat-sub">{displayed.windDirection}</div>
        </div>

      </div>
    </div>
  );
}
