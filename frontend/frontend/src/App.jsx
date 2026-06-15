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
    const x = (idx / (data.length - 1)) * 170 + 8;
    const y = 48 - ((val - minVal) / range) * 38;
    return { x, y, val };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} 52 L ${points[0].x} 52 Z`;

  const gradientId = `trendGrad-${color.replace("#", "")}`;

  return (
    <div className="trend-chart-container" style={{ width: '100%', marginTop: 6 }}>
      <svg width="100%" height="56" viewBox="0 0 190 56" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid bounds */}
        <line x1="8" y1="10" x2="178" y2="10" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="2,2" />
        <line x1="8" y1="30" x2="178" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="2,2" />
        <line x1="8" y1="48" x2="178" y2="48" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" strokeDasharray="2,2" />

        {/* Shaded Area underneath the line */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* The line itself */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Plotted markers (dots) for all data points */}
        {points.map((p, idx) => (
          <circle 
            key={idx} 
            cx={p.x} 
            cy={p.y} 
            r="1.5" 
            fill={idx === points.length - 1 ? "#ffffff" : color} 
            stroke={idx === points.length - 1 ? color : "none"}
            strokeWidth="0.8"
          />
        ))}

        {/* Left/Right Range Labels */}
        <text x="182" y="12" fontSize="6" fill="var(--text-muted)" textAnchor="start">{maxVal}{unit}</text>
        <text x="182" y="50" fontSize="6" fill="var(--text-muted)" textAnchor="start">{minVal}{unit}</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.52rem', color: 'var(--text-muted)', marginTop: 2, padding: '0 2px' }}>
        <span>12h ago</span>
        <span>Now</span>
      </div>
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
              <div className="instrument-card">
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
              <div className="instrument-card">
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
              <div className="instrument-card">
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
                  <div className="trend-card">
                    <span className="trend-card__label">Temperature</span>
                    <span className="trend-card__value">{activeWeather.temperature}°C</span>
                    <TrendChart data={history.map((h) => h.temperature).reverse()} color="#f43f5e" unit="°C" />
                  </div>

                  <div className="trend-card">
                    <span className="trend-card__label">Visibility</span>
                    <span className="trend-card__value">{activeWeather.visibility} m</span>
                    <TrendChart data={history.map((h) => h.visibility).reverse()} color="#10b981" unit="m" />
                  </div>

                  <div className="trend-card">
                    <span className="trend-card__label">Wind Speed</span>
                    <span className="trend-card__value">{activeWeather.wind_speed} kt</span>
                    <TrendChart data={history.map((h) => h.wind_speed).reverse()} color="#38bdf8" unit="kt" />
                  </div>

                  <div className="trend-card">
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
      </div>
    </>
  );
}

export default App;
