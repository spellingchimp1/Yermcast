import { useState } from 'react';
import { getWeatherEmoji, tempColor } from '../utils/weatherUtils';

export default function WeeklyForecast({ weekly }) {
  const [expanded, setExpanded] = useState(null);

  const days = [];
  for (let i = 0; i < weekly.length; i += 2) {
    const day = weekly[i];
    const night = weekly[i + 1];
    if (day) days.push({ day, night });
  }

  const allHighs = days.map((d) => d.day.temperature);
  const allLows = days.map((d) => d.night?.temperature ?? d.day.temperature - 15);
  const absMax = Math.max(...allHighs);
  const absMin = Math.min(...allLows);
  const absRange = absMax - absMin || 1;

  return (
    <div className="section">
      <h2 className="section-title">10-Day Forecast</h2>

      <div className="weekly-list">
        {days.slice(0, 7).map(({ day, night }, i) => {
          const high = day.temperature;
          const low = night?.temperature ?? high - 15;
          const barStart = ((low - absMin) / absRange) * 100;
          const barWidth = ((high - low) / absRange) * 100;
          const isOpen = expanded === i;

          const dayName = i === 0
            ? 'Today'
            : new Date(day.startTime).toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div key={i}>
              <button
                className={`week-row ${isOpen ? 'open' : ''}`}
                onClick={() => setExpanded(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="week-dayname">{dayName}</span>
                <span className="week-icon">{getWeatherEmoji(day.shortForecast)}</span>
                <div className="week-range">
                  <span className="week-low">{low}°</span>
                  <div className="week-bar-track">
                    <div
                      className="week-bar-fill"
                      style={{
                        left: `${barStart}%`,
                        width: `${Math.max(barWidth, 6)}%`,
                        background: `linear-gradient(to right, ${tempColor(low)}, ${tempColor(high)})`,
                      }}
                    />
                  </div>
                  <span className="week-high">{high}°</span>
                </div>
                <span className="week-chevron">{isOpen ? '▾' : '›'}</span>
              </button>

              {isOpen && (
                <div className="week-detail">
                  <p>{day.detailedForecast}</p>
                  {night && (
                    <p className="week-night-detail">
                      <strong>Tonight:</strong> {night.detailedForecast}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
