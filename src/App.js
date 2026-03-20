import { useState, useRef, useEffect, useCallback } from "react"

const API_KEY = process.env.REACT_APP_API_KEY1

const S = {
  app: {
    minHeight: "100vh", background: "#0d1117",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "24px 16px", fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: "relative", overflow: "hidden",
  },
  gridOverlay: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0,
  },
  container: { width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 },
  title: { fontSize: "42px", fontWeight: "900", color: "#fff", letterSpacing: "-1px", margin: 0, lineHeight: 1, textAlign: "center" },
  titleAccent: { color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.5)" },
  subtitle: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", marginTop: "8px", textAlign: "center" },
  searchWrapper: { position: "relative", marginBottom: "12px" },
  searchRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1, padding: "14px 18px", borderRadius: "14px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,212,255,0.2)",
    color: "#fff", fontSize: "15px", fontWeight: "500", outline: "none",
    width: "100%",
  },
  btn: {
    padding: "14px 22px", borderRadius: "14px",
    background: "linear-gradient(135deg, #00d4ff, #0099cc)",
    color: "#fff", fontWeight: "800", fontSize: "14px", border: "none", cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,212,255,0.3)", whiteSpace: "nowrap",
  },
  dropdown: {
    position: "absolute", top: "calc(100% + 6px)", left: 0,
    right: "80px", 
    background: "#131a24",
    border: "1px solid rgba(0,212,255,0.2)",
    borderRadius: "14px", overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  suggestionItem: {
    padding: "12px 16px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "10px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.15s",
  },
  unitBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px", padding: "6px 14px", color: "rgba(255,255,255,0.7)",
    fontSize: "13px", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center",
  },
  card: {
    background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(0,212,255,0.15)", borderRadius: "24px", padding: "28px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
    position: "relative", overflow: "hidden",
  },
  errorBox: {
    background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.25)",
    borderRadius: "16px", padding: "16px 18px", marginBottom: "16px",
    display: "flex", gap: "12px", alignItems: "flex-start", color: "#fff",
  },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" },
  statBox: {
    background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.1)",
    borderRadius: "16px", padding: "14px 10px", textAlign: "center",
  },
  historyPill: {
    background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: "20px", padding: "6px 14px", color: "rgba(255,255,255,0.6)",
    fontSize: "13px", cursor: "pointer",
  },
}

const emojis = { Clear:"☀️", Clouds:"☁️", Rain:"🌧️", Drizzle:"🌦️", Thunderstorm:"⛈️", Snow:"❄️", Mist:"🌫️", Haze:"🌫️" }
const glowColors = { Clear:"#ff8c00", Clouds:"#5577aa", Rain:"#0066cc", Thunderstorm:"#7700cc", Snow:"#aaccff", default:"#00d4ff" }


