import React, { useState, useEffect } from 'react';
import enhancedAI from '../services/enhancedAI';

function Chatbot() {
  const [messages, setMessages] = useState([
    { 
      text: "Hello! I'm your Bible study assistant. I can help with questions about faith, Scripture, and Christian living. I'll support my answers with relevant Bible verses when possible. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Check API configuration on component mount
  useEffect(() => {
    const config = enhancedAI.isConfigured();
    
    if (!config.fullyConfigured) {
      setMessages(prev => [...prev, {
        text: `⚠️ ${!config.openRouter ? 'AI service' : ''} ${!config.openRouter && !config.bibleApi ? 'and' : ''} ${!config.bibleApi ? 'Bible API' : ''} not fully configured. Some features may be limited.`,
        sender: 'bot',
        timestamp: new Date(),
        isWarning: true
      }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMessageObj = { 
      text: userMessage, 
      sender: 'user', 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    setInput('');
    setLoading(true);

    try {
      // Get conversation history for context (last 5 messages)
      const conversationHistory = messages
        .slice(-5)
        .filter(msg => msg.sender !== 'bot' || !msg.isWarning)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const result = await enhancedAI.getChatResponse(userMessage, conversationHistory);
      
      const botMessageObj = { 
        text: result.response, 
        sender: 'bot', 
        timestamp: new Date(),
        relevantVerses: result.relevantVerses,
        keywords: result.keywords,
        hasVerses: result.hasVerses
      };
      
      setMessages(prev => [...prev, botMessageObj]);
      
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        text: "I'm sorry, I'm having trouble responding right now. Please try again later or check if your internet connection is working.", 
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="page">
      <h1>🕊️ AI Bible Chatbot</h1>
      <p>Ask questions about the Bible, faith, and spiritual guidance</p>
      
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender} ${message.isWarning ? 'warning' : ''} ${message.isError ? 'error' : ''}`}>
              <div className="message-content">
                <p>{message.text}</p>
                
                {/* Display relevant Bible verses for bot messages */}
                {message.sender === 'bot' && message.relevantVerses && message.relevantVerses.length > 0 && (
                  <div className="bible-verses" style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <h5 style={{margin: '0 0 10px 0', color: '#3498db', fontSize: '14px'}}>
                      📖 Supporting Scripture:
                    </h5>
                    {message.relevantVerses.map((verse, vIndex) => (
                      <div key={vIndex} style={{marginBottom: '10px'}}>
                        <div style={{
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: '#2c3e50',
                          lineHeight: '1.4',
                          marginBottom: '5px'
                        }}>
                          "{verse.text}"
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#3498db'
                        }}>
                          — {verse.reference}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Display keywords that were searched */}
                {message.sender === 'bot' && message.keywords && message.keywords.length > 0 && (
                  <div className="search-keywords" style={{
                    marginTop: '10px',
                    fontSize: '11px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    🔍 Searched for: {message.keywords.join(', ')}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className="message-timestamp" style={{
                fontSize: '10px',
                color: '#999',
                marginTop: '5px',
                textAlign: message.sender === 'user' ? 'right' : 'left'
              }}>
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="message bot loading-message">
              <div className="loading-dots">
                <span>🤔</span>
                <span>Searching Scripture and preparing response...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask me about the Bible..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;