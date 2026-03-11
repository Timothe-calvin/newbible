import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TenCommandments from './pages/TenCommandments';
import ScriptureLookup from './pages/ScriptureLookup';
import BibleReading from './pages/BibleReading';
import Facts from './pages/Facts';
import Chatbot from './pages/Chatbot';
import BiblicalHolidays from './pages/BiblicalHolidays';
import preloadService from './services/preloadService';
import PreloadStatus from './components/PreloadStatus';
import './App.css';

// Component to handle route-based preloading - CONSERVATIVE VERSION
function AppContent() {
  const location = useLocation();
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [a11ySettings, setA11ySettings] = useState(() => {
    const saved = localStorage.getItem('a11ySettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const settings = useMemo(() => (a11ySettings || {
    fontSize: 'base',
    lineHeight: 'normal',
    contrast: 'normal',
    links: 'default',
    motion: 'normal'
  }), [a11ySettings]);

  useEffect(() => {
    // Determine current page from pathname
    const currentPage = location.pathname === '/' ? 'home' : location.pathname.substring(1);
    
    // Trigger smart preloading based on current page
    setTimeout(() => {
      preloadService.smartPreload(currentPage);
    }, 500); // Wait 500ms after navigation before preloading
  }, [location]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yFont = settings.fontSize;
    root.dataset.a11ySpacing = settings.lineHeight;
    root.dataset.a11yContrast = settings.contrast;
    root.dataset.a11yLinks = settings.links;
    root.dataset.a11yMotion = settings.motion;
    localStorage.setItem('a11ySettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setA11ySettings((prev) => ({
      ...(prev || settings),
      [key]: value
    }));
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <button
        className="a11y-toggle"
        type="button"
        onClick={() => setIsA11yOpen((open) => !open)}
        aria-expanded={isA11yOpen}
        aria-controls="a11y-panel"
      >
        Accessibility
      </button>
      <aside
        className={`a11y-panel${isA11yOpen ? ' open' : ''}`}
        id="a11y-panel"
        aria-label="Accessibility options"
      >
        <div className="a11y-panel-header">
          <strong>Accessibility</strong>
          <button
            className="a11y-close"
            type="button"
            onClick={() => setIsA11yOpen(false)}
            aria-label="Close accessibility panel"
          >
            Close
          </button>
        </div>
        <label className="a11y-field">
          Font size
          <select
            value={settings.fontSize}
            onChange={(event) => updateSetting('fontSize', event.target.value)}
          >
            <option value="base">Default</option>
            <option value="lg">Large</option>
            <option value="xl">Extra large</option>
          </select>
        </label>
        <label className="a11y-field">
          Line spacing
          <select
            value={settings.lineHeight}
            onChange={(event) => updateSetting('lineHeight', event.target.value)}
          >
            <option value="normal">Default</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </label>
        <label className="a11y-check">
          <input
            type="checkbox"
            checked={settings.contrast === 'high'}
            onChange={(event) => updateSetting('contrast', event.target.checked ? 'high' : 'normal')}
          />
          High contrast
        </label>
        <label className="a11y-check">
          <input
            type="checkbox"
            checked={settings.links === 'underline'}
            onChange={(event) => updateSetting('links', event.target.checked ? 'underline' : 'default')}
          />
          Underline links
        </label>
        <label className="a11y-check">
          <input
            type="checkbox"
            checked={settings.motion === 'reduce'}
            onChange={(event) => updateSetting('motion', event.target.checked ? 'reduce' : 'normal')}
          />
          Reduce motion
        </label>
      </aside>
      <Navbar />
      <main className="main-content" id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/10-commandments" element={<TenCommandments />} />
          <Route path="/scripture-lookup" element={<ScriptureLookup />} />
          <Route path="/bible-reading" element={<BibleReading />} />
          <Route path="/biblical-holidays" element={<BiblicalHolidays />} />
          <Route path="/facts" element={<Facts />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </main>
      <PreloadStatus />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
