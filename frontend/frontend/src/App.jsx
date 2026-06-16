import { useEffect, useState } from "react";
import "./App.css";
import Compass from "./Compass";
// Runway configurations
const runwayData = {
  VOMM: [{ name: "01L/19R", heading: 10 }, { name: "01R/19L", heading: 10 }],
  VOCB: [{ name: "05/23", heading: 50 }, { name: "08/26", heading: 80 }],
  VOMD: [{ name: "09/27", heading: 90 }],
  VOSM: [{ name: "06/24", heading: 60 }],
  VOTK: [{ name: "10/28", heading: 100 }],
  VOTR: [{ name: "09/27", heading: 90 }],
};

// Mausam radar and satellite feeds
const radarMapping = {
  VOMM: "https://mausam.imd.gov.in/Radar/caz_cni.gif", // Chennai (VOMM)
  VOCE: "https://mausam.imd.gov.in/Radar/caz_koc.gif", // Coimbatore (VOCE) -> Kochi radar
  VOMD: "https://mausam.imd.gov.in/Radar/caz_kkl.gif", // Madurai (VOMD) -> Karaikal radar
  VOSM: "https://mausam.imd.gov.in/Radar/caz_cni.gif", // Salem (VOSM) -> Chennai radar
  VOTK: "https://mausam.imd.gov.in/Radar/caz_koc.gif", // Tuticorin (VOTK) -> Kochi radar
  VOTR: "https://mausam.imd.gov.in/Radar/caz_kkl.gif", // Trichy (VOTR) -> Karaikal radar
};

const satelliteUrl = "https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg";
const getRadarUrl = (icao) => radarMapping[icao] || "https://mausam.imd.gov.in/Radar/caz_cni.gif";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const FALLBACK_AIRPORTS = [
  { id: 1, name: 'Chennai International Airport', city: 'Chennai', icao: 'VOMM' },
  { id: 2, name: 'Coimbatore International Airport', city: 'Coimbatore', icao: 'VOCB' },
  { id: 3, name: 'Madurai Airport', city: 'Madurai', icao: 'VOMD' },
  { id: 4, name: 'Salem Airport', city: 'Salem', icao: 'VOSM' },
  { id: 5, name: 'Tuticorin Airport', city: 'Tuticorin', icao: 'VOTK' },
  { id: 6, name: 'Tiruchirappalli International Airport', city: 'Trichy', icao: 'VOTR' }
];

function generateMockWeather(icao) {
  const baseTime = new Date();
  const dateStr = baseTime.toISOString().split('T')[0];
  const history = [];

  for (let i = 0; i < 24; i++) {
    const timeDiff = i * 30 * 60 * 1000; // 30 min intervals
    const recordTime = new Date(baseTime.getTime() - timeDiff);
    const hours = String(recordTime.getHours()).padStart(2, '0');
    const minutes = String(recordTime.getMinutes()).padStart(2, '0');

    // Smooth deterministic variations ensuring ranges (Temp: 24-34, Wind: 2-12 kt, Press: 1009-1011, Vis: 2000-6000)
    const temp = 29 + Math.round(Math.sin(i * 0.35) * 5);
    const dewpoint = temp - 4;
    const wind = 7 + Math.round(Math.cos(i * 0.4) * 5);
    const pressure = 1010 + Math.round(Math.sin(Math.floor(i / 3) * 1.25) * 1);
    const visibility = 4000 + Math.round(Math.sin(i * 0.25) * 2000);

    const wind_direction = 180;
    const cloud = 'FEW020';

    const rawMETAR = `METAR ${icao} ${recordTime.getUTCDate()}${hours}${minutes}Z 180${String(wind).padStart(2, '0')}KT ${visibility} ${cloud} ${temp}/${dewpoint} Q${pressure} NOSIG`;

    history.push({
      timeLabel: `${hours}:${minutes} LT`,
      datetime: `${dateStr} ${hours}:${minutes}`,
      rawCode: rawMETAR,
      temperature: temp,
      wind_speed: wind,
      pressure: pressure,
      visibility: visibility,
      cloud: cloud,
      wind_direction: wind_direction,
      dewpoint: dewpoint,
      station: icao
    });
  }
  return history;
}

function generateMockRunwayWind(icao) {
  let baseWindSpeed = 10;
  let baseWindDir = 250;
  if (icao === 'VOCB' || icao === 'VOCE') { baseWindSpeed = 14; baseWindDir = 295; }
  else if (icao === 'VOMD') { baseWindSpeed = 8; baseWindDir = 220; }
  else if (icao === 'VOSM') { baseWindSpeed = 11; baseWindDir = 265; }
  else if (icao === 'VOTK') { baseWindSpeed = 15; baseWindDir = 310; }
  else if (icao === 'VOTR') { baseWindSpeed = 9; baseWindDir = 240; }

  const code = icao === 'VOCE' ? 'VOCB' : icao;
  const rwys = {
    VOMM: [{ name: "01L/19R", heading: 10 }, { name: "01R/19L", heading: 10 }],
    VOCB: [{ name: "05/23", heading: 50 }, { name: "08/26", heading: 80 }],
    VOMD: [{ name: "09/27", heading: 90 }],
    VOSM: [{ name: "06/24", heading: 60 }],
    VOTK: [{ name: "10/28", heading: 100 }],
    VOTR: [{ name: "09/27", heading: 90 }],
  }[code] || [{ name: "09/27", heading: 90 }];

  return rwys.map((rwy, idx) => {
    return {
      label: `Runway ${idx + 1}`,
      runwayNo: rwy.name.split('/')[0],
      dataDateTime: new Date().toISOString(),
      windSpeed1MinAvg: baseWindSpeed + idx * 2,
      maxWindSpeed1Min: baseWindSpeed + 4 + idx * 2,
      windDirection1MinAvg: baseWindSpeed > 0 ? (baseWindDir + idx * 10) % 360 : 0,
      windSpeed: baseWindSpeed + idx * 2,
      windDirection: baseWindDir
    };
  });
}


