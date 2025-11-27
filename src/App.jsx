import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TenCommandments from './pages/TenCommandments';
import ScriptureLookup from './pages/ScriptureLookup';
import BibleReading from './pages/BibleReading';
import Facts from './pages/Facts';
import Chatbot from './pages/Chatbot';
import preloadService from './services/preloadService';
import PreloadStatus from './components/PreloadStatus';
import './App.css';

// Component to handle route-based preloading - CONSERVATIVE VERSION
function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Determine current page from pathname
    const currentPage = location.pathname === '/' ? 'home' : location.pathname.substring(1);
    
    // Trigger smart preloading based on current page
    setTimeout(() => {
      preloadService.smartPreload(currentPage);
    }, 500); // Wait 500ms after navigation before preloading
  }, [location]);

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/10-commandments" element={<TenCommandments />} />
          <Route path="/scripture-lookup" element={<ScriptureLookup />} />
          <Route path="/bible-reading" element={<BibleReading />} />
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
