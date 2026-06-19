import React from "react";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="imd-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-brand">
            <img src="/IMD.jpg" alt="IMD Logo" className="footer-logo" />
            <div>
              <h3 className="footer-brand-title">भारत मौसम विज्ञान विभाग</h3>
              <h4 className="footer-brand-subtitle">Meteorological Watch Office</h4>
            </div>
          </div>
        </div>
        <div className="footer-right">
          <p className="address-text">
            मौसम भवन, लोधी रोड, नई दिल्ली - 110003 | Mausam Bhawan, Lodi Road, New Delhi - 110003
          </p>
          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-label">Phone:</span>
              <span className="contact-value">+91 11 2434 4599 / 4522</span>
            </div>
            <span className="contact-separator">|</span>
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">contact.imd@imd.gov.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="footer-bottom-bar">
        <div className="bottom-bar-content">
          <span className="copyright-text">
            Copyright © {currentYear} Meteorological Watch Office. All Rights Reserved.
          </span>
          <span className="disclaimer-text">
            Website content is managed by Meteorological Watch Office, Ministry of Earth Sciences.
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
