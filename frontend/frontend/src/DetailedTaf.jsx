import React from 'react';

// Minimal, formal SVG icons for aviation dashboard
const PlaneOutline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
    <path d="M17.8 19.2L16 11l3.5-3.5c.6-.6.6-1.5 0-2.1-.6-.6-1.5-.6-2.1 0L13.9 9 5.7 7.2c-.6-.1-1.1.2-1.3.7l-.9 2.5 7.1 2.9-3.4 3.4-3-.6c-.4-.1-.9.1-1.1.5l-1 1.8 4.2 1.4 1.4 4.2 1.8-1c.4-.2.6-.7.5-1.1l-.6-3 3.4-3.4 2.9 7.1 2.5-.9c.5-.2.8-.7.7-1.3z" />
  </svg>
);

const SunOutline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24' }}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const CloudSunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" stroke="#fbbf24" />
    <circle cx="12" cy="12" r="3" stroke="#fbbf24" />
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="#94a3b8" />
  </svg>
);

const CloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const CloudRainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="16" y1="13" x2="16" y2="21" />
    <line x1="8" y1="13" x2="8" y2="21" />
    <line x1="12" y1="15" x2="12" y2="23" />
    <path d="M20 16.58A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 4 15.25" stroke="#94a3b8" />
  </svg>
);

const StormIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M19 16.9A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 3 16.3" stroke="#94a3b8" />
    <polyline points="13 11 9 17 12 17 11 23 15 17 12 17 13 11" />
  </svg>
);

const FogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <line x1="5" y1="8" x2="19" y2="8" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="6" y1="16" x2="18" y2="16" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </svg>
);

const WindArrow = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const AIRPORT_METADATA = {
  VOMM: {
    name: "Chennai International Airport",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    lat: "12.99000",
    lon: "80.16930",
    runways: "2 runways: 7/25 and 12/30",
    iata: "MAA",
    fir: "Chennai FIR",
    sunrise: "05:43",
    sunset: "18:36"
  },
  VOCB: {
    name: "Coimbatore International Airport",
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    lat: "11.03000",
    lon: "77.04340",
    runways: "1 runway: 05/23",
    iata: "CJB",
    fir: "Chennai FIR",
    sunrise: "05:54",
    sunset: "18:43"
  },
  VOCE: {
    name: "Coimbatore International Airport",
    city: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    lat: "11.03000",
    lon: "77.04340",
    runways: "1 runway: 05/23",
    iata: "CJB",
    fir: "Chennai FIR",
    sunrise: "05:54",
    sunset: "18:43"
  },
  VOMD: {
    name: "Madurai Airport",
    city: "Madurai",
    state: "Tamil Nadu",
    country: "India",
    lat: "9.83450",
    lon: "78.09340",
    runways: "1 runway: 09/27",
    iata: "IXM",
    fir: "Chennai FIR",
    sunrise: "05:53",
    sunset: "18:37"
  },
  VOSM: {
    name: "Salem Airport",
    city: "Salem",
    state: "Tamil Nadu",
    country: "India",
    lat: "11.77700",
    lon: "78.02600",
    runways: "1 runway: 06/24",
    iata: "SXV",
    fir: "Chennai FIR",
    sunrise: "05:51",
    sunset: "18:41"
  },
  VOTK: {
    name: "Tuticorin Airport",
    city: "Tuticorin",
    state: "Tamil Nadu",
    country: "India",
    lat: "8.72250",
    lon: "78.02530",
    runways: "1 runway: 10/28",
    iata: "TCR",
    fir: "Chennai FIR",
    sunrise: "05:56",
    sunset: "18:34"
  },
  VOTR: {
    name: "Tiruchirappalli International Airport",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    country: "India",
    lat: "10.76530",
    lon: "78.71000",
    runways: "1 runway: 09/27",
    iata: "TRZ",
    fir: "Chennai FIR",
    sunrise: "05:49",
    sunset: "18:36"
  }
};

function parseCustomDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const customMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (customMatch) {
    const day = parseInt(customMatch[1], 10);
    const month = parseInt(customMatch[2], 10) - 1;
    const year = parseInt(customMatch[3], 10);
    const hour = parseInt(customMatch[4], 10);
    const minute = parseInt(customMatch[5], 10);
    const second = customMatch[6] ? parseInt(customMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = parseInt(isoMatch[4], 10);
    const minute = parseInt(isoMatch[5], 10);
    const second = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }

  const d = new Date(dateStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? new Date() : d;
}

function parseTafPeriod(validityToken, baseDateStr) {
  const match = validityToken.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/);
  if (!match) return null;

  const startDay = parseInt(match[1], 10);
  const startHour = parseInt(match[2], 10);
  const endDay = parseInt(match[3], 10);
  const endHour = parseInt(match[4], 10);

  const baseDate = parseCustomDate(baseDateStr);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-based

  let startDate = new Date(Date.UTC(year, month, startDay, startHour, 0));

  let endMonth = month;
  let endYear = year;
  if (endDay < startDay) {
    endMonth = month + 1;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
  }
  let endDate = new Date(Date.UTC(endYear, endMonth, endDay, endHour, 0));

  return { startDate, endDate };
}

function decodeCloudToken(token) {
  const match = token.match(/^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/);
  if (!match) return null;

  const type = match[1];
  const heightVal = parseInt(match[2], 10) * 100;
  const convective = match[3];

  const typeMap = {
    FEW: "Few clouds",
    SCT: "Scattered clouds",
    BKN: "Broken clouds",
    OVC: "Overcast clouds"
  };

  let desc = typeMap[type] || type;
  if (convective) {
    if (convective === 'CB') desc += " (cumulonimbus)";
    else if (convective === 'TCU') desc += " (towering cumulus)";
  }

  return `${desc} at ${heightVal.toLocaleString()} ft`;
}

function decodeWeatherToken(token) {
  if (token.includes('/')) {
    return token.split('/').map(decodeWeatherToken).filter(Boolean).join(', ');
  }

  let intensity = '';
  let code = token;

  if (token.startsWith('-')) {
    intensity = 'light ';
    code = token.slice(1);
  } else if (token.startsWith('+')) {
    intensity = 'heavy ';
    code = token.slice(1);
  } else if (token.startsWith('VC')) {
    intensity = 'vicinity ';
    code = token.slice(2);
  }

  const weatherMap = {
    TS: 'thunderstorm',
    SH: 'showers',
    DZ: 'drizzle',
    RA: 'rain',
    SN: 'snow',
    GR: 'hail',
    GS: 'small hail',
    BR: 'mist',
    FG: 'fog',
    HZ: 'haze',
    FU: 'smoke',
    DU: 'dust',
    DS: 'duststorm',
    SS: 'sandstorm',
    SQ: 'squall',
    PO: 'dust devils',
    FC: 'funnel cloud'
  };

  let decodedParts = [];
  let index = 0;
  while (index < code.length) {
    const part = code.slice(index, index + 2);
    if (weatherMap[part]) {
      decodedParts.push(weatherMap[part]);
      index += 2;
    } else {
      decodedParts.push(part.toLowerCase());
      index += part.length;
    }
  }

  if (decodedParts.length === 0) return token;

  const result = intensity + decodedParts.join(', ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function parseTafTokens(line) {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length === 0) return null;

  let changeType = "BASE";
  let valToken = null;
  let wind = null;
  let visibility = null;
  let weather = null;
  const clouds = [];

  let startIdx = 0;
  if (tokens[0] === "TAF") {
    changeType = "BASE";
    startIdx = 1;
  } else if ((tokens[0] === "PROB30" || tokens[0] === "PROB40") && tokens[1] === "TEMPO") {
    changeType = `${tokens[0]} TEMPO`;
    startIdx = 2;
  } else if (["BECMG", "TEMPO", "PROB30", "PROB40"].includes(tokens[0])) {
    changeType = tokens[0];
    startIdx = 1;
  } else if (tokens[0].startsWith("FM")) {
    changeType = "FM";
    startIdx = 1;
  }

  for (let i = startIdx; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^\d{4}\/\d{4}$/.test(token)) {
      valToken = token;
      continue;
    }
    if (/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT$/.test(token)) {
      wind = token;
      continue;
    }
    if (/^\d{4}$/.test(token)) {
      visibility = token;
      continue;
    }
    if (token === "CAVOK") {
      visibility = "CAVOK";
      continue;
    }
    if (/^(FEW|SCT|BKN|OVC)\d{3}(CB|TCU)?$/.test(token)) {
      clouds.push(token);
      continue;
    }
    if (/(^|[+-]|VC)(TS|SH|DZ|RA|SN|GR|GS|BR|FG|HZ|FU|DU|SQ|FC)/.test(token)) {
      weather = token;
      continue;
    }
  }

  return {
    changeType,
    valToken,
    wind,
    visibility,
    weather,
    clouds,
    rawLine: line
  };
}