function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function App() {
  const [city, setCity] = useState("")
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [unit, setUnit] = useState("metric")
  const [history, setHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debouncedCity = useDebounce(city, 300)


  useEffect(() => {
    if (debouncedCity.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    setSuggestLoading(true)
    fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(debouncedCity.trim())}&limit=5&appid=${API_KEY}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
 
          const seen = new Set()
          const unique = data.filter(item => {
            const key = `${item.name}-${item.country}-${item.state || ""}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          setSuggestions(unique)
          setShowDropdown(true)
        } else {
          setSuggestions([])
          setShowDropdown(false)
        }
      })
      .catch(() => { setSuggestions([]); setShowDropdown(false) })
      .finally(() => setSuggestLoading(false))
  }, [debouncedCity])


  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowDropdown(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchWeather = useCallback(async (searchCity = city) => {
    const q = searchCity.trim()
    if (!q) return
    setShowDropdown(false)
    setActiveIndex(-1)
    setLoading(true); setError("")
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=${unit}`)
      if (!res.ok) { const d = await res.json(); throw new Error(res.status === 404 ? `"${q}" not found` : d.message) }
      const d = await res.json()
      setWeather({ name: d.name, country: d.sys.country, temp: Math.round(d.main.temp), feelsLike: Math.round(d.main.feels_like), humidity: d.main.humidity, wind: Math.round(d.wind.speed), condition: d.weather[0].main, description: d.weather[0].description, icon: d.weather[0].icon })
      setHistory(p => [q, ...p.filter(c => c.toLowerCase() !== q.toLowerCase())].slice(0, 5))
    } catch (e) { setError(e.message); setWeather(null) }
    setLoading(false)
  }, [city, unit])

  const selectSuggestion = (suggestion) => {
    const label = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`
    setCity(suggestion.name)
    setShowDropdown(false)
    setActiveIndex(-1)
    fetchWeather(suggestion.name)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") fetchWeather()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex])
      else fetchWeather()
    } else if (e.key === "Escape") {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  const toggleUnit = async () => {
    const nu = unit === "metric" ? "imperial" : "metric"; setUnit(nu)
    if (weather) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(weather.name)}&appid=${API_KEY}&units=${nu}`)
        if (res.ok) { const d = await res.json(); setWeather(p => ({ ...p, temp: Math.round(d.main.temp), feelsLike: Math.round(d.main.feels_like), wind: Math.round(d.wind.speed) })) }
      } catch (_) {}
    }
  }

  const glowColor = glowColors[weather?.condition] || glowColors.default

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d1117; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { border-color: rgba(0,212,255,0.5) !important; background: rgba(255,255,255,0.09) !important; }
        .sbtn:hover { transform: scale(1.04); opacity: 0.9; }
        .sbtn:active { transform: scale(0.97); }
        .hpill:hover { background: rgba(0,212,255,0.18) !important; color: #fff !important; }
        .suggestion-item:hover, .suggestion-item.active { background: rgba(0,212,255,0.1) !important; }
        .suggestion-item:last-child { border-bottom: none !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        .card-anim { animation: fadeUp 0.35s ease; }
        .dropdown-anim { animation: fadeIn 0.15s ease; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div style={S.app}>
        <div style={S.gridOverlay} />
        <div style={{ position:"fixed", top:"-120px", left:"-120px", width:"400px", height:"400px", borderRadius:"50%", background:`radial-gradient(circle, ${glowColor}22, transparent 65%)`, pointerEvents:"none", zIndex:0, transition:"background 1s" }} />
        <div style={{ position:"fixed", bottom:"-120px", right:"-120px", width:"400px", height:"400px", borderRadius:"50%", background:`radial-gradient(circle, ${glowColor}14, transparent 65%)`, pointerEvents:"none", zIndex:0, transition:"background 1s" }} />

        <div style={S.container}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:"32px" }}>
            <h1 style={S.title}>Weather<span style={S.titleAccent}>Snap</span></h1>
            <p style={S.subtitle}>Real-time weather · Worldwide</p>
          </div>

          {/* Search with autocomplete */}
          <div style={S.searchWrapper}>
            <div style={S.searchRow}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  ref={inputRef}
                  value={city}
                  onChange={e => { setCity(e.target.value); setActiveIndex(-1) }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  placeholder="Enter city name..."
                  style={S.input}
                  autoComplete="off"
                />
                {/* Suggestions dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="dropdown-anim" style={S.dropdown}>
                    {suggestLoading ? (
                      <div style={{ padding:"14px 16px", color:"rgba(255,255,255,0.3)", fontSize:"13px" }}>Searching...</div>
                    ) : suggestions.map((s, i) => (
                      <div
                        key={`${s.name}-${s.country}-${i}`}
                        className={`suggestion-item${activeIndex === i ? " active" : ""}`}
                        style={{ ...S.suggestionItem, background: activeIndex === i ? "rgba(0,212,255,0.1)" : "transparent" }}
                        onMouseDown={() => selectSuggestion(s)}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <span style={{ fontSize:"16px" }}>📍</span>
                        <div>
                          <div style={{ color:"#fff", fontSize:"14px", fontWeight:"600" }}>{s.name}</div>
                          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px", marginTop:"1px" }}>
                            {[s.state, s.country].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="sbtn" onClick={() => fetchWeather()} disabled={loading} style={S.btn}>
                {loading ? "⏳" : "Search"}
              </button>
            </div>
          </div>

          {/* Unit toggle */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"20px" }}>
            <button onClick={toggleUnit} style={S.unitBtn}>
              <span style={{ color: unit==="metric" ? "#00d4ff" : "rgba(255,255,255,0.3)", fontWeight: unit==="metric" ? "700":"400" }}>°C</span>
              <span style={{ color:"rgba(255,255,255,0.15)" }}>|</span>
              <span style={{ color: unit==="imperial" ? "#00d4ff" : "rgba(255,255,255,0.3)", fontWeight: unit==="imperial" ? "700":"400" }}>°F</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={S.errorBox}>
              <span style={{ fontSize:"20px" }}>⚠️</span>
              <div>
                <div style={{ fontWeight:"700", fontSize:"14px", marginBottom:"2px" }}>Error</div>
                <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px" }}>{error}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && !weather && (
            <div style={{ ...S.card, padding:"40px", textAlign:"center" }}>
              <div style={{ width:"36px", height:"36px", border:"3px solid rgba(0,212,255,0.2)", borderTopColor:"#00d4ff", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"14px" }}>Fetching weather...</p>
            </div>
          )}

          {/* Weather Card */}
          {weather && !loading && (
            <div className="card-anim" style={S.card}>
              <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"200px", height:"200px", borderRadius:"50%", background:`radial-gradient(circle, ${glowColor}20, transparent 65%)`, pointerEvents:"none", transition:"background 1s" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
                <div>
                  <h2 style={{ fontSize:"24px", fontWeight:"800", color:"#fff" }}>{weather.name}, {weather.country}</h2>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px", marginTop:"4px" }}>
                    {new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                  </p>
                </div>
                <span style={{ fontSize:"36px" }}>{emojis[weather.condition] || "🌡️"}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
                <div>
                  <div style={{ fontSize:"72px", fontWeight:"900", color:"#fff", lineHeight:1, letterSpacing:"-3px", textShadow:`0 0 30px ${glowColor}55` }}>
                    {weather.temp}<span style={{ fontSize:"28px", color:"rgba(255,255,255,0.4)", fontWeight:"400", letterSpacing:0 }}>°{unit==="metric"?"C":"F"}</span>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"14px", marginTop:"4px", textTransform:"capitalize" }}>{weather.description}</p>
                </div>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} alt="" style={{ width:"110px", height:"110px", filter:`drop-shadow(0 0 15px ${glowColor}66)` }} />
              </div>
              <div style={{ height:"1px", background:"rgba(0,212,255,0.08)", margin:"0 0 20px" }} />
              <div style={S.statsGrid}>
                {[["🌡️",`${weather.feelsLike}°`,"Feels Like"],["💧",`${weather.humidity}%`,"Humidity"],["💨",`${weather.wind} ${unit==="metric"?"m/s":"mph"}`,"Wind"]].map(([icon,val,label]) => (
                  <div key={label} style={S.statBox}>
                    <div style={{ fontSize:"20px", marginBottom:"6px" }}>{icon}</div>
                    <div style={{ color:"#fff", fontWeight:"700", fontSize:"14px" }}>{val}</div>
                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"10px", marginTop:"3px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop:"16px" }}>
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"10px", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"8px" }}>Recent</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {history.map(h => (
                  <button key={h} className="hpill" onClick={() => { setCity(h); fetchWeather(h) }} style={S.historyPill}>{h}</button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}