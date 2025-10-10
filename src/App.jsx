import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TenCommandments from './pages/TenCommandments';
import ScriptureLookup from './pages/ScriptureLookup';
import BibleReading from './pages/BibleReading';
import Facts from './pages/Facts';
import Chatbot from './pages/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
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
      </div>
    </Router>
  );
}

export default App;
