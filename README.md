# IMD Weather Dashboard Portal

A full-stack web application prototype for the **India Meteorological Department (IMD)**, designed to parse and visualize airport meteorological data (METAR) and runway wind statistics for regional airports.

## 🚀 Features

*   **Airport Stations Selector:** Supports Chennai (VOMM), Coimbatore (VOCB), Madurai (VOMD), Salem (VOSM), Tuticorin (VOTK), and Tiruchirappalli (VOTR).
*   **METAR Decoder:** Decodes and displays real-time weather information, including flight rules (VFR, MVFR, IFR, LIFR), temperature, visibility, pressure, wind, and cloud coverage.
*   **Visual Instruments:**
    *   🧭 **Runway Wind Compass:** Displays wind direction relative to runways and computes active runway directions.
    *   💨 **Wind Speed Gauge:** Animated representation of steady wind speeds.
    *   ☁️ **Cloud Altitude Meter:** Visual representation of cloud layers and altitudes.
    *   ☀️ **Daylight Indicator:** Displays standard day-night cycles.
*   **Historical Trends:** Interactive sparklines mapping changes in temperature, visibility, wind speed, and pressure over the last 7 reports.
*   **Live Weather Feeds:** Embeds live radar imagery (mapping Chennai, Coimbatore, Madurai, Salem, Tuticorin, and Trichy radar systems) and satellite feeds directly from IMD's official portal.

---

## 🛠️ Architecture

*   **Backend:** Pure Node.js server (`app.js`) listening on port `5001` (or dynamic environment port). It parses local CSV databases containing historical observations (`VOMM.csv`) and runway wind readings.
*   **Frontend:** React + Vite SPA located in `frontend/frontend` utilizing standard HTTP fetches and responsive CSS glassmorphism styling.

---

## 💻 How to Run Locally

### 1. Run the Backend
The backend utilizes standard Node.js libraries and requires no package installation.
```bash
# Navigate to project root and run:
node app.js
```
The server will start listening on port `5001`.

### 2. Run the Frontend
```bash
# Navigate to the active frontend folder:
cd frontend/frontend

# Install dependencies:
npm install

# Run the dev server:
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 How to Deploy (Free Tier)

### 1. Backend on Render
1. Create a free account on [Render](https://render.com/).
2. Create a **New Web Service** linked to your GitHub repository.
3. Configure settings:
   * **Language:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node app.js`
   * **Instance Type:** `Free`
4. Copy the public Render service URL once deployed.

### 2. Frontend on Vercel
1. Create a free account on [Vercel](https://vercel.com/).
2. Create a new project and import your GitHub repository.
3. Configure settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** **`frontend/frontend`**
   * **Environment Variables:** Add `VITE_API_URL` with your Render backend URL.
4. Click **Deploy**.