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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Wind Details</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>{angle}° {degToCardinal(angle)}</div>
              </header>

              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Wind Rose Vector and direction details */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
                  <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>Wind Heading</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{angle}° {degToCardinal(angle)}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Interactive compass dial</span>
                  </div>
                </div>

                {/* Wind Metrics Grid Card */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Speed</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>{speed ?? '--'} kt</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Gusts</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: gust ? 'var(--ifr)' : 'var(--text-muted)' }}>{gust ? `${gust} kt` : '--'}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Trend</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#eab308', textTransform: 'capitalize' }}>{trend ?? 'steady'}</span>
                  </div>
                </div>

                {airport && runwayData[airport] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>Runway Analysis</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {runwayData[airport].map((rwy, idx) => {
                        const { headwind, crosswind } = calculateCrosswindHeadwind(angle, speed || 0, rwy.heading);
                        const isWarn = Math.abs(crosswind) > 10;
                        const isDanger = Math.abs(crosswind) > 15;
                        const statusColor = isDanger ? 'var(--ifr)' : isWarn ? '#f59e0b' : 'var(--vfr)';
                        const statusBg = isDanger ? 'var(--ifr-bg)' : isWarn ? 'rgba(245, 158, 11, 0.12)' : 'var(--vfr-bg)';
                        return (
                          <div key={idx} style={{ padding: '10px 12px', borderRadius: '12px', background: statusBg, borderLeft: `3px solid ${statusColor}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text)', fontSize: '0.8rem' }}>Rwy {rwy.name}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Headwind: <strong style={{ color: headwind >= 0 ? 'var(--vfr)' : 'var(--ifr)' }}>{headwind.toFixed(1)} kt</strong></span>
                              <span style={{ color: 'var(--text-muted)' }}>Crosswind: <strong style={{ color: statusColor }}>{crosswind.toFixed(1)} kt</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>Wind Trend</span>
                  {history.length > 1 && (
                    <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.3)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
                      <svg viewBox="0 0 360 120" width="100%" height="80" style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="historyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.4)" />
                            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.0)" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="30" x2="360" y2="30" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        <line x1="0" y1="60" x2="360" y2="60" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                        <text x="2" y="25" fontSize="9" fill="var(--text-muted)">10+ kt</text>
                        <text x="2" y="85" fontSize="9" fill="var(--text-muted)">0 kt</text>
                        {history.length > 1 && (
                          <>
                            <polyline
                              points={history.map((h, i) => `${(i / (history.length - 1)) * 360},${100 - Math.min(h.speed * 8, 100)}`).join(' ')}
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                            />
                            <polyline
                              points={`0,100 ${history.map((h, i) => `${(i / (history.length - 1)) * 360},${100 - Math.min(h.speed * 8, 100)}`).join(' ')} 360,100`}
                              fill="url(#historyGradient)"
                              stroke="none"
                            />
                            <circle cx="360" cy={100 - Math.min(history[history.length - 1].speed * 8, 100)} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                          </>
                        )}
                      </svg>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span>7 reports ago</span>
                        <span>Now</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="modal-actions">
                <button onClick={(e) => { e.stopPropagation(); setOpen(false); }}>Close</button>
              </div>
            </div>

            <div style={{ width: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingRight: 12 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>SPEED</div>
              <svg viewBox="0 0 120 140" width="100%" height="100%">
                <defs>
                  <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                {/* Gauge background arc */}
                <path d="M 20 100 A 50 50 0 0 1 100 100" stroke="rgba(148,163,184,0.1)" strokeWidth="8" fill="none" />
                {/* Colored gauge arc - proportional to speed */}
                <path
                  d="M 20 100 A 50 50 0 0 1 100 100"
                  stroke="url(#speedGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.min((speed || 0) / 50 * 251, 251)} 251`}
                />
                {/* Needle */}
                <g transform={`rotate(${Math.min((speed || 0) / 50 * 160, 160) - 80} 60 100)`}>
                  <line x1="60" y1="100" x2="60" y2="45" stroke="#fff" strokeWidth="2" />
                  <circle cx="60" cy="100" r="4" fill="#fff" />
                </g>
                {/* Speed ticks */}
                <text x="60" y="130" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                  {Math.min(Math.round((speed || 0) / 50 * 50), 50)} kt
                </text>
              </svg>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
