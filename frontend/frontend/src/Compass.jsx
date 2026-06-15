import { useEffect, useRef, useState } from "react";
import "./Compass.css";

function degToCardinal(deg) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

function normalizeAngle(a) {
  let ang = a % 360;
  if (ang < 0) ang += 360;
  return ang;
}

// Runway data for common airports (heading in degrees)
const runwayData = {
  VOMM: [{ name: "01L/19R", heading: 10 }, { name: "01R/19L", heading: 10 }], // Chennai
  VOCB: [{ name: "05/23", heading: 50 }, { name: "08/26", heading: 80 }], // Coimbatore
  VOCE: [{ name: "05/23", heading: 50 }, { name: "08/26", heading: 80 }], // Coimbatore (station VOCE in airports)
  VOMD: [{ name: "09/27", heading: 90 }], // Madurai
  VOSM: [{ name: "06/24", heading: 60 }], // Salem
  VOTK: [{ name: "10/28", heading: 100 }], // Tuticorin
  VOTR: [{ name: "09/27", heading: 90 }], // Trichy
  VOBL: [{ name: "09/27", heading: 90 }], // Bangalore
};

function calculateCrosswindHeadwind(windDirection, windSpeed, runwayHeading) {
  const headingDiff = windDirection - runwayHeading;
  const angleRad = (headingDiff * Math.PI) / 180;
  const headwind = -windSpeed * Math.cos(angleRad);
  const crosswind = windSpeed * Math.sin(angleRad);
  return { headwind: Math.round(headwind * 100) / 100, crosswind: Math.round(crosswind * 100) / 100 };
}

