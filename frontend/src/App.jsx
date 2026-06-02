import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// [lat, lon, scale 0.3–1.0] — scale drives glow radius and brightness
const CITY_LIGHTS = [
  // East Asia
  [35.6762, 139.6503, 1.0],  [31.2304, 121.4737, 0.95], [39.9042, 116.4074, 0.95],
  [37.5665, 126.9780, 0.85], [34.6937, 135.5023, 0.85], [22.3193, 114.1694, 0.8],
  [25.0330, 121.5654, 0.75], [22.5431, 114.0579, 0.75], [23.1291, 113.2644, 0.8],
  [30.5728, 104.0668, 0.75], [32.0603, 118.7969, 0.7],  [43.8256, 125.3235, 0.6],
  [30.2741, 120.1551, 0.7],  [41.8057, 123.4315, 0.65], [43.0642, 141.3469, 0.7],
  [33.5902, 130.4017, 0.75], [35.0116, 135.7681, 0.7],  [35.1815, 136.9066, 0.7],
  // South & SE Asia
  [28.6139, 77.2090, 1.0],   [19.0760, 72.8777, 0.95],  [24.8607, 67.0011, 0.85],
  [12.9716, 77.5946, 0.8],   [22.5726, 88.3639, 0.85],  [23.8103, 90.4125, 0.85],
  [17.3850, 78.4867, 0.75],  [13.0827, 80.2707, 0.75],  [31.5204, 74.3587, 0.75],
  [33.6844, 73.0479, 0.65],  [6.9271, 79.8612, 0.6],    [27.7172, 85.3240, 0.55],
  [-6.2088, 106.8456, 0.9],  [14.5995, 120.9842, 0.85], [13.7563, 100.5018, 0.8],
  [10.8231, 106.6297, 0.75], [21.0278, 105.8342, 0.7],  [3.1390, 101.6869, 0.7],
  [1.3521, 103.8198, 0.75],  [16.8661, 96.1951, 0.65],
  // Middle East
  [30.0444, 31.2357, 0.9],   [33.3152, 44.3661, 0.7],   [35.6892, 51.3890, 0.8],
  [24.7136, 46.6753, 0.75],  [25.2048, 55.2708, 0.8],   [41.0082, 28.9784, 0.85],
  [31.7683, 35.2137, 0.6],   [33.8869, 35.5131, 0.65],  [30.0626, 31.2497, 0.65],
  [23.5880, 58.3829, 0.6],   [26.2235, 50.5876, 0.65],  [29.3759, 47.9774, 0.65],
  // Europe
  [51.5074, -0.1278, 0.9],   [48.8566, 2.3522, 0.9],    [52.5200, 13.4050, 0.85],
  [40.4168, -3.7038, 0.8],   [41.9028, 12.4964, 0.8],   [55.7558, 37.6173, 0.9],
  [52.2297, 21.0122, 0.75],  [50.0755, 14.4378, 0.7],   [47.4979, 19.0402, 0.7],
  [48.2082, 16.3738, 0.75],  [45.4654, 9.1859, 0.8],    [53.3498, -6.2603, 0.7],
  [55.6761, 12.5683, 0.7],   [59.3293, 18.0686, 0.7],   [60.1699, 24.9384, 0.65],
  [59.9139, 10.7522, 0.65],  [50.8503, 4.3517, 0.75],   [52.3676, 4.9041, 0.75],
  [37.9838, 23.7275, 0.7],   [44.8176, 20.4569, 0.65],  [42.6977, 23.3219, 0.65],
  [44.4268, 26.1025, 0.65],  [50.4501, 30.5234, 0.75],  [59.9386, 30.3141, 0.8],
  [53.9045, 27.5615, 0.65],  [56.8389, 60.6057, 0.65],  [55.0415, 82.9346, 0.6],
  // North America
  [40.7128, -74.0060, 1.0],  [34.0522, -118.2437, 0.95],[41.8781, -87.6298, 0.9],
  [29.7604, -95.3698, 0.85], [33.4484, -112.0740, 0.8], [39.9526, -75.1652, 0.85],
  [32.7767, -96.7970, 0.8],  [37.7749, -122.4194, 0.8], [42.3601, -71.0589, 0.8],
  [47.6062, -122.3321, 0.75],[39.7392, -104.9903, 0.75],[36.1699, -115.1398, 0.7],
  [35.2271, -80.8431, 0.7],  [43.6532, -79.3832, 0.85], [45.5017, -73.5673, 0.8],
  [49.2827, -123.1207, 0.7], [19.4326, -99.1332, 0.95], [20.6597, -103.3496, 0.8],
  [25.6866, -100.3161, 0.75],[30.2672, -97.7431, 0.75], [33.7490, -84.3880, 0.8],
  [25.7617, -80.1918, 0.75],
  // South America
  [-23.5505, -46.6333, 1.0], [-22.9068, -43.1729, 0.95],[-34.6037, -58.3816, 0.9],
  [-33.4489, -70.6693, 0.85],[-12.0464, -77.0428, 0.8], [4.7110, -74.0721, 0.8],
  [10.4806, -66.9036, 0.75], [-19.9167, -43.9345, 0.75],[-15.7942, -47.8825, 0.7],
  [-30.0277, -51.2287, 0.7], [-8.0476, -34.8770, 0.65], [-3.7172, -38.5431, 0.65],
  // Africa
  [6.5244, 3.3792, 0.85],    [-4.3250, 15.3222, 0.8],   [-26.2041, 28.0473, 0.8],
  [-33.9249, 18.4241, 0.7],  [5.3600, -4.0083, 0.7],    [5.5600, -0.2057, 0.65],
  [9.0578, 7.4951, 0.7],     [11.8635, 8.5175, 0.65],   [-1.2921, 36.8219, 0.7],
  [9.0054, 38.7636, 0.65],   [15.5517, 32.5324, 0.65],  [36.7372, 3.0865, 0.75],
  [36.8065, 10.1815, 0.65],  [32.8872, 13.1913, 0.65],  [-29.8587, 31.0218, 0.7],
  [-6.8160, 39.2803, 0.6],   [0.3476, 32.5825, 0.6],    [-15.4167, 28.2833, 0.6],
  [-17.8292, 31.0522, 0.6],
  // Oceania
  [-33.8688, 151.2093, 0.85],[-37.8136, 144.9631, 0.8], [-27.4698, 153.0251, 0.7],
  [-31.9505, 115.8605, 0.65],[-34.9285, 138.6007, 0.6], [-36.8485, 174.7633, 0.7],
  // Central Asia
  [43.2567, 76.9286, 0.65],  [41.2995, 69.2401, 0.65],  [51.1801, 71.4460, 0.6],
  [37.9601, 58.3261, 0.55],  [38.5598, 68.7870, 0.55],
]