function getWeatherIcon(weatherText, cloudTheme) {
  const wt = (weatherText || "").toLowerCase();
  if (wt.includes("thunderstorm") || wt.includes("ts")) return <StormIcon />;
  if (wt.includes("rain") || wt.includes("drizzle") || wt.includes("ra") || wt.includes("dz") || wt.includes("showers")) return <CloudRainIcon />;
  if (wt.includes("mist") || wt.includes("br") || wt.includes("fog") || wt.includes("fg") || wt.includes("haze") || wt.includes("hz")) return <FogIcon />;

  if (cloudTheme === "overcast") return <CloudIcon />;
  if (cloudTheme === "cloudy") return <CloudSunIcon />;
  return <SunIcon />;
}

function getWeatherTextLabel(weatherText, cloudText) {
  const wt = (weatherText || "").toLowerCase();
  if (wt !== "--" && wt !== "") {
    return weatherText;
  }
  if (cloudText.includes("Overcast")) return "Overcast";
  if (cloudText.includes("Broken")) return "Broken clouds";
  if (cloudText.includes("Scattered")) return "Scattered clouds";
  if (cloudText.includes("Few")) return "Few clouds";
  return "Clear sky";
}

function generateHourlyTimeline(tafText, baseDateStr, details) {
  const lines = tafText.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedLines = lines.map(parseTafTokens).filter(Boolean);

  const baseLine = parsedLines.find(p => p.changeType === "BASE");
  if (!baseLine || !baseLine.valToken) return [];

  const basePeriod = parseTafPeriod(baseLine.valToken, baseDateStr);
  if (!basePeriod) return [];

  const { startDate, endDate } = basePeriod;
  const steps = [];
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const stepMs = 60 * 60 * 1000;

  for (let ms = startMs; ms <= endMs; ms += stepMs) {
    steps.push(new Date(ms));
  }

  const sunriseHour = parseInt(details.sunrise.split(':')[0], 10);
  const sunsetHour = parseInt(details.sunset.split(':')[0], 10);

  return steps.map(t => {
    let windToken = baseLine.wind;
    let visToken = baseLine.visibility;
    let weatherToken = baseLine.weather;
    let cloudsArray = [...baseLine.clouds];
    let tempoActive = false;
    let tempoProb = "";

    parsedLines.forEach(p => {
      if (p.changeType === "BASE") return;

      if (p.changeType === "FM") {
        const fmTime = p.rawLine.split(/\s+/)[0].slice(2);
        const day = parseInt(fmTime.slice(0, 2), 10);
        const hour = parseInt(fmTime.slice(2, 4), 10);
        const minute = parseInt(fmTime.slice(4, 6), 10);

        let baseDate = new Date();
        if (baseDateStr) {
          baseDate = new Date(baseDateStr.replace(' ', 'T') + ':00');
        }
        const fmUtc = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), day, hour, minute));

        if (t.getTime() >= fmUtc.getTime()) {
          if (p.wind) windToken = p.wind;
          if (p.visibility) visToken = p.visibility;
          if (p.weather) weatherToken = p.weather;
          if (p.clouds.length > 0) cloudsArray = [...p.clouds];
        }
      } else if (p.changeType === "BECMG") {
        if (p.valToken) {
          const period = parseTafPeriod(p.valToken, baseDateStr);
          if (period && t.getTime() >= period.endDate.getTime()) {
            if (p.wind) windToken = p.wind;
            if (p.visibility) visToken = p.visibility;
            if (p.weather) weatherToken = p.weather;
            if (p.clouds.length > 0) cloudsArray = [...p.clouds];
          }
        }
      } else if (p.changeType === "TEMPO" || p.changeType.includes("TEMPO")) {
        if (p.valToken) {
          const period = parseTafPeriod(p.valToken, baseDateStr);
          if (period && t.getTime() >= period.startDate.getTime() && t.getTime() < period.endDate.getTime()) {
            tempoActive = true;
            tempoProb = p.changeType.startsWith("PROB") ? `>${p.changeType.slice(4, 6)}%` : "TEMPO";
            if (p.wind) windToken = p.wind;
            if (p.visibility) visToken = p.visibility;
            if (p.weather) weatherToken = p.weather;
            if (p.clouds.length > 0) cloudsArray = [...p.clouds];
          }
        }
      }
    });

    // Decode Wind
    let windDir = null;
    let windSpd = null;
    let windGust = null;
    if (windToken && windToken !== "--") {
      const match = windToken.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT$/);
      if (match) {
        windDir = match[1] === "VRB" ? "VRB" : parseInt(match[1], 10);
        windSpd = parseInt(match[2], 10);
        if (match[3]) windGust = parseInt(match[3], 10);
      }
    }

    // Decode Visibility
    let visibilityText = "--";
    if (visToken === "CAVOK") {
      visibilityText = "10 km";
    } else if (visToken && visToken !== "--") {
      const meters = parseInt(visToken, 10);
      visibilityText = `${meters / 1000} km`;
    }

    // Decode Clouds & Ceiling
    let cloudText = "Clear sky";
    let ceilingText = "-";
    let cloudTheme = "clear";

    if (visToken === "CAVOK") {
      cloudText = "Clear sky";
      cloudTheme = "clear";
    } else if (cloudsArray.length > 0) {
      const decodedClouds = cloudsArray.map(c => {
        const type = c.slice(0, 3);
        const typeMap = { FEW: "Few", SCT: "Scattered", BKN: "Broken", OVC: "Overcast" };
        return typeMap[type] || type;
      });
      cloudText = decodedClouds.join(", ");

      const ceilingLayer = cloudsArray.find(c => c.startsWith("BKN") || c.startsWith("OVC"));
      if (ceilingLayer) {
        const heightVal = parseInt(ceilingLayer.slice(3, 6), 10) * 100;
        ceilingText = `${heightVal.toLocaleString()} ft`;
      }

      const hasOvercastOrBroken = cloudsArray.some(c => c.startsWith("BKN") || c.startsWith("OVC"));
      if (hasOvercastOrBroken) cloudTheme = "overcast";
      else cloudTheme = "cloudy";
    }

    // Calculate Flight Rule
    let visMeters = 9999;
    if (visToken && visToken !== "CAVOK" && visToken !== "--") {
      visMeters = parseInt(visToken, 10);
    }
    let ceilFt = Infinity;
    if (ceilingText !== "-") {
      ceilFt = parseInt(ceilingText.replace(/,/g, ''), 10);
    }

    let flightRuleCode = "VFR";
    if (visMeters < 1600 || ceilFt < 500) flightRuleCode = "LIFR";
    else if (visMeters < 4800 || ceilFt < 1000) flightRuleCode = "IFR";
    else if (visMeters <= 8000 || ceilFt <= 3000) flightRuleCode = "MVFR";

    // Resolved Weather
    let resolvedWeather = "--";
    if (weatherToken && weatherToken !== "--") {
      resolvedWeather = decodeWeatherToken(weatherToken);
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(t);
    const weekday = parts.find(p => p.type === 'weekday').value.toLowerCase();
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;

    const stepHour = t.getHours();
    let tempSunText = "";
    if (stepHour === sunriseHour) {
      tempSunText = `SR ${details.sunrise}`;
    } else if (stepHour === sunsetHour) {
      tempSunText = `SS ${details.sunset}`;
    }

    const weatherTextLabel = getWeatherTextLabel(resolvedWeather, cloudText);
    const weatherIcon = getWeatherIcon(resolvedWeather, cloudTheme);

    return {
      weekday,
      timeLabel: `${hour}:${minute}`,
      tempoActive,
      tempoProb,
      flightRuleCode,
      weatherIcon,
      weatherTextLabel,
      visibilityText,
      ceilingText,
      windDir,
      windSpd,
      windGust,
      tempSunText
    };
  });
}

