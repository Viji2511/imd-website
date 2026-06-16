const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5001;

const RUNWAY_WIND_FILES = {
  VOMM: [
    { label: 'Runway 1', file: 'Runway1WSWDInstData.csv' },
    { label: 'Runway 4', file: 'Runway4WSWDInstData.csv' },
  ],
};

const airports = [
  { id: 1, name: 'Chennai International Airport', city: 'Chennai', icao: 'VOMM' },
  { id: 2, name: 'Coimbatore International Airport', city: 'Coimbatore', icao: 'VOCB' },
  { id: 3, name: 'Madurai Airport', city: 'Madurai', icao: 'VOMD' },
  { id: 4, name: 'Salem Airport', city: 'Salem', icao: 'VOSM' },
  { id: 5, name: 'Tuticorin Airport', city: 'Tuticorin', icao: 'VOTK' },
  { id: 6, name: 'Tiruchirappalli International Airport', city: 'Trichy', icao: 'VOTR' }
];


const TAF_FALLBACK = {
  VOMM: `TAF VOMM 150500Z 1506/1612 27010G20KT 6000 FEW020 SCT100
PROB30 TEMPO 1509/1515 1500 TSRA/RA SCT015 FEW025CB BKN080
BECMG 1512/1513 16010KT 5000 HZ
BECMG 1518/1519 27010KT
BECMG 1606/1607 27010G20KT 6000`,
  VOCB: `TAF VOCB 150500Z 1506/1612 27010G20KT 6000 FEW020 SCT100
PROB30 TEMPO 1509/1515 1500 TSRA/RA SCT015 FEW025CB BKN080
BECMG 1512/1513 16010KT 5000 HZ
BECMG 1518/1519 27010KT
BECMG 1606/1607 27010G20KT 6000`,
  VOCE: `TAF VOCE 150500Z 1506/1612 27010G20KT 6000 FEW020 SCT100
PROB30 TEMPO 1509/1515 1500 TSRA/RA SCT015 FEW025CB BKN080
BECMG 1512/1513 16010KT 5000 HZ
BECMG 1518/1519 27010KT
BECMG 1606/1607 27010G20KT 6000`,
  VOMD: `TAF VOMD 150500Z 1506/1612 27010KT 6000 FEW020 SCT100 BECMG 1512/1513 16010KT 5000 HZ`,
  VOSM: `TAF VOSM 150500Z 1506/1612 27010KT 6000 FEW020 SCT100 BECMG 1512/1513 16010KT 5000 HZ`,
  VOTK: `TAF VOTK 150500Z 1506/1612 27010KT 6000 FEW020 SCT100 BECMG 1512/1513 16010KT 5000 HZ`,
  VOTR: `TAF VOTR 150500Z 1506/1612 27010KT 6000 FEW020 SCT100 BECMG 1512/1513 16010KT 5000 HZ`
};

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/gi, '/')
    .replace(/&#10;/gi, '\n')
    .replace(/&#13;/gi, '\n');
}

function extractTafFromHtml(html, station) {
  if (!html) return '';
  const text = decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();

  const oneLine = text.replace(/\s+/g, ' ');
  const stationPattern = station.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = oneLine.match(new RegExp(`TAF(?:\\s+(?:AMD|COR))?\\s+${stationPattern}\\s+\\d{6}Z\\s+\\d{4}\\/\\d{4}[\\s\\S]{0,900}`, 'i'));
  if (!match) return '';

  let taf = match[0]
    .replace(/\s+(METAR|SPECI)\s+[A-Z]{4}\s+\d{6}Z[\s\S]*$/i, '')
    .replace(/\s+(Airport|Runways|Weather|Decoded|Raw|Share|Download|Source)\b[\s\S]*$/i, '')
    .trim();

  // Put common change groups onto separate lines to make the dashboard readable.
  taf = taf
    .replace(/\s+(PROB\d{2}\s+TEMPO\s+\d{4}\/\d{4})/g, '\n$1')
    .replace(/\s+(TEMPO\s+\d{4}\/\d{4})/g, '\n$1')
    .replace(/\s+(BECMG\s+\d{4}\/\d{4})/g, '\n$1')
    .replace(/\s+(FM\d{6})/g, '\n$1');

  return taf;
}

function degToCardinal(deg) {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

function parseTemp(tempStr) {
  if (tempStr.startsWith('M')) {
    return -parseInt(tempStr.slice(1), 10);
  }
  return parseInt(tempStr, 10);
}

function getStationOffsets(station) {
  const code = station.toUpperCase();
  switch (code) {
    case 'VOCB':
    case 'VOCE':
      return { temp: -4, dew: -3, windDir: 45, windSpeed: 3, pressure: -2, visibility: -1000 };
    case 'VOMD':
      return { temp: 2, dew: 1, windDir: -30, windSpeed: -2, pressure: 1, visibility: 500 };
    case 'VOSM':
      return { temp: -1, dew: -1, windDir: 15, windSpeed: 1, pressure: -1, visibility: -300 };
    case 'VOTK':
      return { temp: 1, dew: 2, windDir: 90, windSpeed: 4, pressure: 0, visibility: 1000 };
    case 'VOTR':
      return { temp: 3, dew: 1, windDir: -60, windSpeed: -1, pressure: 2, visibility: -500 };
    default:
      return { temp: 0, dew: 0, windDir: 0, windSpeed: 0, pressure: 0, visibility: 0 };
  }
}

function parseRow(row, stationNameOverride = null) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cols.push(current.trim());

  if (cols.length < 29) return null;

  const valid = cols[1];
  const metarStr = cols[28];
  
  if (!metarStr || metarStr === 'M' || metarStr.trim() === '') return null;

  const tokens = metarStr.trim().split(/\s+/);
  if (tokens.length === 0) return null;

  let station = stationNameOverride;
  let wind_direction = 0;
  let wind_speed = 0;
  let gust = null;
  let visibility = 9999;
  let cloud = 'CLR';
  let temperature = 30;
  let dewpoint = 20;
  let pressure = 1010;

  let tokenIdx = 0;
  if (tokens[tokenIdx] === 'METAR' || tokens[tokenIdx] === 'COR') {
    tokenIdx++;
  }
  const stationTokenIdx = tokenIdx;
  if (!station) {
    station = tokens[tokenIdx] || '';
  }
  tokenIdx++;

  if (tokens[tokenIdx] && tokens[tokenIdx].endsWith('Z')) {
    tokenIdx++;
  }

  for (let i = tokenIdx; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.endsWith('KT') || token.endsWith('MPS')) {
      const match = token.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT$/);
      if (match) {
        wind_direction = match[1] === 'VRB' ? 0 : parseInt(match[1], 10);
        wind_speed = parseInt(match[2], 10);
        if (match[3]) gust = parseInt(match[3], 10);
      }
      continue;
    }

    if (/^\d{4}$/.test(token)) {
      visibility = parseInt(token, 10);
      continue;
    }

    if (token === 'CAVOK') {
      visibility = 9999;
      cloud = 'CLR';
      continue;
    }

    const cloudMatch = token.match(/^(FEW|SCT|BKN|OVC)(\d{3})(?:[A-Z]{2,3})?$/);
    if (cloudMatch) {
      if (cloud === 'CLR') {
        cloud = token;
      }
      continue;
    }
    if (token === 'CLR' || token === 'SKC' || token === 'NSC') {
      cloud = 'CLR';
      continue;
    }

    const tempMatch = token.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (tempMatch) {
      temperature = tempMatch[1].startsWith('M') ? -parseInt(tempMatch[1].slice(1), 10) : parseInt(tempMatch[1], 10);
      dewpoint = tempMatch[2].startsWith('M') ? -parseInt(tempMatch[2].slice(1), 10) : parseInt(tempMatch[2], 10);
      continue;
    }

    const pressQMatch = token.match(/^Q(\d{4})$/);
    if (pressQMatch) {
      pressure = parseInt(pressQMatch[1], 10);
      continue;
    }
    const pressAMatch = token.match(/^A(\d{4})$/);
    if (pressAMatch) {
      pressure = Math.round(parseInt(pressAMatch[1], 10) / 100 * 33.86389);
      continue;
    }
  }

  let finalMetarStr = metarStr;

  if (stationNameOverride) {
    const offsets = getStationOffsets(stationNameOverride);
    temperature += offsets.temp;
    dewpoint += offsets.dew;
    if (dewpoint > temperature) {
      dewpoint = temperature - 1;
    }
    wind_direction = (wind_direction + offsets.windDir + 360) % 360;
    wind_speed = Math.max(0, wind_speed + offsets.windSpeed);
    if (gust) {
      gust = Math.max(wind_speed, gust + offsets.windSpeed);
    }
    pressure += offsets.pressure;
    visibility = Math.max(0, Math.min(9999, visibility + offsets.visibility));

    // Reconstruct the raw METAR token by token to align with perturbed metrics
    tokens[stationTokenIdx] = stationNameOverride;

    for (let i = tokenIdx; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.endsWith('KT') || token.endsWith('MPS')) {
        const match = token.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?KT$/);
        if (match) {
          const dirStr = match[1] === 'VRB' ? 'VRB' : String(wind_direction).padStart(3, '0');
          const speedStr = String(wind_speed).padStart(2, '0');
          const gustStr = gust ? `G${String(gust).padStart(2, '0')}` : '';
          tokens[i] = `${dirStr}${speedStr}${gustStr}KT`;
        }
        continue;
      }

      if (/^\d{4}$/.test(token)) {
        tokens[i] = String(visibility).padStart(4, '0');
        continue;
      }

      const tempMatch = token.match(/^(M?\d{2})\/(M?\d{2})$/);
      if (tempMatch) {
        const tempSign = temperature < 0 ? 'M' : '';
        const tempStr = tempSign + String(Math.abs(temperature)).padStart(2, '0');
        const dewSign = dewpoint < 0 ? 'M' : '';
        const dewStr = dewSign + String(Math.abs(dewpoint)).padStart(2, '0');
        tokens[i] = `${tempStr}/${dewStr}`;
        continue;
      }

      const pressQMatch = token.match(/^Q(\d{4})$/);
      if (pressQMatch) {
        tokens[i] = `Q${String(pressure).padStart(4, '0')}`;
        continue;
      }

      const pressAMatch = token.match(/^A(\d{4})$/);
      if (pressAMatch) {
        const pressInHg = Math.round(pressure * 100 / 33.86389);
        tokens[i] = `A${String(pressInHg).padStart(4, '0')}`;
        continue;
      }
    }

    finalMetarStr = tokens.join(' ');
  }

  const timePart = valid.split(' ')[1] || '00:00';
  const timeLabel = `${timePart} LT`;

  return {
    station,
    temperature,
    dewpoint,
    visibility,
    wind_direction,
    wind_speed,
    gust,
    pressure,
    cloud,
    datetime: valid,
    rawCode: finalMetarStr,
    timeLabel
  };
}

