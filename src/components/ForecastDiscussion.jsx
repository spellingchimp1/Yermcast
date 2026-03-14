import { useState, useEffect, useRef } from 'react';

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const NWS_HEADERS = { 'User-Agent': 'WeatherApp (contact@example.com)' };

const SYSTEM_PROMPT = `Write a 3-4 day weather forecast using the actual data provided. Here are examples of the exact style — match this, don't copy it:

"Monday: Warmer today, highs near 74 and not a cloud to argue with. ⭐⭐⭐⭐⭐"
"Tuesday: Rain moves in by afternoon, highs around 61 — the kind of day that makes you question your life choices. ⭐⭐"
"Wednesday: Mostly cloudy, highs in the low 50s, wind picking up to 20 mph. Wear something you don't mind losing. ⭐⭐"
"Thursday: Snow possible, highs near 34. Dig out the wool pantalones. ⭐"
"Friday: Sunny and 68, no complaints. Well, maybe one — it's still February. ⭐⭐⭐⭐"

Notice: most days are just straight forecast. The aside only shows up when something actually earns it. Never forced.

Star rating goes at the very end of each line.
Star ratings: ⭐⭐⭐⭐⭐ perfect, ⭐⭐⭐⭐ pretty good, ⭐⭐⭐ fine, ⭐⭐ bad, ⭐ rough, ☆☆☆☆☆ stay home.

No intro. No outro. Just the days.`;

async function fetchDiscussion(office) {
  const listRes = await fetch(
    `https://api.weather.gov/products/types/AFD/locations/${office}`,
    { headers: NWS_HEADERS }
  );
  if (!listRes.ok) throw new Error('Could not fetch forecast discussion list');
  const listData = await listRes.json();

  const latest = listData['@graph']?.[0];
  if (!latest) throw new Error('No forecast discussion found');

  const prodRes = await fetch(latest['@id'], { headers: NWS_HEADERS });
  if (!prodRes.ok) throw new Error('Could not fetch forecast discussion text');
  const prodData = await prodRes.json();

  return prodData.productText ?? '';
}

async function summarize(rawText, locationName, weekly) {
  const trimmed = rawText.slice(0, 4000);
  const locationHint = locationName ? `This forecast is for ${locationName}.\n\n` : '';

  let forecastData = '';
  if (weekly && weekly.length) {
    // Get daytime periods only (isDaytime true, or every other starting at 0 for Open-Meteo)
    const dayPeriods = weekly.filter(d => d.isDaytime !== false);
    // Pair with night periods for lows
    const nightPeriods = weekly.filter(d => d.isDaytime === false);
    const days = dayPeriods.slice(0, 4).map((d, i) => {
      const night = nightPeriods[i];
      const parts = [];
      if (d.name) parts.push(d.name);
      parts.push(`High ${d.temperature}°F`);
      if (night) parts.push(`Low ${night.temperature}°F`);
      if (d.shortForecast) parts.push(d.shortForecast);
      const precip = d.probabilityOfPrecipitation?.value;
      if (precip != null) parts.push(`${precip}% precip`);
      if (d.windSpeed) parts.push(`Wind ${d.windSpeed}`);
      return parts.join(', ');
    });
    forecastData = `FORECAST DATA (use this as your primary source):\n${days.join('\n')}\n\nStar guide: 70s sunny no rain = 5 stars, 80s = 4, humid/partly cloudy = 3, rain likely = 2, storms or snow = 1, dangerous = 0.\n\nAdditional meteorologist context below — use for background only:\n`;
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: locationHint + forecastData + trimmed },
      ],
      max_tokens: 500,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'No summary returned.';
}

export default function ForecastDiscussion({ office, isNWS, locationName, weekly }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevOffice = useRef(null);

  useEffect(() => {
    if (!isNWS || !office || office === prevOffice.current) return;
    prevOffice.current = office;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary('');

    async function load() {
      try {
        const raw = await fetchDiscussion(office);
        const text = await summarize(raw, locationName, weekly);
        if (!cancelled) {
          setSummary(text);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [office, isNWS]);

  if (!isNWS || !office) return null;

  return (
    <div className="section">
      <h2 className="section-title">YermCast Outlook</h2>
      <div className="star-key">
        <span>⭐⭐⭐⭐⭐ Perfect</span>
        <span>⭐⭐⭐ Decent</span>
        <span>⭐ Rough</span>
        <span>0 stars = Stay inside</span>
      </div>
      <div className="discussion-card">
        {loading && (
          <div className="discussion-loading">
            <span className="discussion-spinner" />
            Analyzing forecast…
          </div>
        )}
        {error && <p className="discussion-error">Unavailable: {error}</p>}
        {summary && !loading && (
          <div className="discussion-text">
            {summary.split('\n').filter(l => l.trim()).map((line, i) => (
              <p key={i} className="discussion-line">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
