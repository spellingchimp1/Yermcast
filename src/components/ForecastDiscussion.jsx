import { useState, useEffect, useRef } from 'react';

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const NWS_HEADERS = { 'User-Agent': 'WeatherApp (contact@example.com)' };

const SYSTEM_PROMPT = `You are a witty, slightly sarcastic person summarizing the weather like you're texting a friend who asked "so what's the weather doing?" — smart, dry humor, but genuinely helpful. Given a technical NWS forecast discussion, write a short summary organized by day — 3 to 4 days max, ~120 words total.

Format: Each day on its own line, like "Today:", "Tomorrow:", "Wednesday:" — followed by 1-2 casual sentences with a dry, clever edge.

Rules:
- Witty and sarcastic but the info must be accurate and useful
- Conversational — like a smart friend, not a weatherman
- Plain English only, no jargon
- Keep it short and skimmable
- No intro phrases, no "Here's..." — just dive into the days
- Never announce that you're being sarcastic. Just be it.`;

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

async function summarize(rawText) {
  const trimmed = rawText.slice(0, 4000);

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
        { role: 'user', content: trimmed },
      ],
      max_tokens: 500,
      temperature: 0.4,
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

export default function ForecastDiscussion({ office }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevOffice = useRef(null);

  useEffect(() => {
    if (!office || office === prevOffice.current) return;
    prevOffice.current = office;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary('');

    async function load() {
      try {
        const raw = await fetchDiscussion(office);
        const text = await summarize(raw);
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
  }, [office]);

  return (
    <div className="section">
      <h2 className="section-title">YermCast Outlook</h2>
      <div className="discussion-card">
        {loading && (
          <div className="discussion-loading">
            <span className="discussion-spinner" />
            Analyzing forecast…
          </div>
        )}
        {error && <p className="discussion-error">Unavailable: {error}</p>}
        {summary && !loading && <p className="discussion-text">{summary}</p>}
      </div>
    </div>
  );
}
