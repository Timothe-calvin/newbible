// Configuration Status Component
// Displays the current configuration status of all services

import React, { useState, useEffect } from 'react';
import configValidator from '../services/configValidator';
import './components.css';

function ConfigStatus({ showDetails = false }) {
  const [report, setReport] = useState(null);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  useEffect(() => {
    const generateReport = () => {
      const newReport = configValidator.generateReport();
      setReport(newReport);
    };

    generateReport();
    
    // Update report every 30 seconds
    const interval = setInterval(generateReport, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!report) {
    return <div className="text-center p-2">Loading configuration status...</div>;
  }

  const getStatusIcon = (isValid) => {
    return isValid ? '✅' : '❌';
  };

  const getStatusClass = (isValid) => {
    return isValid ? 'success' : 'error';
  };

  return (
    <div className={`config-status ${getStatusClass(report.status.overall)}`}>
      <div
        className="status-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`status-header-title ${getStatusClass(report.status.overall)}`}>
          {getStatusIcon(report.status.overall)} System Status: {report.status.overall ? 'All Services Operational' : 'Issues Detected'}
        </div>
        <div className={`arrow-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>

      {isExpanded && (
        <div className="status-details mt-2">
          {/* Service Status */}
          <div className="services-status">
            <h4>Services:</h4>
            
            <div className="mt-1">
              <div className="service-item mb-1">
                <span>PayPal Donations:</span>
                <span className={`service-status ${getStatusClass(report.services.paypal.isValid)}`}>
                  {getStatusIcon(report.services.paypal.isValid)} {report.services.paypal.message}
                </span>
              </div>
              
              <div className="service-item mb-1">
                <span>Bible API:</span>
                <span className={`service-status ${getStatusClass(report.services.bible.isValid)}`}>
                  {getStatusIcon(report.services.bible.isValid)} {report.services.bible.message}
                </span>
              </div>
              
              <div className="service-item mb-1">
                <span>OpenRouter AI:</span>
                <span className={`service-status ${getStatusClass(report.services.openRouter.isValid)}`}>
                  {getStatusIcon(report.services.openRouter.isValid)} {report.services.openRouter.message}
                </span>
              </div>
            </div>
          </div>

          {/* Missing Configuration */}
          {report.missing.length > 0 && (
            <div className="missing-config">
              <h4>Missing Configuration:</h4>
              <div className="mt-1">
                {report.missing.map((item, index) => (
                  <div key={index} className="missing-config-item">
                    <div className="service-name">
                      {item.service}
                    </div>
                    <div className="missing-vars">
                      Missing: {item.variables.join(', ')}
                    </div>
                    <div className="impact">
                      Impact: {item.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <div className="recommendations-content">
                <div className="mt-1">
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className="recommendation-item">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="timestamp">
            Last checked: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigStatus;