export function getWeatherEmoji(shortForecast = '', isDaytime = true) {
  const f = shortForecast.toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return '⛈️';
  if (f.includes('snow') || f.includes('blizzard')) return '❄️';
  if (f.includes('sleet') || f.includes('freezing')) return '🌨️';
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return '🌧️';
  if (f.includes('fog') || f.includes('mist') || f.includes('haze')) return '🌫️';
  if (f.includes('wind') || f.includes('breezy') || f.includes('blustery')) return '💨';
  if (f.includes('mostly cloudy') || f.includes('considerable cloud') || f.includes('overcast')) return '☁️';
  if (f.includes('partly cloudy') || f.includes('mostly sunny') || f.includes('partly sunny')) {
    return isDaytime ? '⛅' : '🌙';
  }
  if (f.includes('cloud')) return isDaytime ? '🌤️' : '☁️';
  if (f.includes('clear') || f.includes('sunny')) return isDaytime ? '☀️' : '🌙';
  return isDaytime ? '🌤️' : '🌙';
}

export function getBgGradient(shortForecast = '', isDaytime = true) {
  const f = shortForecast.toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return ['#4a4a8a', '#2a2a5a'];
  if (f.includes('snow') || f.includes('blizzard')) return ['#b0c8e8', '#d8eaf8'];
  if (f.includes('rain') || f.includes('shower')) return ['#5a7aaa', '#3a5a8a'];
  if (f.includes('fog') || f.includes('mist')) return ['#8a9aaa', '#aabbcc'];
  if (f.includes('overcast') || f.includes('mostly cloudy')) return ['#7a8aaa', '#9aaabb'];
  if (f.includes('partly cloudy') || f.includes('mostly sunny')) return isDaytime
    ? ['#5aace8', '#ffa040'] : ['#1a2a6a', '#3a4a9a'];
  if (!isDaytime) return ['#1a2a6a', '#0a0a3a'];
  return ['#42aaff', '#ffd060'];
}

export function formatHour(isoString) {
  const d = new Date(isoString);
  const h = d.getHours();
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

export function getWindDescription(wind = '') {
  return wind;
}

export function getYermCastImage(shortForecast = '', temp = 70, isDaytime = true) {
  const f = shortForecast.toLowerCase();
  const pick = (day, night) => `/yermcast/${isDaytime ? day : night}.png`;
  if (f.includes('thunder') || f.includes('storm')) return pick('thunder', 'night-thunder');
  if (f.includes('snow') || f.includes('blizzard') || f.includes('sleet')) return pick('snow', 'night-snow');
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return pick('rain', 'night-rain');
  if (f.includes('fog') || f.includes('mist') || f.includes('haze')) return pick('fog', 'night-fog');
  if (f.includes('wind') || f.includes('breezy') || f.includes('blustery')) return pick('windy', 'night-windy');
  if (f.includes('cloud') || f.includes('overcast')) return pick('cloudy', 'night-cloudy');
  if (temp >= 90) return pick('hot', 'night-hot');
  if (temp <= 32) return pick('cold', 'night-cold');
  return pick('sunny', 'night-clear');
}

export function getTimeOfDayGradient() {
  const h = new Date().getHours();
  // Sunrise: 5–8am
  if (h >= 5 && h < 8) return 'linear-gradient(180deg, #5c2d6e 0%, #a04060 30%, #d4624a 60%, #e88c55 100%)';
  // Daytime: 8am–5pm
  if (h >= 8 && h < 17) return 'linear-gradient(180deg, #1b4f8a 0%, #163d72 35%, #0f2a52 70%, #0a1e3d 100%)';
  // Sunset: 5–8pm
  if (h >= 17 && h < 20) return 'linear-gradient(180deg, #4a2060 0%, #8a3850 30%, #c45040 60%, #e0703a 100%)';
  // Dusk: 8–10pm
  if (h >= 20 && h < 22) return 'linear-gradient(180deg, #2e2850 0%, #221e40 35%, #181530 70%, #100e24 100%)';
  // Night: 10pm–5am
  return 'linear-gradient(180deg, #1a1040 0%, #120c30 35%, #0c0820 70%, #080515 100%)';
}

export function tempColor(temp) {
  if (temp >= 90) return '#ff4422';
  if (temp >= 80) return '#ff8800';
  if (temp >= 70) return '#ffaa00';
  if (temp >= 60) return '#ffcc44';
  if (temp >= 50) return '#88cc44';
  if (temp >= 40) return '#44aacc';
  if (temp >= 32) return '#44aaee';
  return '#88bbff';
}
