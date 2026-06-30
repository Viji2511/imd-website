# IMD Weather Dashboard Portal

A full-stack web application prototype for the **India Meteorological Department (IMD)**, designed to parse and visualize airport meteorological data (METAR) and runway wind statistics for regional airports in Tamil Nadu.

---

## 🚀 Features

*   **Airport Stations Selector:** Autocomplete search and display for Chennai (VOMM), Coimbatore (VOCB), Madurai (VOMD), Salem (VOSM), Tuticorin (VOTK), and Tiruchirappalli (VOTR).
*   **METAR Decoder:** Decodes raw METAR observations dynamically, displaying temperature, dew point, wind vectors, visibility, QNH pressure, and cloud levels.
*   **Aviation Category Engine:** Dynamically calculates VFR, MVFR, IFR, and LIFR categories based on visibility and ceiling.
*   **Visual Instruments:**
    *   🧭 **Runway Wind Compass Modal:** Displays rotating compass dial indicating wind vectors relative to runway headings.
    *   💨 **Wind Speed Gauge:** Animated representation of steady wind speeds.
    *   ☁️ **Cloud Altitude Meter:** Stack-bar visualization of active cloud coverage layers (FEW, SCT, BKN, OVC).
*   **Historical Trend Sparklines:** Plots 24-report trends using Recharts for temperature, dew point, pressure, visibility, and wind.
*   **Live Feeds:** Live radar scans and satellite maps fetched directly from the official IMD servers (`mausam.imd.gov.in`).

---

## 🛠️ Architecture

*   **Backend Server:** Lightweight Node.js server (`app.js`) running on port `5001`. It parses meteorological CSV logs on the server side and serves them as JSON endpoints.
*   **Frontend Client:** React + Vite SPA (`frontend/frontend/`) styled with responsive CSS glassmorphism.

---

## 💻 How to Run Locally

### 📋 Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version **18.x** or higher recommended)
*   [npm](https://www.npmjs.com/) (installed automatically with Node.js)

---

### Step 1: Start the Backend Server

The backend runs on core Node.js modules and does not require external third-party dependencies.

1. Open your terminal at the **project root folder** (`demoweather3_metartaf_live`).
2. Start the backend server:
   ```bash
   node app.js
   ```
   *Alternative npm start script (if configured):*
   ```bash
   npm start
   ```
3. The terminal will output:
   `Weather backend server listening on port 5001`

To verify the backend is running, open [http://localhost:5001/api/airports](http://localhost:5001/api/airports) in your browser. You should see a JSON list of airports.

---

### Step 2: Set Up and Start the Frontend Client

The frontend is a React application built with Vite and utilizes Recharts for graphing.

1. Open a **new terminal window** (keep the backend server running).
2. Navigate to the active frontend project folder:
   ```bash
   cd frontend/frontend
   ```
3. Install the required npm packages:
   ```bash
   npm install
   ```
   *Note: If `recharts` is not automatically installed by the package lock, install it manually:*
   ```bash
   npm install recharts
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. The terminal will output the local network URL, typically:
   `  Local:   http://localhost:5173/`

6. Open [http://localhost:5173/](http://localhost:5173/) in your web browser to view the live dashboard.

---

## 📂 Project Directory Structure

```text
demoweather3_metartaf_live/
│
├── app.js                 # Backend Node.js entry point (Port 5001)
├── VOMM.csv               # Chennai METAR logs (used as simulation baseline)
├── package.json           # Backend package configuration
│
├── data/                  # Backend runway wind sensor files
│   ├── Runway1WSWDInstData.csv
│   └── Runway4WSWDInstData.csv
│
└── frontend/
    └── frontend/          # React + Vite Client Project
        ├── package.json   # Frontend dependencies (React, Recharts, Vite)
        ├── vite.config.js # Vite configuration
        ├── public/        # Static frontend assets
        │   ├── IMD.jpg    # IMD header logo
        │   └── data/
        │       └── aws.json # Local AWS Stations data
        └── src/           # React Source Code
            ├── main.jsx   # Client entry point
            ├── App.jsx    # Primary Dashboard shell
            ├── App.css    # Responsive Glassmorphic styles
            ├── Compass.jsx # SVG Runway Wind Compass
            ├── DetailedTaf.jsx # Decode view for forecasts
            └── Header.jsx # Top navigation, search, and history selector
```

---

## 🔧 Troubleshooting

### 1. Address already in use (`EADDRINUSE`)
If you see an error indicating port `5001` is already in use:
*   **Windows:** Run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess -Force` in PowerShell, then restart `node app.js`.
*   **Mac/Linux:** Run `kill -9 $(lsof -t -i:5001)` in terminal.
*   Alternatively, set a custom port by running:
    ```bash
    $env:PORT="5002"; node app.js  # Windows PowerShell
    PORT=5002 node app.js          # Mac/Linux
    ```

### 2. CORS Errors in the Browser Console
Ensure the backend server is running on port `5001`. The React frontend is configured to target `http://localhost:5001` by default. If the backend is on a different port, set the environment variable `VITE_API_URL` during frontend startup.

### 3. Recharts module not found
If charts fail to render, run the following command in `frontend/frontend/` to ensure the chart visualization library is installed:
```bash
npm install recharts
```
