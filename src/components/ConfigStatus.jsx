// Configuration Status Component
// Displays the current configuration status of all services

import React, { useState, useEffect } from 'react';
import configValidator from '../services/configValidator';

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
    return <div>Loading configuration status...</div>;
  }

  const getStatusIcon = (isValid) => {
    return isValid ? '✅' : '❌';
  };

  const getStatusColor = (isValid) => {
    return isValid ? '#27ae60' : '#e74c3c';
  };

  return (
    <div className="config-status" style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: `1px solid ${report.status.overall ? '#27ae60' : '#e74c3c'}`,
      fontSize: '14px'
    }}>
      <div 
        className="status-header" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{
          fontWeight: 'bold',
          color: getStatusColor(report.status.overall)
        }}>
          {getStatusIcon(report.status.overall)} System Status: {report.status.overall ? 'All Services Operational' : 'Issues Detected'}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#666',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s'
        }}>
          ▼
        </div>
      </div>

      {isExpanded && (
        <div className="status-details" style={{marginTop: '15px'}}>
          {/* Service Status */}
          <div className="services-status" style={{marginBottom: '15px'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#2c3e50'}}>Services:</h4>
            
            <div style={{display: 'grid', gap: '8px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>PayPal Donations:</span>
                <span style={{color: getStatusColor(report.services.paypal.isValid)}}>
                  {getStatusIcon(report.services.paypal.isValid)} {report.services.paypal.message}
                </span>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>Bible API:</span>
                <span style={{color: getStatusColor(report.services.bible.isValid)}}>
                  {getStatusIcon(report.services.bible.isValid)} {report.services.bible.message}
                </span>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>OpenRouter AI:</span>
                <span style={{color: getStatusColor(report.services.openRouter.isValid)}}>
                  {getStatusIcon(report.services.openRouter.isValid)} {report.services.openRouter.message}
                </span>
              </div>
            </div>
          </div>

          {/* Missing Configuration */}
          {report.missing.length > 0 && (
            <div className="missing-config" style={{marginBottom: '15px'}}>
              <h4 style={{margin: '0 0 10px 0', color: '#e74c3c'}}>Missing Configuration:</h4>
              {report.missing.map((item, index) => (
                <div key={index} style={{
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{fontWeight: 'bold', color: '#856404'}}>
                    {item.service}
                  </div>
                  <div style={{fontSize: '12px', color: '#856404'}}>
                    Missing: {item.variables.join(', ')}
                  </div>
                  <div style={{fontSize: '12px', color: '#856404', fontStyle: 'italic'}}>
                    Impact: {item.impact}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="recommendations">
              <h4 style={{margin: '0 0 10px 0', color: '#2c3e50'}}>Recommendations:</h4>
              <div style={{
                backgroundColor: '#e8f5e8',
                border: '1px solid #27ae60',
                borderRadius: '4px',
                padding: '10px'
              }}>
                {report.recommendations.map((rec, index) => (
                  <div key={index} style={{
                    fontSize: '12px',
                    color: '#2c3e50',
                    marginBottom: index < report.recommendations.length - 1 ? '4px' : '0'
                  }}>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div style={{
            fontSize: '11px',
            color: '#999',
            textAlign: 'right',
            marginTop: '10px'
          }}>
            Last checked: {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigStatus;