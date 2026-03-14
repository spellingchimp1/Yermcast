import { getWeatherEmoji } from '../utils/weatherUtils';

export default function WeatherIcon({ forecast, size = 48, animate = false }) {
  const emoji = getWeatherEmoji(forecast);
  return (
    <span
      style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }}
      className={animate ? 'weather-icon-animate' : ''}
    >
      {emoji}
    </span>
  );
}
