import React, { useState, useEffect } from 'react';
import preloadService from '../services/preloadService';

function PreloadStatus() {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = preloadService.getCacheStats();
      setStats(currentStats);
      
      // Show indicator when preloading is active
      setIsVisible(currentStats.isPreloading || currentStats.queueSize > 0);
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !stats) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 123, 255, 0.9)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      animation: stats.isPreloading ? 'pulse 2s infinite' : 'none'
    }}>
      {stats.isPreloading && (
        <div style={{
          width: '12px',
          height: '12px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      )}
      
      <span>
        {stats.isPreloading ? 'Preloading...' : `${stats.totalItems} cached`}
        {stats.queueSize > 0 && ` (${stats.queueSize} queued)`}
      </span>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default PreloadStatus;