import { useState, useEffect } from 'react';

const HEADERS = { 'User-Agent': 'WeatherApp (contact@example.com)' };

// WMO weather code → human-readable forecast text
function wmoToForecast(code, isDay = true) {
  if (code === 0) return isDay ? 'Sunny' : 'Clear';
  if (code <= 2) return isDay ? 'Mostly Clear' : 'Mostly Clear';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function windDirLabel(degrees) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

async function geocode(query) {
  const headers = { 'Accept-Language': 'en' };
  const base = 'https://nominatim.openstreetmap.org';

  // US zip codes: search as postal code in US first to avoid wrong-country matches
  if (/^\d{5}(-\d{4})?$/.test(query.trim())) {
    const res = await fetch(`${base}/search?postalcode=${encodeURIComponent(query.trim())}&countrycodes=us&format=json&limit=1`, { headers });
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
  }

  // General search for city names and international locations
  const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find "${query}". Try a city name or zip code.`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}

function formatDisplayName(raw) {
  const parts = raw.split(',').map((s) => s.trim());
  const city = parts[0];
  const stateMap = {
    'North Carolina': 'NC', 'Tennessee': 'TN', 'South Carolina': 'SC', 'Georgia': 'GA',
    'Virginia': 'VA', 'Kentucky': 'KY', 'Alabama': 'AL', 'Florida': 'FL', 'Texas': 'TX',
    'California': 'CA', 'New York': 'NY', 'Colorado': 'CO', 'Ohio': 'OH', 'Illinois': 'IL',
    'Pennsylvania': 'PA', 'Michigan': 'MI', 'Washington': 'WA', 'Oregon': 'OR',
    'Arizona': 'AZ', 'Nevada': 'NV', 'Utah': 'UT', 'Montana': 'MT', 'Wyoming': 'WY',
    'Idaho': 'ID', 'Minnesota': 'MN', 'Wisconsin': 'WI', 'Iowa': 'IA', 'Missouri': 'MO',
    'Indiana': 'IN', 'Louisiana': 'LA', 'Mississippi': 'MS', 'Arkansas': 'AR',
    'Oklahoma': 'OK', 'Kansas': 'KS', 'Nebraska': 'NE', 'South Dakota': 'SD',
    'North Dakota': 'ND', 'New Mexico': 'NM', 'Maine': 'ME', 'Vermont': 'VT',
    'New Hampshire': 'NH', 'Massachusetts': 'MA', 'Rhode Island': 'RI',
    'Connecticut': 'CT', 'New Jersey': 'NJ', 'Delaware': 'DE', 'Maryland': 'MD',
    'West Virginia': 'WV', 'Alaska': 'AK', 'Hawaii': 'HI',
  };
  const stateEntry = parts.find((p) => stateMap[p]);
  if (stateEntry) return `${city}, ${stateMap[stateEntry]}`;
  // Non-US: city + last part (country)
  const country = parts[parts.length - 1];
  return country && country !== city ? `${city}, ${country}` : city;
}

async function fetchOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day` +
    `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,apparent_temperature,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&wind_speed_unit=mph&temperature_unit=fahrenheit&timezone=auto&forecast_days=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not fetch weather data.');
  return res.json();
}

function normalizeOpenMeteo(data) {
  const c = data.current;
  const h = data.hourly;
  const d = data.daily;

  // Find current hour index in hourly array
  const nowMs = new Date(c.time).getTime();
  let startIdx = h.time.findIndex((t) => new Date(t).getTime() >= nowMs);
  if (startIdx < 0) startIdx = 0;

  const makeHourlyPeriod = (idx) => ({
    startTime: h.time[idx],
    temperature: Math.round(h.temperature_2m[idx]),
    shortForecast: wmoToForecast(h.weather_code[idx], h.is_day[idx] === 1),
    isDaytime: h.is_day[idx] === 1,
    relativeHumidity: { value: h.relative_humidity_2m[idx] },
    windSpeed: `${Math.round(h.wind_speed_10m[idx])} mph`,
    windDirection: windDirLabel(h.wind_direction_10m[idx]),
    windChill: { value: null },
    heatIndex: { value: null },
  });

  const current = {
    startTime: c.time,
    temperature: Math.round(c.temperature_2m),
    shortForecast: wmoToForecast(c.weather_code, c.is_day === 1),
    isDaytime: c.is_day === 1,
    relativeHumidity: { value: c.relative_humidity_2m },
    windSpeed: `${Math.round(c.wind_speed_10m)} mph`,
    windDirection: windDirLabel(c.wind_direction_10m),
    windChill: { value: null },
    heatIndex: { value: null },
  };

  const hourly = Array.from({ length: 12 }, (_, i) => makeHourlyPeriod(startIdx + i));

  // Build weekly as day+night pairs
  const weekly = [];
  for (let i = 0; i < d.time.length; i++) {
    const date = new Date(d.time[i] + 'T12:00:00');
    const dayName = i === 0
      ? 'Today'
      : date.toLocaleDateString('en-US', { weekday: 'long' });
    const high = Math.round(d.temperature_2m_max[i]);
    const low = Math.round(d.temperature_2m_min[i]);
    const dayForecast = wmoToForecast(d.weather_code[i], true);
    const nightForecast = wmoToForecast(d.weather_code[i], false);

    weekly.push({
      name: dayName,
      temperature: high,
      temperatureUnit: 'F',
      shortForecast: dayForecast,
      isDaytime: true,
      startTime: d.time[i] + 'T06:00:00',
      detailedForecast: `High near ${high}°. ${dayForecast}.`,
    });
    weekly.push({
      name: i === 0 ? 'Tonight' : `${dayName} Night`,
      temperature: low,
      temperatureUnit: 'F',
      shortForecast: nightForecast,
      isDaytime: false,
      startTime: d.time[i] + 'T18:00:00',
      detailedForecast: `Low around ${low}°. ${nightForecast}.`,
    });
  }

  return {
    current,
    todayLow: Math.round(d.temperature_2m_min[0]),
    todayHigh: Math.round(d.temperature_2m_max[0]),
    hourly,
    weekly,
    office: null,
    alert: null,
  };
}

export function useWeather(query = '28801') {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWeather(null);

    async function fetchWeather() {
      try {
        let lat, lon, displayName;

        if (query && typeof query === 'object') {
          lat = query.lat;
          lon = query.lon;
          displayName = null;
        } else {
          const geo = await geocode(query);
          lat = geo.lat;
          lon = geo.lon;
          displayName = geo.display;
        }

        // Try NWS first
        const pointRes = await fetch(
          `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
          { headers: HEADERS }
        );

        if (pointRes.ok) {
          // --- NWS path ---
          const pointData = await pointRes.json();
          const { city, state } = pointData.properties.relativeLocation.properties;
          const office = pointData.properties.cwa;

          const [forecastRes, hourlyRes, alertsRes] = await Promise.all([
            fetch(pointData.properties.forecast, { headers: HEADERS }),
            fetch(pointData.properties.forecastHourly, { headers: HEADERS }),
            fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, { headers: HEADERS }),
          ]);

          const forecastData = await forecastRes.json();
          const hourlyData = await hourlyRes.json();
          const alertsData = alertsRes.ok ? await alertsRes.json() : null;
          const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
          const activeAlerts = alertsData?.features ?? [];
          activeAlerts.sort((a, b) =>
            (severityOrder[a.properties.severity] ?? 4) - (severityOrder[b.properties.severity] ?? 4)
          );
          const topAlert = activeAlerts[0]?.properties ?? null;

          const current = hourlyData.properties.periods[0];
          const todayPeriods = hourlyData.properties.periods.slice(0, 24);
          const temps = todayPeriods.map((p) => p.temperature);

          if (cancelled) return;
          setLocationName(`${city}, ${state}`);
          setWeather({
            current,
            todayLow: Math.min(...temps),
            todayHigh: Math.max(...temps),
            hourly: hourlyData.properties.periods.slice(0, 12),
            weekly: forecastData.properties.periods,
            coords: { lat, lon },
            office,
            alert: topAlert ? {
              event: topAlert.event,
              severity: topAlert.severity,
              headline: topAlert.headline,
              description: topAlert.description,
            } : null,
            isNWS: true,
          });
        } else {
          // --- Open-Meteo fallback (non-US) ---
          const omData = await fetchOpenMeteo(lat, lon);
          const normalized = normalizeOpenMeteo(omData);

          // Get location name
          let name = 'Unknown Location';
          if (displayName) {
            name = formatDisplayName(displayName);
          } else {
            try {
              const revRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
              );
              const revData = await revRes.json();
              name = formatDisplayName(revData.display_name ?? '');
            } catch { /* ignore */ }
          }

          if (cancelled) return;
          setLocationName(name);
          setWeather({ ...normalized, coords: { lat, lon }, isNWS: false });
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, [query]);

  return { weather, loading, error, locationName };
}
