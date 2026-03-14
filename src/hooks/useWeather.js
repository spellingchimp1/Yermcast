import { useState, useEffect } from 'react';

const HEADERS = { 'User-Agent': 'WeatherApp (contact@example.com)' };

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=us&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find "${query}". Try a city name or zip code.`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}

function formatDisplayName(raw) {
  // "Asheville, Buncombe County, North Carolina, 28801, United States" → "Asheville, NC"
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
  const abbr = stateEntry ? stateMap[stateEntry] : null;
  return abbr ? `${city}, ${abbr}` : city;
}

export function useWeather(query = '28801') {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWeather(null);

    async function fetchWeather() {
      try {
        // query can be a string (zip/city) or an object {lat, lon}
        const { lat, lon } = (query && typeof query === 'object')
          ? query
          : await geocode(query);

        const pointRes = await fetch(
          `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
          { headers: HEADERS }
        );
        if (!pointRes.ok) throw new Error('NWS does not cover this location (US only).');
        const pointData = await pointRes.json();

        const { city, state } = pointData.properties.relativeLocation.properties;
        const name = `${city}, ${state}`;
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
        setLocationName(name);
        setWeather({
          current,
          todayLow: Math.min(...temps),
          todayHigh: Math.max(...temps),
          hourly: hourlyData.properties.periods.slice(0, 12),
          weekly: forecastData.properties.periods,
          coords: { lat, lon },
          office,
          alert: topAlert ? { event: topAlert.event, severity: topAlert.severity, headline: topAlert.headline, description: topAlert.description } : null,
        });
        setLoading(false);
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
