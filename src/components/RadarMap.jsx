import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ASHEVILLE = [35.5951, -82.5515];

export default function RadarMap({ coords }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const radarLayers = useRef([]);
  const animFrameRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);
  const framesRef = useRef([]);
  const playingRef = useRef(true);
  const frameIdxRef = useRef(0);

  const center = coords ? [coords.lat, coords.lon] : ASHEVILLE;

  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark basemap from CartoDB
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

    // City labels on top
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19, zIndex: 10 }
    ).addTo(map);

    mapInstance.current = map;

    loadRadar(map);

    return () => {
      clearTimeout(animFrameRef.current);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Re-center if coords change
  useEffect(() => {
    if (mapInstance.current && coords) {
      mapInstance.current.setView([coords.lat, coords.lon], 7, { animate: true });
    }
  }, [coords]);

  async function loadRadar(map) {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      const past = data.radar.past ?? [];
      const nowcast = data.radar.nowcast ?? [];
      const allFrames = [...past, ...nowcast].slice(-10); // last ~50min + short nowcast

      framesRef.current = allFrames;

      // Pre-create all tile layers (hidden)
      const layers = allFrames.map((frame) =>
        L.tileLayer(
          `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/4/1_1.png`,
          { opacity: 0, tileSize: 512, zoomOffset: -1, maxZoom: 18, zIndex: 5 }
        ).addTo(map)
      );

      radarLayers.current = layers;

      // Show first frame
      showFrame(0, layers);
      animate(0, layers);
    } catch (e) {
      console.error('Radar fetch failed', e);
    }
  }

  function showFrame(idx, layers) {
    layers.forEach((l, i) => l.setOpacity(i === idx ? 0.65 : 0));
    frameIdxRef.current = idx;
    setFrameIdx(idx);
  }

  function animate(idx, layers) {
    if (!layers.length) return;
    showFrame(idx, layers);
    animFrameRef.current = setTimeout(() => {
      if (playingRef.current) {
        animate((idx + 1) % layers.length, layers);
      }
    }, 500);
  }

  function togglePlay() {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    if (next) {
      animate(frameIdxRef.current, radarLayers.current);
    } else {
      clearTimeout(animFrameRef.current);
    }
  }

  const total = framesRef.current.length;
  const frameTime = framesRef.current[frameIdx]
    ? new Date(framesRef.current[frameIdx].time * 1000).toLocaleTimeString([], {
        hour: 'numeric', minute: '2-digit',
      })
    : '';

  return (
    <div className="section">
      <h2 className="section-title">Radar</h2>
      <div className="radar-container">
        <div ref={mapRef} className="radar-map" />
        <div className="radar-controls">
          <button className="radar-play-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '⏸' : '▶'}
          </button>
          <span className="radar-time">{frameTime}</span>
        </div>
      </div>
    </div>
  );
}
