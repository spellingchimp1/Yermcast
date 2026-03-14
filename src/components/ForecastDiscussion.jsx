import { useState, useEffect, useRef } from 'react';

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const NWS_HEADERS = { 'User-Agent': 'WeatherApp (contact@example.com)' };

const SYSTEM_PROMPT = `Write a short, punchy 3-4 day weather forecast. Short sentences. Real conditions, real temps. Occasionally throw in something unexpected, absurd, or deadpan — but keep it brief. Don't explain the joke. Don't over-write.

Here's the vibe to match (don't copy these, just get the energy right):
"Today's warmer than yesterday, so slap on some sunscreen — cancer waits for no one. Tomorrow gets wetter than a motivational speaker's handshake, highs around 64. Thursday clears out but drops to the mid-30s, so dig out something with sleeves."

Format: Each day on its own line. Day name, 1-2 SHORT sentences max, star rating at the end.
Star ratings: ⭐⭐⭐⭐⭐ perfect, ⭐⭐⭐⭐ pretty good, ⭐⭐⭐ fine, ⭐⭐ bad, ⭐ rough, ☆☆☆☆☆ stay home.

No preamble. No summary. No long explanations. Just start with the first day.`;

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
      model: 'llama-3.1-8b-instant',
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