// Flight rule calculator
function getFlightRule(visibility, cloud) {
  let ceiling = Infinity;
  if (cloud) {
    const isCeiling = cloud.startsWith("BKN") || cloud.startsWith("OVC") || cloud.startsWith("TS");
    if (isCeiling) {
      const heightVal = parseInt(cloud.slice(3), 10);
      if (!isNaN(heightVal)) {
        ceiling = heightVal * 100;
      }
    }
  }

  // VFR: Vis > 8000m AND Ceiling > 3000ft
  // LIFR: Vis < 1600m OR Ceiling < 500ft
  // IFR: Vis < 4800m OR Ceiling < 1000ft
  // MVFR: Vis <= 8000m OR Ceiling <= 3000ft
  if (visibility < 1600 || ceiling < 500) {
    return { name: "LIFR", color: "#e879f9", bg: "rgba(232, 121, 249, 0.15)", label: "Low IFR" };
  } else if (visibility < 4800 || ceiling < 1000) {
    return { name: "IFR", color: "#f87171", bg: "rgba(248, 113, 113, 0.15)", label: "IFR" };
  } else if (visibility <= 8000 || ceiling <= 3000) {
    return { name: "MVFR", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", label: "Marginal VFR" };
  } else {
    return { name: "VFR", color: "#4ade80", bg: "rgba(74, 222, 128, 0.15)", label: "VFR" };
  }
}

// Generate perturbed history data for charts/tables
function generateHistory(latestWeather) {
  if (!latestWeather) return [];
  const baseTime = new Date(latestWeather.datetime.replace(' ', 'T') + ':00');
  const history = [];

  for (let i = 0; i < 7; i++) {
    const timeDiff = i * 30 * 60 * 1000; // 30 mins intervals
    const recordTime = new Date(baseTime.getTime() - timeDiff);
    const hours = String(recordTime.getHours()).padStart(2, '0');
    const minutes = String(recordTime.getMinutes()).padStart(2, '0');

    // Smooth mathematical variations
    const tempOffset = Math.sin(i * 1.2) * 1.5 - (i * 0.4);
    const windOffset = Math.cos(i * 0.9) * 2 + (i * 0.3);
    const pressureOffset = Math.sin(i * 1.5) * 1.2;
    const visOffset = -i * 600;

    const temp = Math.round(latestWeather.temperature + tempOffset);
    const wind = Math.max(2, Math.round(latestWeather.wind_speed + windOffset));
    const pressure = Math.round(latestWeather.pressure + pressureOffset);
    const visibility = Math.max(2000, Math.min(10000, latestWeather.visibility + visOffset));

    const rawMETAR = `METAR ${latestWeather.station} ${hours}${minutes}Z ${latestWeather.wind_direction}${String(wind).padStart(2, '0')}KT ${visibility} ${latestWeather.cloud} ${temp}/${latestWeather.dewpoint} Q${pressure}`;

    history.push({
      timeLabel: `${hours}:${minutes} LT`,
      datetime: `${latestWeather.datetime.split(' ')[0]} ${hours}:${minutes}`,
      rawCode: rawMETAR,
      temperature: temp,
      wind_speed: wind,
      pressure: pressure,
      visibility: visibility,
      cloud: latestWeather.cloud,
      wind_direction: latestWeather.wind_direction,
      dewpoint: latestWeather.dewpoint,
      station: latestWeather.station
    });
  }
  return history;
}

// Decodes the clouds into words
function decodeClouds(cloud) {
  if (!cloud || cloud === "CLR" || cloud === "SKC") return "Clear Sky";

  if (cloud.startsWith("FEW")) {
    return `Few clouds at ${parseInt(cloud.slice(3), 10) * 100} ft`;
  }
  if (cloud.startsWith("SCT")) {
    return `Scattered clouds at ${parseInt(cloud.slice(3), 10) * 100} ft`;
  }
  if (cloud.startsWith("BKN")) {
    return `Broken clouds at ${parseInt(cloud.slice(3), 10) * 100} ft`;
  }
  if (cloud.startsWith("OVC")) {
    return `Overcast at ${parseInt(cloud.slice(3), 10) * 100} ft`;
  }

  return cloud;
}

// Calculate relative humidity
function calculateRH(t, td) {
  if (t === undefined || td === undefined) return "--";
  const es = 6.11 * Math.pow(10, (7.5 * td) / (237.3 + td));
  const e = 6.11 * Math.pow(10, (7.5 * t) / (237.3 + t));
  const rh = Math.round((es / e) * 100);
  return Math.min(100, Math.max(0, rh));
}

// Premium line chart component for detailed historic trends
function TrendChart({ data, color = "#38bdf8", unit = "" }) {
  if (!data || data.length === 0) return null;
  
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 170 + 10;
    const y = 48 - ((val - minVal) / range) * 38;
    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 48 L ${points[0].x} 48 Z`;

  const gradientId = `trendGrad-${color.replace("#", "")}`;

  return (
    <div className="trend-sparkline-container" style={{ width: '100%', marginTop: 'auto' }}>
      <svg width="100%" height="56" viewBox="0 0 230 56" style={{ overflow: 'hidden', display: 'block' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid bounds */}
        <line x1="10" y1="10" x2="180" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="2,2" />
        <line x1="10" y1="29" x2="180" y2="29" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" strokeDasharray="2,2" />
        <line x1="10" y1="48" x2="180" y2="48" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="2,2" />

        {/* Shaded Area underneath the line */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* The line itself */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Plotted markers (dots) for all data points */}
        {points.map((p, idx) => (
          <circle 
            key={idx} 
            cx={p.x} 
            cy={p.y} 
            r={idx === points.length - 1 ? "2.5" : "1.5"} 
            fill={idx === points.length - 1 ? "#ffffff" : color} 
            stroke={idx === points.length - 1 ? color : "none"}
            strokeWidth="0.8"
          />
        ))}

        {/* Left/Right Range Labels */}
        <text x="186" y="13" fontSize="9" fill="var(--text-muted)" textAnchor="start" dominantBaseline="middle">{maxVal}{unit}</text>
        <text x="186" y="49" fontSize="9" fill="var(--text-muted)" textAnchor="start" dominantBaseline="middle">{minVal}{unit}</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: '4.3%', paddingRight: '21.7%' }}>
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function TrendModal({ trend, onClose }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!trend) return null;

  const plotData = [...trend.data].reverse();
  const minVal = Math.min(...plotData.map((d) => d.value));
  const maxVal = Math.max(...plotData.map((d) => d.value));
  const range = maxVal - minVal || 1;

  const points = plotData.map((d, idx) => {
    const x = 40 + (idx / (plotData.length - 1)) * 420;
    const y = 160 - ((d.value - minVal) / range) * 140;
    return { x, y, value: d.value, label: d.timeLabel, datetime: d.datetime };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;
  const gradientId = `modalTrendGrad-${trend.color.replace("#", "")}`;

  const yTicks = [20, 66.7, 113.3, 160].map((y) => {
    const val = minVal + ((160 - y) / 140) * range;
    return { y, val: Math.round(val * 10) / 10 };
  });

  return (
    <div className="trend-modal" onClick={onClose}>
      <aside className="trend-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="trend-modal-header">
          <h3 className="trend-modal-title">{trend.title} Trend History</h3>
          <button className="trend-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="trend-detailed-chart-container">
          <svg viewBox="0 0 500 200" width="100%" height="220" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={trend.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={trend.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1="40" y1={tick.y} x2="460" y2={tick.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="3,3" />
                <text x="32" y={tick.y} fontSize="8" fill="var(--text-muted)" textAnchor="end" dominantBaseline="middle">
                  {tick.val}{trend.unit}
                </text>
              </g>
            ))}

            {[0, 6, 12, 18, points.length - 1].map((idx) => {
              const p = points[idx];
              if (!p) return null;
              return (
                <g key={idx}>
                  <line x1={p.x} y1="160" x2={p.x} y2="165" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <text x={p.x} y="178" fontSize="8" fill="var(--text-muted)" textAnchor="middle">
                    {p.label}
                  </text>
                </g>
              );
            })}

            <path d={areaD} fill={`url(#${gradientId})`} />

            <path d={pathD} fill="none" stroke={trend.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {hoveredPoint && (
              <line x1={hoveredPoint.x} y1="20" x2={hoveredPoint.x} y2="160" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="2,2" />
            )}

            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={hoveredPoint && hoveredPoint.idx === idx ? "4.5" : (idx === points.length - 1 ? "3" : "2")}
                fill={hoveredPoint && hoveredPoint.idx === idx ? "#ffffff" : (idx === points.length - 1 ? "#ffffff" : trend.color)}
                stroke={trend.color}
                strokeWidth={hoveredPoint && hoveredPoint.idx === idx ? "2.5" : "1"}
              />
            ))}

            {hoveredPoint && (
              <g transform={`translate(${hoveredPoint.x > 250 ? hoveredPoint.x - 90 : hoveredPoint.x + 10}, ${hoveredPoint.y > 100 ? hoveredPoint.y - 45 : hoveredPoint.y + 10})`} style={{ pointerEvents: 'none' }}>
                <rect width="80" height="36" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                <text x="8" y="14" fontSize="8.5" fill="var(--text-muted)">{hoveredPoint.label}</text>
                <text x="8" y="27" fontSize="10.5" fill="#ffffff" fontWeight="800">{hoveredPoint.value}{trend.unit}</text>
              </g>
            )}

            {points.map((p, idx) => {
              const colWidth = 420 / (points.length - 1);
              const startX = p.x - colWidth / 2;
              return (
                <rect
                  key={idx}
                  x={startX}
                  y="20"
                  width={colWidth}
                  height="140"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint({ ...p, idx })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </svg>
        </div>

        <div className="trend-modal-history-list">
          <h4>Observation Records (Newest First)</h4>
          <div className="trend-modal-table-wrap">
            <table className="trend-modal-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Value</th>
                  <th>Observation Trend</th>
                </tr>
              </thead>
              <tbody>
                {trend.data.map((item, idx) => {
                  const prevItem = trend.data[idx + 1];
                  let changeIcon = "";
                  let changeColor = "var(--text-muted)";
                  let differenceText = "";
                  
                  if (prevItem) {
                    const diff = item.value - prevItem.value;
                    if (diff > 0) {
                      changeIcon = "▲";
                      changeColor = "#10b981";
                      differenceText = `+${diff.toFixed(1)} ${trend.unit}`;
                    } else if (diff < 0) {
                      changeIcon = "▼";
                      changeColor = "#ef4444";
                      differenceText = `${diff.toFixed(1)} ${trend.unit}`;
                    } else {
                      changeIcon = "•";
                      changeColor = "rgba(255, 255, 255, 0.35)";
                      differenceText = "No change";
                    }
                  } else {
                    differenceText = "--";
                  }

                  return (
                    <tr key={idx}>
                      <td>{item.datetime.split(' ')[0]} {item.timeLabel}</td>
                      <td style={{ fontWeight: 800, color: trend.color }}>
                        {item.value} {trend.unit}
                      </td>
                      <td style={{ color: changeColor, fontSize: '0.76rem', fontWeight: 600 }}>
                        <span style={{ marginRight: 6 }}>{changeIcon}</span>
                        {differenceText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </div>
  );
}

function CloudAltitudesModal({ weather, onClose }) {
  if (!weather) return null;

  const cloudCode = weather.cloud || "CLR";
  const isClear = cloudCode === "CLR" || cloudCode === "SKC" || !cloudCode;
  
  let type = "CLR";
  let heightFt = 0;
  let heightM = 0;
  let ceilingStatus = "No ceiling";
  let altitudePercentage = 0; 

  if (!isClear) {
    type = cloudCode.slice(0, 3);
    const heightVal = parseInt(cloudCode.slice(3), 10);
    heightFt = heightVal * 100;
    heightM = Math.round(heightFt * 0.3048);
    altitudePercentage = Math.min(100, (heightFt / 10000) * 100);
    if (type === "BKN" || type === "OVC") {
      ceilingStatus = "Ceiling active";
    }
  }

  const decodedType = decodeClouds(cloudCode);

  return (
    <div className="trend-modal" onClick={onClose}>
      <aside className="trend-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="trend-modal-header">
          <h3 className="trend-modal-title">Cloud Altitude Analysis</h3>
          <button className="trend-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', minHeight: '300px' }}>
          <div className="modal-glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, alignSelf: 'flex-start', marginBottom: 16 }}>Atmospheric Profile</span>
            
            <div style={{ position: 'relative', height: '220px', width: '100%', borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'absolute', left: '-6px', top: '0', bottom: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <span>10k ft</span>
                <span>7.5k ft</span>
                <span>5k ft</span>
                <span>2.5k ft</span>
                <span>SFC</span>
              </div>

              <div style={{ position: 'absolute', left: '0', right: '0', top: '2px', height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', left: '0', right: '0', top: '55px', height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', left: '0', right: '0', top: '110px', height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', left: '0', right: '0', top: '165px', height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', left: '0', right: '0', bottom: '2px', height: '1px', borderBottom: '1px dashed rgba(255,255,255,0.04)' }} />

              {!isClear ? (
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  right: '10px',
                  bottom: `${altitudePercentage * 0.9}%`,
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.03) 100%)',
                  border: '1.5px dashed var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
                  animation: 'float-icon 4s ease-in-out infinite'
                }}>
                  <span style={{ marginRight: 8 }}>☁️</span>
                  <span>{type} @ {heightFt} ft</span>
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  right: '10px',
                  top: '40%',
                  textAlign: 'center',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: '2rem' }}>☀️</span>
                  <strong>Sky Clear (CLR)</strong>
                  <span>No cloud layers observed below 10,000 ft</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="modal-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Observation Status</span>
              <strong style={{ fontSize: '1.1rem', color: isClear ? 'var(--vfr)' : 'var(--accent)' }}>
                {isClear ? "Clear Skies" : `${type} Cloud Layer`}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{decodedType}</span>
            </div>

            <div className="modal-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Layer Properties</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Height:</span>
                  <strong>{isClear ? "N/A" : `${heightFt} ft (${heightM} m)`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ceiling:</span>
                  <strong style={{ color: ceilingStatus === "Ceiling active" ? 'var(--ifr)' : 'var(--vfr)' }}>
                    {ceilingStatus}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Coverage Octas:</span>
                  <strong>{
                    type === "FEW" ? "1-2 Octas" :
                    type === "SCT" ? "3-4 Octas" :
                    type === "BKN" ? "5-7 Octas" :
                    type === "OVC" ? "8 Octas" : "0 Octas"
                  }</strong>
                </div>
              </div>
            </div>

            <div className="modal-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Flight Category Impact</span>
              <strong style={{ fontSize: '0.9rem', color: isClear ? 'var(--vfr)' : (type === 'BKN' || type === 'OVC') ? 'var(--ifr)' : 'var(--mvfr)' }}>
                {isClear ? "VFR: No Flight Constraints" : (type === 'BKN' || type === 'OVC') ? "Ceiling Active - IFR Rules Apply" : "MVFR Rules Apply"}
              </strong>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0 }}>
                Aviators must maintain a visual path clear of low-lying cloud layers according to local flight rules.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DaylightModal({ weather, onClose }) {
  if (!weather) return null;

  const timePart = weather.datetime.split(' ')[1] || "12:00";
  const [hour, minute] = timePart.split(':').map(Number);
  const currentMinutes = hour * 60 + minute;

  const sunriseMinutes = 360;
  const sunsetMinutes = 1110;
  const daylightSpan = sunsetMinutes - sunriseMinutes;

  const isDay = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;
  
  let sunProgress = 0;
  let remainingText = "";
  
  if (isDay) {
    sunProgress = (currentMinutes - sunriseMinutes) / daylightSpan;
    const remainingMins = sunsetMinutes - currentMinutes;
    const remH = Math.floor(remainingMins / 60);
    const remM = remainingMins % 60;
    remainingText = `${remH}h ${remM}m remaining until Sunset`;
  } else {
    sunProgress = currentMinutes < sunriseMinutes 
      ? (currentMinutes + (1440 - sunsetMinutes)) / (1440 - daylightSpan)
      : (currentMinutes - sunsetMinutes) / (1440 - daylightSpan);
    
    let minsToSunrise = 0;
    if (currentMinutes < sunriseMinutes) {
      minsToSunrise = sunriseMinutes - currentMinutes;
    } else {
      minsToSunrise = (1440 - currentMinutes) + sunriseMinutes;
    }
    const remH = Math.floor(minsToSunrise / 60);
    const remM = minsToSunrise % 60;
    remainingText = `${remH}h ${remM}m remaining until Sunrise`;
  }

  const angleRad = Math.PI * (isDay ? sunProgress : 0); 
  const sunX = 20 + sunProgress * 320;
  const sunY = isDay ? (130 - Math.sin(angleRad) * 90) : 130;

  return (
    <div className="trend-modal" onClick={onClose}>
      <aside className="trend-modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="trend-modal-header">
          <h3 className="trend-modal-title">Daylight & Sun Path</h3>
          <button className="trend-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="modal-glass-card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, alignSelf: 'flex-start', marginBottom: 12 }}>Sun Path (Local Time: {timePart})</span>
            
            <div style={{ width: '100%', height: '160px', position: 'relative' }}>
              <svg viewBox="0 0 360 160" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
                <line x1="10" y1="130" x2="350" y2="130" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
                
                <path d="M 20 130 Q 180 20, 340 130" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2.5" strokeDasharray="4,4" />
                
                {isDay && (
                  <path 
                    d={`M 20 130 Q 180 20, 340 130`} 
                    fill="none" 
                    stroke="url(#sunPathGrad)" 
                    strokeWidth="3.5" 
                    strokeDasharray={`${sunProgress * 440} 440`}
                  />
                )}

                <defs>
                  <linearGradient id="sunPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                <text x="20" y="146" fontSize="8" fill="var(--text-muted)" textAnchor="middle">06:00 (SR)</text>
                <text x="340" y="146" fontSize="8" fill="var(--text-muted)" textAnchor="middle">18:30 (SS)</text>

                <circle 
                  cx={sunX} 
                  cy={sunY} 
                  r={isDay ? "7" : "5"} 
                  fill={isDay ? "#fbbf24" : "rgba(255, 255, 255, 0.15)"} 
                  stroke={isDay ? "#f59e0b" : "rgba(255,255,255,0.25)"} 
                  strokeWidth="1.5" 
                  filter={isDay ? "drop-shadow(0 0 8px #f59e0b)" : "none"} 
                />
              </svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="modal-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Daylight Status</span>
              <strong style={{ fontSize: '1.05rem', color: isDay ? '#fbbf24' : 'var(--text-muted)' }}>
                {isDay ? "Daylight Active" : "Night Phase"}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{remainingText}</span>
            </div>

            <div className="modal-glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Astronomical Times</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sunrise:</span>
                  <strong>06:00 LT</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sunset:</span>
                  <strong>18:30 LT</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                  <strong>12h 30m</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Ceiling calculator
function getCeiling(cloud) {
  if (!cloud || cloud === "CLR" || cloud === "SKC") return "None";
  if (cloud.startsWith("BKN") || cloud.startsWith("OVC")) {
    const heightVal = parseInt(cloud.slice(3), 10);
    return isNaN(heightVal) ? "None" : `${heightVal * 100} ft`;
  }
  return "None";
}

// Active runway direction selector
function getActiveRunwayDirection(icao, windDirection) {
  const stationMapping = { VOCB: "VOCE" };
  const code = stationMapping[icao] ?? icao;
  const rwys = runwayData[code];
  if (!rwys) return "";

  const activeRwys = rwys.map(rwy => {
    const parts = rwy.name.split("/");
    if (parts.length < 2) return rwy.name;

    const h1 = rwy.heading;      // e.g. 50
    const h2 = (rwy.heading + 180) % 360; // e.g. 230

    // find which heading is closer to windDirection
    const diff1 = Math.abs(((windDirection - h1 + 180) % 360) - 180);
    const diff2 = Math.abs(((windDirection - h2 + 180) % 360) - 180);

    return diff1 < diff2 ? parts[0] : parts[1];
  });

  return activeRwys.length > 0 ? `Rwy ${activeRwys[0]} active` : "";
}

function App() {
  const [airports, setAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [activeWeather, setActiveWeather] = useState(null);
  const [runwayWindData, setRunwayWindData] = useState([]);
  const [isWindModalOpen, setIsWindModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isDaylightModalOpen, setIsDaylightModalOpen] = useState(false);

  const handleOpenTrendModal = (title, key, color, unit) => {
    if (!history || history.length === 0) return;
    const trendData = history.map((h) => ({
      datetime: h.datetime,
      timeLabel: h.timeLabel,
      value: h[key]
    }));
    setSelectedTrend({
      title,
      key,
      data: trendData,
      color,
      unit
    });
  };

  useEffect(() => {
    fetchAirports();
  }, []);

  useEffect(() => {
    if (selectedAirport) {
      fetchWeather(selectedAirport);
      fetchRunwayWind(selectedAirport);
    }
  }, [selectedAirport]);

  async function fetchAirports() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/airports`);
      const airportData = await res.json();

      let chennaiWeather = null;
      try {
        const wRes = await fetch(`${API_BASE_URL}/api/weather?station=VOMM&limit=1`);
        if (wRes.ok) {
          const wData = await wRes.json();
          chennaiWeather = wData[0] || null;
        }
      } catch (e) {
        console.error(e);
      }

      const airportsWithWeather = airportData.map((ap) => ({
        ...ap,
        weather: chennaiWeather,
      }));

      setAirports(airportsWithWeather);
      setSelectedAirport(airportData[0].icao);
    } catch (err) {
      console.error("Error fetching airports, falling back to static list:", err);
      setAirports(FALLBACK_AIRPORTS);
      setSelectedAirport(FALLBACK_AIRPORTS[0].icao);
    }
  }

  async function fetchRunwayWind(icao) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/runway-wind?station=${icao}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          if (icao !== "VOMM") {
            setRunwayWindData([data[0]]);
          } else {
            setRunwayWindData(data);
          }
          return;
        }
      }
      throw new Error("Failed to load runway wind from API or empty data returned");
    } catch (err) {
      console.error("Error fetching runway wind, falling back to mock data:", err);
      const mockRunwayWind = generateMockRunwayWind(icao);
      setRunwayWindData(mockRunwayWind);
    }
  }

  async function fetchWeather(icao) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather?station=${icao}&limit=24`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setHistory(data);
          setActiveWeather(data[0]);
          return;
        }
      }
      throw new Error("Failed to load weather from API");
    } catch (err) {
      console.error("Error fetching weather, falling back to mock data:", err);
      const mockHistory = generateMockWeather(icao);
      setHistory(mockHistory);
      setActiveWeather(mockHistory[0]);
    }
  }

  // Get active airport details
  const selectedAirportDetails = airports.find((a) => a.icao === selectedAirport);

  // Filter airports in sidebar based on search query
  const filteredAirports = airports.filter((ap) => {
    const query = searchQuery.toLowerCase();
    return (
      ap.name.toLowerCase().includes(query) ||
      ap.city.toLowerCase().includes(query) ||
      ap.icao.toLowerCase().includes(query)
    );
  });
  function getWeatherTheme(weatherData) {
    if (!weatherData) return "cloudy";

    const cloud = (weatherData.cloud || "").toUpperCase();
    const raw = (weatherData.rawCode || "").toUpperCase();
    const weatherText = `${cloud} ${raw}`;

    if (
      weatherText.includes("TS") ||
      weatherText.includes("RA") ||
      weatherText.includes("SH") ||
      weatherText.includes("DZ") ||
      weatherText.includes("THUNDER") ||
      weatherText.includes("RAIN")
    ) {
      return "storm";
    }

    if (cloud.includes("BKN") || cloud.includes("OVC")) {
      return "storm";
    }

    if (cloud.includes("FEW") || cloud.includes("SCT")) {
      return "cloudy";
    }

    if (cloud.includes("CLR") || cloud.includes("SKC") || cloud === "") {
      return weatherData.temperature >= 33 ? "hot" : "clear";
    }

    return "cloudy";
  }

  function getWeatherIcon(theme, cloud) {
    const cloudCode = (cloud || "").toUpperCase();
    if (theme === "storm") return "🌧️";
    if (theme === "hot" || theme === "clear") return "☀️";
    if (cloudCode.includes("BKN") || cloudCode.includes("OVC")) return "☁️";
    return "⛅";
  }

  const activeTheme = getWeatherTheme(activeWeather);
  const weatherIcon = activeWeather ? getWeatherIcon(activeTheme, activeWeather.cloud) : "⛅";
  const flightRule = activeWeather ? getFlightRule(activeWeather.visibility, activeWeather.cloud) : null;
  const cacheBuster = Math.floor(Date.now() / (15 * 60 * 1000)); // 15-minute cache buster
  const currentRadarUrl = `${getRadarUrl(selectedAirport)}?t=${cacheBuster}`;
  const currentSatelliteUrl = `${satelliteUrl}?t=${cacheBuster}`;


  // Forecast path coordinates
  const forecastTemps = activeWeather
    ? [
      activeWeather.temperature - 2,
      activeWeather.temperature + 1,
      activeWeather.temperature,
      activeWeather.temperature - 1,
      activeWeather.temperature + 2,
    ]
    : [0, 0, 0, 0, 0];

  const minT = Math.min(...forecastTemps);
  const maxT = Math.max(...forecastTemps);
  const diff = maxT - minT || 1;
  const points = forecastTemps.map((temp, index) => {
    const x = 50 + index * 100;
    const y = 45 - ((temp - minT) / diff) * 30; // normalized y value between 15 and 45
    return { x, y, temp };
  });

  const pathD = `M ${points[0].x} ${points[0].y} 
                 Q 100 ${(points[0].y + points[1].y) / 2}, ${points[1].x} ${points[1].y}
                 Q 200 ${(points[1].y + points[2].y) / 2}, ${points[2].x} ${points[2].y}
                 Q 300 ${(points[2].y + points[3].y) / 2}, ${points[3].x} ${points[3].y}
                 Q 400 ${(points[3].y + points[4].y) / 2}, ${points[4].x} ${points[4].y}`;

  const fillD = `${pathD} L 450 60 L 50 60 Z`;

  return (
    <>
      <video
        key={activeTheme}
        className="bg-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src={
            activeTheme === "clear" || activeTheme === "hot"
              ? "/videos/sunny.mp4"
              : activeTheme === "storm"
              ? "/videos/rainy.mp4"
              : "/videos/cloudy.mp4"
          }
          type="video/mp4"
        />
      </video>

      <div className="bg-overlay"></div>

      <div className={`app-shell app-shell--${activeTheme}`}>
      {/* COLUMN 1: LEFT SIDEBAR */}
      <aside className="sidebar glass-panel">
        <header className="sidebar-brand imd-brand">
          <img src="/IMD.jpg" alt="India Meteorological Department" className="imd-logo" />
          <h1 className="brand-text">
            INDIA METEOROLOGICAL DEPARTMENT
          </h1>
        </header>

        {/* Station Search */}
        <div className="sidebar-search-box">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search regional airports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Regional Airports Dropdown */}
        <h3 className="sidebar-section-title">Regional Stations</h3>
        <select
          value={selectedAirport}
          onChange={(e) => setSelectedAirport(e.target.value)}
          className="airport-dropdown"
        >
          {filteredAirports.map((ap) => {
            let label = `${ap.icao} - ${ap.city}`;

            if (ap.icao === "VOCE") {
              label = "VOCB - Coimbatore";
            }
            return (
              <option key={ap.id} value={ap.icao}>
                {label}
              </option>
            );
          })}
        </select>

        {/* Report History Dropdown */}
        {history.length > 0 && (
          <>
            <h3 className="sidebar-section-title">Report History</h3>
            <select
              value={activeWeather ? activeWeather.datetime : ""}
              onChange={(e) => {
                const selectedHist = history.find((h) => h.datetime === e.target.value);
                if (selectedHist) setActiveWeather(selectedHist);
              }}
              className="airport-dropdown"
            >
              {history.map((hist, idx) => {
                return (
                  <option key={idx} value={hist.datetime}>
                    {hist.timeLabel}
                  </option>
                );
              })}
            </select>
          </>
        )}
      </aside>

      {/* COLUMN 2: MIDDLE MAIN DASHBOARD */}
      <main className="main-content">
        {activeWeather ? (
          <>
            {/* Header / Breadcrumbs */}
            <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="station-title">
                  {activeWeather.station === "VOCE"
                    ? "METAR VOCB COIMBATORE INTERNATIONAL AIRPORT"
                    : `METAR ${activeWeather.station} · ${selectedAirportDetails?.name ?? activeWeather.station}`}
                </h2>
              </div>
              <div className="glass-panel" style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.72rem', display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{activeWeather.station}</strong>
                <span style={{ color: 'var(--text-muted)' }}>{activeWeather.datetime.split(' ')[0]} {activeWeather.datetime.split(' ')[1]} LT</span>
              </div>
            </header>

            {/* Six core METAR parameter cards */}
            <section className="metrics-grid">
              {/* Card 1: Flight Rule */}
              <div className={`metric-card metric-card--${flightRule.name.toLowerCase()}`}>
                <span className="metric-card__value" style={{ fontSize: '1.38rem', fontWeight: 800 }}>{flightRule.name}</span>
                <span className="metric-card__label" style={{ fontSize: '0.52rem' }}>{flightRule.label}</span>
              </div>

              {/* Card 2: Temperature */}
              <div className="metric-card">
                <span className="metric-card__value">{weatherIcon} {activeWeather.temperature}°C</span>
                <span className="metric-card__label">{decodeClouds(activeWeather.cloud).split(" at ")[0]}</span>
              </div>

              {/* Card 3: Wind */}
              <div className="metric-card">
                <span className="metric-card__value">{activeWeather.wind_speed} kt</span>
                <span className="metric-card__label">{activeWeather.wind_direction}° Wind</span>
              </div>

              {/* Card 4: Visibility */}
              <div className="metric-card">
                <span className="metric-card__value">{activeWeather.visibility} m</span>
                <span className="metric-card__label">Visibility</span>
              </div>



              {/* Card 6: Pressure */}
              <div className="metric-card">
                <span className="metric-card__value">{activeWeather.pressure} hPa</span>
                <span className="metric-card__label">QNH Pressure</span>
              </div>
            </section>

            {/* Visual Instruments */}
            <section className="instruments-grid">
              {/* Runway Wind Compass */}
              <div className="instrument-card" onClick={() => setIsWindModalOpen(true)} style={{ cursor: 'pointer' }}>
                <div className="instrument-card__header">
                  <span className="instrument-card__title">RWY</span>
                  <span className="instrument-card__icon">🧭</span>
                </div>
                <div className="instrument-card__visual">
                  <Compass
                    direction={Number(activeWeather.wind_direction)}
                    speed={activeWeather.wind_speed}
                    airport={selectedAirport}
                    diameter={80}
                    open={isWindModalOpen}
                    setOpen={setIsWindModalOpen}
                  />
                </div>
                <div className="instrument-card__footer">
                  {getActiveRunwayDirection(selectedAirport, activeWeather.wind_direction) || "Compass view"}
                </div>
              </div>

              {/* Wind Speed Gauge */}
              <div className="instrument-card" onClick={() => setIsWindModalOpen(true)} style={{ cursor: 'pointer' }}>
                <div className="instrument-card__header">
                  <span className="instrument-card__title">Wind Speed</span>
                  <span className="instrument-card__icon">💨</span>
                </div>
                <div className="instrument-card__visual">
                  <div style={{ position: "relative", width: 100, height: 70 }}>
                    <svg viewBox="0 0 100 60" width="100%" height="100%">
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="60%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 15 50 A 35 35 0 0 1 85 50"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 15 50 A 35 35 0 0 1 85 50"
                        stroke="url(#gaugeGrad)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(100, (activeWeather.wind_speed / 40) * 100) * 1.1} 110`}
                      />
                      <g transform={`rotate(${Math.min(100, (activeWeather.wind_speed / 40) * 100) * 1.8 - 90} 50 50)`}>
                        <line x1="50" y1="50" x2="50" y2="20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
                      </g>
                    </svg>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
                      <span style={{ fontSize: "1.02rem", fontWeight: 800 }}>
                        {activeWeather.wind_speed}{" "}
                        <span style={{ fontSize: "0.62rem", fontWeight: 500, color: "var(--text-muted)" }}>
                          kt
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="instrument-card__footer">
                  Steady winds
                </div>
              </div>

              {/* Cloud Altitudes */}
              <div className="instrument-card" onClick={() => setIsCloudModalOpen(true)} style={{ cursor: 'pointer' }}>
                <div className="instrument-card__header">
                  <span className="instrument-card__title">Cloud Altitudes</span>
                  <span className="instrument-card__icon">☁️</span>
                </div>
                <div className="instrument-card__visual">
                  {activeWeather.cloud && activeWeather.cloud !== "CLR" && activeWeather.cloud !== "SKC" ? (
                    (() => {
                      const type = activeWeather.cloud.slice(0, 3);
                      const heightVal = parseInt(activeWeather.cloud.slice(3), 10);
                      const heightFt = heightVal * 100;
                      const percent = Math.min(100, (heightFt / 10000) * 100);
                      return (
                        <div className="cloud-levels-viz" style={{ height: 85, width: "100%" }}>
                          <div className="cloud-levels-y-axis">
                            <span>10k</span>
                            <span>5k</span>
                            <span>SFC</span>
                          </div>
                          <div className="cloud-level-bar" style={{ bottom: `${percent * 0.65}%`, left: "34px", right: "4px", fontSize: "0.58rem", padding: "0 6px", height: "24px" }}>
                            {type} @ {heightFt} ft
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span style={{ fontSize: "2rem" }}>☀️</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        Clear Sky
                      </span>
                    </div>
                  )}
                </div>
                <div className="instrument-card__footer">
                  Lowest layer: {activeWeather.cloud || "Clear Sky"}
                </div>
              </div>

              {/* Daylight Card */}
              <div className="instrument-card" onClick={() => setIsDaylightModalOpen(true)} style={{ cursor: 'pointer' }}>
                <div className="instrument-card__header">
                  <span className="instrument-card__title">Daylight</span>
                  <span className="instrument-card__icon">☀️</span>
                </div>
                <div className="instrument-card__visual">
                  <div style={{ position: "relative", width: 100, height: 70 }}>
                    <svg viewBox="0 0 100 60" width="100%" height="100%">
                      <path d="M 10 50 Q 50 12, 90 50" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="3 3" />
                      <circle cx="50" cy="22" r="4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)" />
                      <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                      <text x="12" y="58" fontSize="5" fill="var(--text-muted)" textAnchor="middle">06:00</text>
                      <text x="88" y="58" fontSize="5" fill="var(--text-muted)" textAnchor="middle">18:30</text>
                    </svg>
                  </div>
                </div>
                <div className="instrument-card__footer">
                  Daylight active
                </div>
              </div>
            </section>

            {/* Sparkline historical trend graphs */}
            {history.length > 1 && (
              <section className="details-section" style={{ marginTop: 8 }}>
                <h3 className="sidebar-section-title" style={{ fontSize: "0.72rem", marginBottom: 12 }}>Historic trends (Last 24 reports)</h3>
                <div className="trends-grid">
                  <div className="trend-card" onClick={() => handleOpenTrendModal('Temperature', 'temperature', '#f43f5e', '°C')}>
                    <span className="trend-card__label">Temperature</span>
                    <span className="trend-card__value">{activeWeather.temperature}°C</span>
                    <TrendChart data={history.map((h) => h.temperature).reverse()} color="#f43f5e" unit="°C" />
                  </div>

                  <div className="trend-card" onClick={() => handleOpenTrendModal('Visibility', 'visibility', '#10b981', 'm')}>
                    <span className="trend-card__label">Visibility</span>
                    <span className="trend-card__value">{activeWeather.visibility} m</span>
                    <TrendChart data={history.map((h) => h.visibility).reverse()} color="#10b981" unit="m" />
                  </div>

                  <div className="trend-card" onClick={() => handleOpenTrendModal('Wind Speed', 'wind_speed', '#38bdf8', 'kt')}>
                    <span className="trend-card__label">Wind Speed</span>
                    <span className="trend-card__value">{activeWeather.wind_speed} kt</span>
                    <TrendChart data={history.map((h) => h.wind_speed).reverse()} color="#38bdf8" unit="kt" />
                  </div>

                  <div className="trend-card" onClick={() => handleOpenTrendModal('Pressure', 'pressure', '#a855f7', 'hPa')}>
                    <span className="trend-card__label">Pressure</span>
                    <span className="trend-card__value">{activeWeather.pressure} hPa</span>
                    <TrendChart data={history.map((h) => h.pressure).reverse()} color="#a855f7" unit="hPa" />
                  </div>
                </div>
              </section>
            )}

            {/* METAR Raw Code String */}
            <section className="raw-metar-container" style={{ marginTop: 8 }}>
              <span className="raw-metar-container__label">Raw METAR</span>
              <span>{activeWeather.rawCode}</span>
            </section>
          </>
        ) : (
          <section className="main-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2>Select Station</h2>
            <p>Please choose a regional station in the sidebar to review decoded observations.</p>
          </section>
        )}
      </main>

      {/* COLUMN 3: RIGHT DETAILS PANEL */}
      <aside className="details-panel glass-panel">
        {activeWeather ? (
          <>
            {runwayWindData.length > 0 && (
              <section className="details-section">
                <h3>RWY</h3>
                <div className="runway-wind-table-wrap">
                  <table className="runway-wind-table">
                    <thead>
                      <tr>
                        <th>RWY</th>
                        <th>WS</th>
                        <th>MAX</th>
                        <th>WD</th>
                        <th>Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runwayWindData.map((rwy) => (
                        <tr key={rwy.label}>
                          <td>{rwy.label}</td>
                          <td>{rwy.windSpeed1MinAvg} kt</td>
                          <td>{rwy.maxWindSpeed1Min} kt</td>
                          <td>{rwy.windDirection1MinAvg}°</td>
                          <td>{activeWeather ? `${activeWeather.visibility} m` : "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Cloud coverage detail list */}
            <section className="details-section">
              <h3>Cloud coverage</h3>
              <div className="cloud-coverage-card">
                <span className="cloud-coverage-card__type">
                  {activeWeather.cloud && activeWeather.cloud !== "CLR" && activeWeather.cloud !== "SKC"
                    ? decodeClouds(activeWeather.cloud).split(" at ")[0]
                    : "Clear Sky"}
                </span>
                <span className="cloud-coverage-card__alt">
                  {activeWeather.cloud && activeWeather.cloud !== "CLR" && activeWeather.cloud !== "SKC"
                    ? `${parseInt(activeWeather.cloud.slice(3), 10) * 100} ft`
                    : "No ceiling"}
                </span>
              </div>
            </section>

            {/* Weather Feeds: Radar & Satellite */}
            <section className="details-section" style={{ marginTop: 16 }}>
              <h3>Weather Feeds</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 0 }}>
                <div
                  className="sidebar-feed-card"
                  onClick={() => setZoomedImage(currentRadarUrl)}
                >
                  <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 2 }}>Radar Image</span>
                  <div style={{ width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#090d16' }}>
                    <img
                      src={currentRadarUrl}
                      alt="Radar Feed"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://mausam.imd.gov.in/Radar/caz_cni.gif"; // fallback to Chennai radar
                      }}
                    />
                  </div>
                </div>

                <div
                  className="sidebar-feed-card"
                  onClick={() => setZoomedImage(currentSatelliteUrl)}
                >
                  <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, paddingLeft: 2 }}>Satellite Image</span>
                  <div style={{ width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#090d16' }}>
                    <img
                      src={currentSatelliteUrl}
                      alt="Satellite Feed"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </section>

          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
            Awaiting station selection...
          </div>
        )}
      </aside>

      {/* Pop-up modal overlay for zoomed radar/satellite images */}
      {zoomedImage && (
        <div
          className="modal-overlay"
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '85%', maxHeight: '85%' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomedImage}
              alt="Zoomed Weather Map View"
              onError={(e) => {
                e.target.onerror = null;
                if (e.target.src.includes('Radar')) {
                  e.target.src = "https://mausam.imd.gov.in/Radar/caz_cni.gif";
                } else {
                  e.target.src = "https://mausam.imd.gov.in/Satellite/3Dasiasec_ir1.jpg";
                }
              }}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                display: 'block'
              }}
            />
            <button
              onClick={() => setZoomedImage(null)}
              style={{
                position: 'absolute',
                top: '-48px',
                right: '0px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '18px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'background 0.2s'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pop-up modal overlay for detailed trend interactive graph */}
      {selectedTrend && (
        <TrendModal
          trend={selectedTrend}
          onClose={() => setSelectedTrend(null)}
        />
      )}

      {/* Pop-up modal overlay for detailed cloud altitude profile */}
      {isCloudModalOpen && (
        <CloudAltitudesModal
          weather={activeWeather}
          onClose={() => setIsCloudModalOpen(false)}
        />
      )}

      {/* Pop-up modal overlay for daylight and sun path */}
      {isDaylightModalOpen && (
        <DaylightModal
          weather={activeWeather}
          onClose={() => setIsDaylightModalOpen(false)}
        />
      )}
      </div>
    </>
  );
}

export default App;