export default function DetailedTaf({ airport, tafText, activeWeather, onClose }) {
  if (!tafText) return null;

  const icao = (airport?.icao || activeWeather?.station || "VOMM").toUpperCase();
  const details = AIRPORT_METADATA[icao] || AIRPORT_METADATA.VOMM;

  const baseDateStr = activeWeather?.datetime || "";

  // Generate timeline data
  const timeline = generateHourlyTimeline(tafText, baseDateStr, details);

  // Format observation date string
  let observationTimeStr = "";
  let validityPeriodStr = "";

  if (activeWeather && activeWeather.datetime) {
    const baseDate = parseCustomDate(activeWeather.datetime);
    observationTimeStr = baseDate.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ", local time";
  }

  const lines = tafText.split('\n').map(l => l.trim()).filter(Boolean);
  const baseLine = lines.find(l => l.startsWith('TAF'));
  if (baseLine) {
    const tokens = baseLine.split(/\s+/);
    const valToken = tokens.find(t => /^\d{4}\/\d{4}$/.test(t)) || tokens[3];
    if (valToken) {
      const parsedPeriod = parseTafPeriod(valToken, baseDateStr);
      if (parsedPeriod) {
        const formatString = (d) => {
          return d.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        };
        validityPeriodStr = `Valid from ${formatString(parsedPeriod.startDate)} to ${formatString(parsedPeriod.endDate)}, local time`;
      }
    }
  }

  return (
    <div className="detailed-taf-modal-overlay" onClick={onClose}>
      <div className="detailed-taf-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        <header className="detailed-taf-modal-header">
          <h3 className="detailed-taf-modal-title">Detailed TAF Analysis</h3>
          <button className="detailed-taf-modal-close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="detailed-taf-container">
          <div className="detailed-taf-info-card glass-panel">
            <div className="detailed-taf-info-icon">
              <PlaneOutline />
            </div>
            <div className="detailed-taf-info-content">
              <h4 className="detailed-taf-title">TAF {details.name}</h4>
              <p className="detailed-taf-description">
                {details.name} is a large airport in {details.state}, {details.country}. The airport is located at latitude {details.lat} and longitude {details.lon}. The airport has {details.runways}. The ICAO airport code of this field is <strong>{icao}</strong>. The airport's IATA code is <strong>{details.iata}</strong>. The airport is in the {details.fir}.
              </p>
              {observationTimeStr && validityPeriodStr && (
                <p className="detailed-taf-observation-meta">
                  This aviation weather observation was made for {details.name} on {observationTimeStr}. {validityPeriodStr}.
                </p>
              )}
            </div>
          </div>

          {/* Forecast Table */}
          {timeline.length > 0 && (
            <div className="detailed-taf-forecast-section">
              <h5 className="detailed-taf-forecast-title">Forecast</h5>
              <div className="detailed-taf-table-scroll">
                <table className="detailed-taf-table">
                  <thead>
                    <tr>
                      <th className="sticky-col-header">Time</th>
                      {timeline.map((item, idx) => (
                        <th key={idx}>
                          <div className="taf-table-time-wrap">
                            <span className="taf-table-weekday">{item.weekday}</span>
                            <span className="taf-table-hour">{item.timeLabel}</span>
                            {item.tempoActive && (
                              <span className="taf-table-tempo-prob">{item.tempoProb}</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sticky-col">Code</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          <span className={`rule-badge rule-badge--${item.flightRuleCode.toLowerCase()}`}>
                            {item.flightRuleCode}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Weather</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          <div className="taf-table-weather-cell">
                            <span className="taf-table-weather-icon">{item.weatherIcon}</span>
                            <span className="taf-table-weather-text">{item.weatherTextLabel}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Visibility</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>{item.visibilityText}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Ceiling</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>{item.ceilingText}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Wind</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          {item.windDir !== null ? (
                            <div className="taf-table-wind-cell">
                              <span
                                className="taf-table-wind-arrow"
                                style={{ transform: `rotate(${(item.windDir === 'VRB' ? 0 : item.windDir + 180) % 360}deg)` }}
                              >
                                <WindArrow />
                              </span>
                              <span>{item.windDir === 'VRB' ? 'VRB' : `${item.windDir}°`}</span>
                            </div>
                          ) : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Speed</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          {item.windSpd !== null ? `${item.windSpd} kt` : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Gusts</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          {item.windGust !== null ? `${item.windGust} kt` : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="sticky-col">Temp/Sun</td>
                      {timeline.map((item, idx) => (
                        <td key={idx}>
                          {item.tempSunText ? (
                            <span className="taf-table-tempsun-text">{item.tempSunText}</span>
                          ) : "-"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="detailed-taf-daylight-section glass-panel">
            <div className="detailed-taf-daylight-icon">
              <SunOutline />
            </div>
            <div className="detailed-taf-daylight-content">
              <h5 className="detailed-taf-daylight-title">Daylight period</h5>
              <p className="detailed-taf-daylight-text">
                Today the sun rises at <strong>{details.sunrise}</strong> and sets at <strong>{details.sunset}</strong>. This applies to {details.name}, the universal daylight period may be different. The difference between the local time and UTC is +5 hour 30 minutes. Daylight saving time is currently in progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
