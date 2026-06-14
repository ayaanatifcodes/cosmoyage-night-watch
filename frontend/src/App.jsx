import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const MOON_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
}

function getRating(score) {
  if (score >= 8) return { label: 'Excellent', color: '#a8c4a2' }
  if (score >= 6) return { label: 'Good', color: '#8bb8d4' }
  if (score >= 4) return { label: 'Fair', color: '#c9b87a' }
  return { label: 'Poor', color: '#c47a7a' }
}

function ScoreRing({ score }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  const rating = getRating(score)
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="score-svg">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={rating.color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        className="score-arc"
      />
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" fill="#e8e8e8" fontSize="20" fontWeight="700" fontFamily="'DM Mono', monospace">{score}</text>
      <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="'DM Mono', monospace">/10</text>
    </svg>
  )
}

function StarField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }))
    let raf
    let t = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        const a = 0.15 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,210,220,${a})`
        ctx.fill()
      })
      t++
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={canvasRef} className="starfield" />
}

function FlyToLocation({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lon], 7, { duration: 2.4 })
  }, [coords, map])
  return null
}

export default function App() {
  const [scoreData, setScoreData] = useState(null)
  const [moonData, setMoonData] = useState(null)
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showLP, setShowLP] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)

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
          setTimeout(() => setPanelVisible(true), 600)
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

  const rating = scoreData ? getRating(scoreData.score) : null

  return (
    <div className="app">
      <StarField />

      {coords && (
        <MapContainer
          center={[coords.lat, coords.lon]}
          zoom={4}
          className="map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {showLP && (
            <TileLayer
              url="https://djlorenz.github.io/astronomy/lp2022/overlay/tiles/{z}/{x}/{y}.png"
              maxNativeZoom={10}
              opacity={0.8}
              attribution='Light pollution data: <a href="https://djlorenz.github.io/astronomy/lp2022/" target="_blank">World Atlas 2022</a>'
            />
          )}
          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={9}
            pathOptions={{ color: '#a8c4a2', fillColor: '#a8c4a2', fillOpacity: 1, weight: 0 }}
          />
          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={20}
            pathOptions={{ color: '#a8c4a2', fill: false, weight: 1, opacity: 0.3 }}
          />
          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={36}
            pathOptions={{ color: '#a8c4a2', fill: false, weight: 0.5, opacity: 0.12 }}
          />
          <FlyToLocation coords={coords} />
        </MapContainer>
      )}

      <div className="topbar">
        <div className="brand">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px', opacity: 0.7 }}>
            <path d="M7 0L8.5 5.5H14L9.5 8.5L11 14L7 11L3 14L4.5 8.5L0 5.5H5.5L7 0Z" fill="#a8c4a2"/>
          </svg>
          <span className="brand-name">NightWatch</span>
          <span className="brand-sep">by</span>
          <span className="brand-cosmo">Cosmoyage</span>
        </div>
        <div className="topbar-right">
          <button
            className={`lp-toggle ${showLP ? 'active' : ''}`}
            onClick={() => setShowLP(p => !p)}
          >
            <span className="lp-dot" />
            Light Pollution
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
          <div className="loader-ring" />
          <p className="loader-text">Scanning the sky…</p>
        </div>
      )}

      {error && (
        <div className="overlay-center">
          <div className="error-box">{error}</div>
        </div>
      )}

      {!loading && !error && scoreData && moonData && (
        <div className={`panel ${panelVisible ? 'panel-in' : ''}`}>

          <div className="panel-section score-section">
            <div className="section-label">Stargazing Score</div>
            <div className="score-row">
              <ScoreRing score={scoreData.score} />
              <div className="score-info">
                <div className="score-rating" style={{ color: rating.color }}>{rating.label}</div>
                <div className="score-desc">conditions tonight</div>
                <div className="score-bar-wrap">
                  <div className="score-bar-fill" style={{ width: `${scoreData.score * 10}%`, background: rating.color }} />
                </div>
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
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${moonData.phase_cycle * 100}%` }} />
            </div>
            <div className="progress-labels"><span>New</span><span>Full</span></div>
          </div>

          <div className="divider" />

          <div className="panel-section">
            <div className="section-label">Conditions</div>
            <div className="metrics">
              {[
                { val: `${scoreData.conditions.temperature}°C`, key: 'Temp' },
                { val: `${scoreData.conditions.cloud_cover}%`, key: 'Clouds' },
                { val: `${scoreData.conditions.humidity}%`, key: 'Humidity' },
                { val: `${scoreData.conditions.wind_speed}`, key: 'Wind m/s' },
              ].map((m, i) => (
                <div className="metric" key={i} style={{ animationDelay: `${0.1 * i + 0.8}s` }}>
                  <div className="metric-val">{m.val}</div>
                  <div className="metric-key">{m.key}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-footer">
            Powered by OpenWeatherMap · Cosmoyage NightWatch
          </div>
        </div>
      )}
    </div>
  )
}