export default function Compass({ direction = 0, speed = 0, gust = null, trend = null, diameter = 220, airport = null, open: externalOpen, setOpen: externalSetOpen }) {
  const [angle, setAngle] = useState(normalizeAngle(direction || 0));
  const [live, setLive] = useState(true);
  const [localOpen, setLocalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : localOpen;
  const setOpen = externalSetOpen !== undefined ? externalSetOpen : setLocalOpen;
  const [jiggling, setJiggling] = useState(false);
  const [history, setHistory] = useState([{ time: new Date(), speed: speed || 0, direction: direction || 0 }]);
  const elRef = useRef(null);
  const draggingRef = useRef(false);
  const jiggleTimerRef = useRef(null);

  useEffect(() => {
    if (live) setAngle(normalizeAngle(direction || 0));
    // Update history every time wind data changes
    setHistory(prev => {
      const updated = [...prev, { time: new Date(), speed: speed || 0, direction: direction || 0 }];
      // Keep only last 20 data points
      return updated.slice(-20);
    });
  }, [direction, live, speed]);

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return;
      const ev = e.touches ? e.touches[0] : e;
      const rect = elRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const rad = Math.atan2(dy, dx);
      // convert to degrees where 0 = North
      const deg = normalizeAngle((rad * 180) / Math.PI + 90);
      setAngle(Math.round(deg));
      setLive(false);
    }

    function onUp() {
      draggingRef.current = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  function startDrag(e) {
    e.preventDefault();
    draggingRef.current = true;
  }

  function handleTouchStart(e) {
    startDrag(e);
    setJiggling(true);
    if (jiggleTimerRef.current) clearTimeout(jiggleTimerRef.current);
    jiggleTimerRef.current = setTimeout(() => {
      setJiggling(false);
      jiggleTimerRef.current = null;
    }, 360);
  }

  useEffect(() => {
    return () => {
      if (jiggleTimerRef.current) clearTimeout(jiggleTimerRef.current);
    };
  }, []);

  function handleDoubleClick() {
    // Re-lock to live observation
    setLive(true);
    setAngle(normalizeAngle(direction || 0));
  }

  // ticks for the dial
  const ticks = Array.from({ length: 32 }).map((_, i) => ({
    deg: i * 11.25,
    major: i % 4 === 0,
  }));

  // vector length for visualization (px)
  const vectorLen = Math.min(120, (speed || 0) * 2.5);

  return (
    <div className="compass-wrap" style={{ width: diameter }}>
      <div
        className={`compass compass--size-${diameter}`}
        ref={elRef}
        onMouseDown={startDrag}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        role="button"
        tabIndex={0}
        aria-label={`Wind direction ${angle} degrees`}
        style={{ width: diameter }}
      >
        <div className="compass-face" style={{ width: diameter, height: diameter }}>
          {ticks.map((t) => (
            <div
              key={t.deg}
              className={`compass-tick ${t.major ? 'compass-tick--major' : ''}`}
              style={{ transform: `rotate(${t.deg}deg) translate(${diameter / 2 - 10}px)` }}
            />
          ))}

          <div className="compass-label north">N</div>
          <div className="compass-label east">E</div>
          <div className="compass-label south">S</div>
          <div className="compass-label west">W</div>

          <div className="compass-arrow-wrap" style={{ transform: `rotate(${angle}deg)` }}>
            <div className={`compass-arrow ${jiggling ? 'compass-arrow--jiggle' : ''}`} />
          </div>

          <div className="compass-center" />
        </div>

        <div className="compass-meta">
          <div className="compass-cardinal">{degToCardinal(angle)}</div>
          <div className="compass-deg">{angle}°</div>
          <div className="compass-speed">{speed ?? "--"} kt</div>
        </div>
      </div>

      {open && (
        <div className="compass-panel" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          <aside className="compass-panel-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <header className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="modal-title">Wind Details</h3>
                {airport && (
                  <span className="modal-airport-badge">
                    {airport === 'VOCE' ? 'VOCB' : airport}
                  </span>
                )}
              </div>
              <button className="modal-close-btn" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
                ✕
              </button>
            </header>

            {/* Dials / Visualizers Section */}
            <section className="modal-visualizers">
              {/* Direction Card */}
              <div className="modal-glass-card visualizer-card">
                <span className="card-label">Wind Heading</span>
                <div className="visualizer-content">
                  <svg viewBox="-80 -80 160 160" width="100" height="100" style={{ overflow: 'visible' }}>
                    <circle cx="0" cy="0" r="70" fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="58" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="0" y="-46" fontSize="10" fill="#ef4444" fontWeight="900" textAnchor="middle">N</text>
                    <text x="0" y="52" fontSize="9" fill="var(--text-muted)" fontWeight="700" textAnchor="middle">S</text>
                    <text x="50" y="3" fontSize="9" fill="var(--text-muted)" fontWeight="700" textAnchor="middle" dominantBaseline="middle">E</text>
                    <text x="-54" y="3" fontSize="9" fill="var(--text-muted)" fontWeight="700" textAnchor="middle" dominantBaseline="middle">W</text>
                    <g transform={`rotate(${angle})`}>
                      <line x1="0" y1="0" x2="0" y2={-48} stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" filter="drop-shadow(0 0 3px var(--accent))" />
                      <polygon points="0,-52 -3.5,-45 3.5,-45" fill="var(--accent)" />
                      <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="var(--accent)" strokeWidth="1.5" />
                    </g>
                  </svg>
                </div>
                <span className="card-value">{angle}° {degToCardinal(angle)}</span>
                <span className="card-subtext">Interactive Dial (Drag/Double-click)</span>
              </div>

              {/* Speed Card */}
              <div className="modal-glass-card visualizer-card">
                <span className="card-label">Wind Speed</span>
                <div className="visualizer-content" style={{ marginTop: 6, marginBottom: 6 }}>
                  <svg viewBox="0 0 120 80" width="110" height="75" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="60%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    {/* Gauge background arc */}
                    <path d="M 15 70 A 45 45 0 0 1 105 70" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" strokeLinecap="round" />
                    {/* Colored gauge arc - proportional to speed */}
                    <path
                      d="M 15 70 A 45 45 0 0 1 105 70"
                      stroke="url(#speedGradient)"
                      strokeWidth="7"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min((speed || 0) / 40 * 141, 141)} 141`}
                    />
                    {/* Needle */}
                    <g transform={`rotate(${Math.min((speed || 0) / 40 * 180, 180) - 90} 60 70)`}>
                      <line x1="60" y1="70" x2="60" y2="30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="60" cy="70" r="4" fill="#fff" />
                    </g>
                  </svg>
                </div>
                <span className="card-value">{speed ?? '--'} kt</span>
                <span className="card-subtext">Current Steady Winds</span>
              </div>
            </section>

            {/* Metrics Section */}
            <section className="modal-metrics-grid">
              <div className="modal-glass-card metric-item">
                <span className="metric-label">Speed</span>
                <span className="metric-value">{speed ?? '--'} kt</span>
              </div>
              <div className="modal-glass-card metric-item">
                <span className="metric-label">Gusts</span>
                <span className="metric-value" style={{ color: gust ? 'var(--ifr)' : 'var(--text-muted)' }}>
                  {gust ? `${gust} kt` : '--'}
                </span>
              </div>
              <div className="modal-glass-card metric-item">
                <span className="metric-label">Trend</span>
                <span className="metric-value" style={{ color: '#eab308', fontSize: '0.9rem' }}>
                  {trend ?? 'Steady'}
                </span>
              </div>
            </section>

            {/* Runway Analysis Section */}
            {airport && runwayData[airport] && (
              <section className="modal-section">
                <h4 className="modal-section-title">Runway Analysis</h4>
                <div className="modal-runways-list">
                  {runwayData[airport].map((rwy, idx) => {
                    const { headwind, crosswind } = calculateCrosswindHeadwind(angle, speed || 0, rwy.heading);
                    const isWarn = Math.abs(crosswind) > 10;
                    const isDanger = Math.abs(crosswind) > 15;
                    const statusColor = isDanger ? 'var(--ifr)' : isWarn ? '#f59e0b' : 'var(--vfr)';
                    const statusBg = isDanger ? 'var(--ifr-bg)' : isWarn ? 'rgba(245, 158, 11, 0.08)' : 'var(--vfr-bg)';
                    const leftBorder = `4px solid ${statusColor}`;
                    return (
                      <div key={idx} className="modal-runway-card" style={{ background: statusBg, borderLeft: leftBorder }}>
                        <span className="runway-name">Runway {rwy.name}</span>
                        <div className="runway-speeds">
                          <span>
                            Headwind: <strong style={{ color: headwind >= 0 ? 'var(--vfr)' : 'var(--ifr)' }}>{headwind.toFixed(1)} kt</strong>
                          </span>
                          <span>
                            Crosswind: <strong style={{ color: statusColor }}>{crosswind.toFixed(1)} kt</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Wind Trend Section */}
            {history.length > 1 && (
              <section className="modal-section">
                <h4 className="modal-section-title">Wind Trend History</h4>
                <div className="modal-glass-card trend-chart-container">
                  <svg viewBox="0 0 360 100" width="100%" height="70" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="historyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
                        <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="25" x2="360" y2="25" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="50" x2="360" y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="360" y2="75" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                    <text x="2" y="20" fontSize="8" fill="var(--text-muted)">10+ kt</text>
                    <text x="2" y="70" fontSize="8" fill="var(--text-muted)">0 kt</text>
                    <polyline
                      points={history.map((h, i) => `${(i / (history.length - 1)) * 360},${85 - Math.min(h.speed * 6, 80)}`).join(' ')}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={`0,85 ${history.map((h, i) => `${(i / (history.length - 1)) * 360},${85 - Math.min(h.speed * 6, 80)}`).join(' ')} 360,85`}
                      fill="url(#historyGradient)"
                      stroke="none"
                    />
                    <circle cx="360" cy={85 - Math.min(history[history.length - 1].speed * 6, 80)} r="3.5" fill="var(--accent)" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>
                  <div className="trend-labels">
                    <span>Last 20 reports</span>
                    <span>Now</span>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