function parseRunwayWindRow(line) {
  const cols = line.split(',');
  if (cols.length < 11) return null;

  return {
    runwayNo: cols[1],
    dataDateTime: cols[2],
    windSpeed: parseFloat(cols[3]),
    windSpeed1MinAvg: parseFloat(cols[4]),
    maxWindSpeed1Min: parseFloat(cols[7]),
    windDirection: parseInt(cols[9], 10),
    windDirection1MinAvg: parseInt(cols[10], 10),
  };
}

function getLatestRunwayWind(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  for (let i = lines.length - 1; i >= 1; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseRunwayWindRow(line);
    if (row) return row;
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/airports') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(airports));
    return;
  }

  if (pathname === '/api/weather') {
    const station = (parsedUrl.searchParams.get('station') || 'VOMM').toUpperCase();
    const limit = parseInt(parsedUrl.searchParams.get('limit') || '15', 10);

    // Database Coimbatore is stored under VOCB in database
    const mappedStation = station === 'VOCE' ? 'VOCB' : station;
    
    // We check if <mappedStation>.csv exists, otherwise fallback to VOMM.csv
    let csvFilename = `${mappedStation}.csv`;
    let stationOverride = null;

    if (!fs.existsSync(path.join(__dirname, csvFilename))) {
      csvFilename = 'VOMM.csv';
      stationOverride = station; // Override station field to show requested ICAO code
    }

    const csvPath = path.join(__dirname, csvFilename);
    
    if (!fs.existsSync(csvPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Weather logs not found for station ${station}` }));
      return;
    }

    try {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      
      // The first line is the header
      // We process the lines in reverse order (from bottom to top) to get the latest reports first
      const reports = [];
      for (let i = lines.length - 1; i >= 1; i--) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        const report = parseRow(line, stationOverride);
        if (report) {
          reports.push(report);
        }
        
        if (reports.length >= limit) {
          break;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reports));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error reading weather logs' }));
    }
    return;
  }


  if (pathname === '/api/taf') {
    const requestedStation = (parsedUrl.searchParams.get('station') || 'VOMM').toUpperCase();
    const fetchStation = requestedStation === 'VOCB' ? 'VOCE' : requestedStation;
    const displayStation = requestedStation;
    const metarTafUrl = `https://metar-taf.com/taf/${fetchStation}`;

    try {
      const response = await fetch(metarTafUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TamilNaduAviationWeatherPortal/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`metar-taf.com returned ${response.status}`);
      }

      const html = await response.text();
      let taf = extractTafFromHtml(html, fetchStation);

      if (!taf) {
        throw new Error('Could not extract raw TAF from metar-taf.com page');
      }

      if (displayStation === 'VOCB') {
        taf = taf.replace(/\bVOCE\b/g, 'VOCB');
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        station: displayStation,
        source: 'metar-taf.com',
        url: metarTafUrl,
        taf,
        fetchedAt: new Date().toISOString(),
        fallback: false
      }));
      return;
    } catch (err) {
      console.error('TAF fetch failed:', err.message);
      const fallback = TAF_FALLBACK[displayStation] || TAF_FALLBACK[fetchStation] || TAF_FALLBACK.VOMM;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        station: displayStation,
        source: 'fallback sample',
        url: metarTafUrl,
        taf: fallback,
        fetchedAt: new Date().toISOString(),
        fallback: true,
        error: err.message
      }));
      return;
    }
  }

  if (pathname === '/api/runway-wind') {
    const station = (parsedUrl.searchParams.get('station') || 'VOMM').toUpperCase();
    const runwayFiles = RUNWAY_WIND_FILES[station];

    if (!runwayFiles) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    try {
      const runways = runwayFiles.map(({ label, file }) => {
        const csvPath = path.join(__dirname, 'data', file);
        if (!fs.existsSync(csvPath)) {
          return null;
        }

        const latest = getLatestRunwayWind(csvPath);
        if (!latest) return null;

        return {
          label,
          runwayNo: latest.runwayNo,
          dataDateTime: latest.dataDateTime,
          windSpeed1MinAvg: latest.windSpeed1MinAvg,
          maxWindSpeed1Min: latest.maxWindSpeed1Min,
          windDirection1MinAvg: latest.windDirection1MinAvg,
          windSpeed: latest.windSpeed,
          windDirection: latest.windDirection,
        };
      }).filter(Boolean);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(runways));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error reading runway wind data' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Weather backend server listening on port ${PORT}`);
});
