import React, { useState, useEffect, useRef } from 'react';
import enhancedAI from '../services/enhancedAI';

function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your Bible study assistant. I can help with questions about faith, Scripture, and Christian living. How can I help you today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Accessibility States
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [useDyslexicFont, setUseDyslexicFont] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Text-to-Speech Function
  const speak = (text) => {
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better clarity
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-5).map(msg => ({ 
        role: msg.sender === 'user' ? 'user' : 'assistant', 
        content: msg.text 
      }));
      const result = await enhancedAI.getChatResponse(userMessage, history);
      setMessages(prev => [...prev, { 
        text: result.response, 
        sender: 'bot', 
        timestamp: new Date(), 
        relevantVerses: result.relevantVerses 
      }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = error.message || "Error connecting to service.";
      setMessages(prev => [...prev, { text: errorMessage, sender: 'bot', isError: true }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: useDyslexicFont ? '"OpenDyslexic", sans-serif' : 'system-ui, sans-serif',
      fontSize: `${fontSize}px`
    }}>
      
      {/* Accessibility Toolbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px', 
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#eee',
        borderRadius: '8px'
      }}>
        <button onClick={() => setFontSize(f => f + 2)} aria-label="Increase text size">A+</button>
        <button onClick={() => setFontSize(f => f - 2)} aria-label="Decrease text size">A-</button>
        <button 
          onClick={() => setHighContrast(!highContrast)} 
          style={{ backgroundColor: highContrast ? '#000' : '#fff', color: highContrast ? '#fff' : '#000' }}
        >
          {highContrast ? 'Standard Contrast' : 'High Contrast'}
        </button>
        <button onClick={() => setUseDyslexicFont(!useDyslexicFont)}>
          {useDyslexicFont ? 'Standard Font' : 'Dyslexia Font'}
        </button>
      </div>

      <div 
        role="log" 
        aria-live="polite"
        style={{ 
          backgroundColor: highContrast ? '#000' : '#fff', 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
          height: '70vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          border: highContrast ? '2px solid #fff' : '1px solid #ddd'
        }}
      >
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: highContrast ? '#111' : '#fcfcfc' }}>
          {messages.map((message, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start', 
              marginBottom: '24px' 
            }}>
              <div style={{ 
                maxWidth: '85%', 
                padding: '16px 20px', 
                borderRadius: '18px', 
                lineHeight: '1.6',
                backgroundColor: message.sender === 'user' 
                  ? (highContrast ? '#fff' : '#007bff') 
                  : (highContrast ? '#333' : '#fff'),
                color: message.sender === 'user' 
                  ? (highContrast ? '#000' : '#fff') 
                  : (highContrast ? '#fff' : '#2c3e50'),
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                border: highContrast ? '1px solid #fff' : '1px solid #eee'
              }}>
                
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>

                {/* TTS Button for Bot */}
                {message.sender === 'bot' && (
                  <button 
                    onClick={() => speak(message.text)}
                    style={{
                      marginTop: '10px',
                      background: 'none',
                      border: '1px solid currentColor',
                      borderRadius: '4px',
                      color: 'inherit',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    aria-label="Listen to this message"
                  >
                    🔊 Listen
                  </button>
                )}

                {/* Scripture Section */}
                {message.relevantVerses?.length > 0 && (
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '12px', 
                    backgroundColor: highContrast ? '#444' : '#f0f7ff', 
                    borderRadius: '8px',
                    borderLeft: `4px solid ${highContrast ? '#fff' : '#007bff'}`
                  }}>
                    {message.relevantVerses.map((v, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ fontStyle: 'italic', fontSize: '0.95em' }}>"{v.text}"</div>
                        <div style={{ fontWeight: 'bold', color: highContrast ? '#fff' : '#007bff' }}>— {v.reference}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: highContrast ? '#333' : '#fff',
                color: highContrast ? '#fff' : '#2c3e50',
                border: highContrast ? '1px solid #fff' : '1px solid #eee',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                fontStyle: 'italic'
              }}>
                🤔 Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid #ddd', backgroundColor: highContrast ? '#222' : '#fff', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            aria-label="Type your Bible question"
            placeholder="Ask a question..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            style={{ 
              flex: 1, 
              padding: '14px', 
              borderRadius: '25px', 
              border: '2px solid #eee',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleSend}
            style={{ 
              padding: '0 25px', 
              borderRadius: '25px', 
              backgroundColor: '#007bff', 
              color: '#fff', 
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            disabled={loading}
            aria-label={loading ? 'AI is thinking' : 'Send message'}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;