function LightPollutionLayer() {
  const map = useMap()

  useEffect(() => {
    const canvas = document.createElement('canvas')
    Object.assign(canvas.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '1000',
      mixBlendMode: 'screen',
    })
    map.getContainer().appendChild(canvas)

    let raf = null

    function draw() {
      raf = null
      const el = map.getContainer()
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, w, h)

      const zoom = map.getZoom()
      const bounds = map.getBounds().pad(0.25)

      for (const [lat, lon, scale] of CITY_LIGHTS) {
        if (!bounds.contains([lat, lon])) continue

        const { x, y } = map.latLngToContainerPoint([lat, lon])
        const mpp = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom)
        const radiusKm = 18 + scale * 110
        const r = (radiusKm * 1000) / mpp

        if (r < 3) continue

        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0,    `rgba(255,220,80,${+(0.95 * scale).toFixed(2)})`)
        g.addColorStop(0.18, `rgba(255,170,20,${+(0.80 * scale).toFixed(2)})`)
        g.addColorStop(0.42, `rgba(255,110, 5,${+(0.50 * scale).toFixed(2)})`)
        g.addColorStop(0.72, `rgba(255, 60, 0,${+(0.22 * scale).toFixed(2)})`)
        g.addColorStop(1,    'rgba(255,20,0,0)')

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }
    }

    function schedule() { if (!raf) raf = requestAnimationFrame(draw) }

    map.on('move', schedule)
    map.on('zoom', schedule)
    map.on('resize', schedule)
    schedule()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      map.off('move', schedule)
      map.off('zoom', schedule)
      map.off('resize', schedule)
      canvas.remove()
    }
  }, [map])

  return null
}

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
          {showLP && <LightPollutionLayer />}
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