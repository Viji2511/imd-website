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
    rawCode: metarStr,
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

const server = http.createServer((req, res) => {
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
