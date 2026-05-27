import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const MOON_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
}

function getRating(score) {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Fair'
  return 'Poor'
}

function ScoreRing({ score }) {
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke="#f97316" strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="50" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">{score}</text>
      <text x="55" y="67" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">/10</text>
    </svg>
  )
}

export default function App() {
  const [scoreData, setScoreData] = useState(null)
  const [moonData, setMoonData] = useState(null)
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLP, setShowLP] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        setCoords({ lat, lon })
        try {
          const [sRes, mRes] = await Promise.all([
            fetch(`/api/score?lat=${lat}&lon=${lon}`),
            fetch(`/api/moonphase?lat=${lat}&lon=${lon}`)
          ])
          const [s, m] = await Promise.all([sRes.json(), mRes.json()])
          setScoreData(s)
          setMoonData(m)
        } catch {
          setError('API unreachable. Is Docker running?')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location access denied.')
        setLoading(false)
      }
    )
  }, [])

  return (
    <div className="app">
      {coords && (
        <MapContainer
          center={[coords.lat, coords.lon]}
          zoom={8}
          className="map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {showLP && (
            <TileLayer
              url="/gibs/wmts/epsg3857/best/VIIRS_Black_Marble_Nighttime_At_Sensor_Radiance/default/2023-01-01/250m/{z}/{y}/{x}.jpg"
              maxNativeZoom={8}
              opacity={0.85}
            />
          )}

          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={10}
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9, weight: 2 }}
          />
          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={22}
            pathOptions={{ color: '#f97316', fill: false, weight: 1, opacity: 0.35 }}
          />
        </MapContainer>
      )}

      <div className="topbar">
        <div className="brand">
          <span className="brand-name">✦ NightWatch</span>
          <span className="brand-sub">by Cosmoyage</span>
        </div>
        <div className="topbar-right">
          <button
            className={`lp-toggle ${showLP ? 'active' : ''}`}
            onClick={() => setShowLP(p => !p)}
          >
            💡 Light Pollution
          </button>
          {coords && (
            <div className="coords">
              <span className="live-dot" />
              {coords.lat.toFixed(4)}°N &nbsp; {coords.lon.toFixed(4)}°E
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="overlay-center">
          <div className="spinner" />
          <p>Detecting location…</p>
        </div>
      )}

      {error && (
        <div className="overlay-center">
          <div className="error-box">{error}</div>
        </div>
      )}

      {!loading && !error && scoreData && moonData && (
        <div className="panel">
          <div className="panel-section">
            <div className="section-label">Stargazing Score</div>
            <div className="score-row">
              <ScoreRing score={scoreData.score} />
              <div>
                <div className="score-rating">{getRating(scoreData.score)}</div>
                <div className="score-desc">conditions tonight</div>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="panel-section">
            <div className="section-label">Moon Phase</div>
            <div className="moon-row">
              <span className="moon-icon">{MOON_ICONS[moonData.phase_name] || '🌙'}</span>
              <div>
                <div className="moon-phase">{moonData.phase_name}</div>
                <div className="moon-illum">{moonData.illumination_percent}% illuminated</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${moonData.phase_cycle * 100}%` }} />
            </div>
            <div className="progress-labels"><span>New</span><span>Full</span></div>
          </div>

          <div className="divider" />

          <div className="panel-section">
            <div className="section-label">Conditions</div>
            <div className="metrics">
              <div className="metric">
                <div className="metric-val">{scoreData.conditions.temperature}°C</div>
                <div className="metric-key">Temp</div>
              </div>
              <div className="metric">
                <div className="metric-val">{scoreData.conditions.cloud_cover}%</div>
                <div className="metric-key">Clouds</div>
              </div>
              <div className="metric">
                <div className="metric-val">{scoreData.conditions.humidity}%</div>
                <div className="metric-key">Humidity</div>
              </div>
              <div className="metric">
                <div className="metric-val">{scoreData.conditions.wind_speed}</div>
                <div className="metric-key">Wind m/s</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}