import React, { useState } from "react";
import "./Header.css";

function Header({ airports = [], selectedAirport, onSelectAirport, onShowMetar, onShowTaf, history = [], activeWeather, onSelectHistory, isModalOpen }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Find matching airport by ICAO code, city, or name
    const query = searchQuery.toLowerCase().trim();
    const match = airports.find(
      (ap) =>
        ap.icao.toLowerCase() === query ||
        ap.city.toLowerCase().includes(query) ||
        ap.name.toLowerCase().includes(query)
    );

    if (match) {
      onSelectAirport(match.icao);
      setSearchQuery("");
    } else {
      alert(`No station found matching "${searchQuery}". Try "VOMM", "Chennai", "Madurai", etc.`);
    }
  };

  return (
    <header className={`imd-header ${isModalOpen ? 'header-behind' : ''}`}>

      {/* 2. MAIN BRANDING BANNER */}
      <div className="main-branding-banner">
        <div className="banner-content">
          {/* Left: IMD Logo & Title */}
          <div className="branding-left">
            <div className="logo-container">
              <img src="/IMD.jpg" alt="IMD Official Logo" className="header-logo" />
            </div>
            <div className="title-container">
              <span className="govt-text">Government of India</span>
              <h1 className="dept-title-en" style={{ fontSize: "1.45rem", margin: "2px 0 4px 0" }}>Meteorological Watch Office</h1>
              <span className="ministry-text">Ministry of Earth Sciences</span>
            </div>
          </div>

          {/* Center: Live Station Search & Report History */}
          <div className="branding-center">
            <div style={{ position: 'relative', flex: 1 }}>
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  className="header-search-input"
                  placeholder="Search station (e.g. Chennai, VOMM)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
                <button type="submit" className="header-search-button" aria-label="Search">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
              {isOpen && (
                <div className="search-dropdown-menu">
                  {(() => {
                    const query = searchQuery.toLowerCase().trim();
                    const filtered = airports.filter((ap) => {
                      if (!query) return true;
                      return (
                        ap.icao.toLowerCase().includes(query) ||
                        ap.city.toLowerCase().includes(query) ||
                        ap.name.toLowerCase().includes(query)
                      );
                    });

                    if (filtered.length > 0) {
                      return filtered.map((ap) => (
                        <div
                          key={ap.icao}
                          className={`search-dropdown-item ${ap.icao === selectedAirport ? 'active' : ''}`}
                          onMouseDown={() => {
                            onSelectAirport(ap.icao);
                            setSearchQuery("");
                            setIsOpen(false);
                          }}
                        >
                          <span className="dropdown-item-icao">{ap.icao}</span>
                          <span className="dropdown-item-details">{ap.city} - {ap.name}</span>
                        </div>
                      ));
                    } else {
                      return <div className="search-dropdown-no-results">No stations found</div>;
                    }
                  })()}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="header-history-container" style={{ flexShrink: 0 }}>
                <select
                  value={activeWeather ? activeWeather.datetime : ""}
                  onChange={(e) => onSelectHistory(e.target.value)}
                  className="header-history-dropdown"
                >
                  {history.map((hist, idx) => (
                    <option key={idx} value={hist.datetime} style={{ background: '#ffffff', color: '#1e293b' }}>
                      {hist.timeLabel}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. COLORFUL ACTION GRID */}
      <div className="colorful-tab-grid">
        <div className="tab-item metar-tab" onClick={onShowMetar} style={{ cursor: 'pointer' }}>
          <div className="tab-title">METAR</div>
          <div className="tab-subtitle" style={{ fontSize: '0.72rem', opacity: 0.9 }}>Meteorological Aerodrome Report</div>
        </div>
        <div className="tab-item taf-tab" onClick={onShowTaf} style={{ cursor: 'pointer' }}>
          <div className="tab-title">TAF</div>
          <div className="tab-subtitle" style={{ fontSize: '0.72rem', opacity: 0.9 }}>Terminal Aerodrome Forecast</div>
        </div>
      </div>
    </header>
  );
}

export default Header;
