import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', name: 'Home', preloadKey: 'home' },
    { path: '/10-commandments', name: '10 Commandments', preloadKey: '10-commandments' },
    { path: '/scripture-lookup', name: 'Scripture Lookup', preloadKey: 'scripture-lookup' },
    { path: '/bible-reading', name: 'Bible Reading', preloadKey: 'bible-reading' },
    { path: '/facts', name: 'Facts', preloadKey: 'facts' },
    { path: '/chatbot', name: 'AI Chatbot', preloadKey: 'chatbot' }
  ];

  // Hover preloading disabled to prevent rate limiting

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src="/dove.svg" alt="Dove" style={{width: '32px', height: '32px', marginRight: '8px'}} />
          Bible Website
        </Link>
        
        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <a 
            href={import.meta.env.VITE_PAYPAL_DONATION_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link donation-link"
            style={{
              backgroundColor: '#0070ba',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}
          >
            💝 Donate
          </a>
        </div>

        <div className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
