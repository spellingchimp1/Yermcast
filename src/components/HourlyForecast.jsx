import { formatHour, tempColor, getWeatherEmoji } from '../utils/weatherUtils';

export default function HourlyForecast({ hourly }) {
  const temps = hourly.map((h) => h.temperature);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = maxT - minT || 1;
  const BAR_MAX = 100;
  const BAR_MIN = 28;

  return (
    <div className="section">
      <h2 className="section-title">Hourly Forecast</h2>

      <div className="hourly-scroll">
        <div className="hourly-bars">
          {hourly.map((period, i) => {
            const height = BAR_MIN + ((period.temperature - minT) / range) * (BAR_MAX - BAR_MIN);
            const color = tempColor(period.temperature);
            const isNight = period.isDaytime === false;
            return (
              <div className="hour-col" key={i}>
                <div className="hour-temp">{period.temperature}°</div>
                <div className="bar-wrap">
                  <div
                    className="bar"
                    style={{ height: `${height}px`, background: color, opacity: isNight ? 0.55 : 0.9 }}
                  />
                </div>
                <div className="hour-label">{formatHour(period.startTime)}</div>
                <div className="hour-icon">{getWeatherEmoji(period.shortForecast, period.isDaytime !== false)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
