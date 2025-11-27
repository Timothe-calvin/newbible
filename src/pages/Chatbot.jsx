import React, { useState, useEffect } from 'react';
import enhancedAI from '../services/enhancedAI';
import '../components/components.css';

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

  // Parse and structure AI response for better formatting
  const parseResponse = (responseText) => {
    const lines = responseText.split('\n').filter(line => line.trim());
    const structured = {
      mainResponse: '',
      sections: [],
      keyPoints: [],
      questions: []
    };

    let currentSection = null;
    let mainResponseLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect section headers (lines starting with numbers, bullets, or keywords)
      if (trimmed.match(/^\d+\.|^[-*•]|^(Key|Important|Remember|Consider|Reflection):/i)) {
        if (currentSection) {
          structured.sections.push(currentSection);
        }
        currentSection = {
          title: trimmed.replace(/^\d+\.\s*|^[-*•]\s*/g, ''),
          content: []
        };
      }
      // Detect questions (lines ending with ?)
      else if (trimmed.endsWith('?')) {
        structured.questions.push(trimmed);
      }
      // Detect key points (lines with emphasis words)
      else if (trimmed.match(/^(Therefore|Thus|In summary|Most importantly|Remember that)/i)) {
        structured.keyPoints.push(trimmed);
      }
      // Add to current section or main response
      else if (currentSection) {
        currentSection.content.push(trimmed);
      } else {
        mainResponseLines.push(trimmed);
      }
    }

    // Add final section if exists
    if (currentSection) {
      structured.sections.push(currentSection);
    }

    structured.mainResponse = mainResponseLines.join(' ');
    
    return structured;
  };

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
          content: msg.structuredResponse ? msg.text : msg.text
        }));

      const result = await enhancedAI.getChatResponse(userMessage, conversationHistory);
      
      // Parse the response for better structure
      const structuredResponse = parseResponse(result.response);
      
      const botMessageObj = {
        text: result.response,
        structuredResponse: structuredResponse,
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
                {/* Render structured response for bot messages */}
                {message.sender === 'bot' && message.structuredResponse ? (
                  <div className="structured-response">
                    {/* Main Response */}
                    {message.structuredResponse.mainResponse && (
                      <div className="main-response">
                        <p>{message.structuredResponse.mainResponse}</p>
                      </div>
                    )}
                    
                    {/* Key Points */}
                    {message.structuredResponse.keyPoints && message.structuredResponse.keyPoints.length > 0 && (
                      <div className="key-points">
                        <h6 style={{color: '#2c3e50', margin: '15px 0 8px 0', fontSize: '14px', fontWeight: 'bold'}}>
                          💡 Key Points:
                        </h6>
                        {message.structuredResponse.keyPoints.map((point, pIndex) => (
                          <div key={pIndex} style={{
                            backgroundColor: '#f8f9fa',
                            padding: '8px 12px',
                            margin: '4px 0',
                            borderRadius: '8px',
                            borderLeft: '3px solid #007aff',
                            fontSize: '14px'
                          }}>
                            {point}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Sections */}
                    {message.structuredResponse.sections && message.structuredResponse.sections.length > 0 && (
                      <div className="response-sections">
                        {message.structuredResponse.sections.map((section, sIndex) => (
                          <div key={sIndex} style={{
                            backgroundColor: '#f5f5f7',
                            padding: '12px',
                            margin: '8px 0',
                            borderRadius: '10px',
                            border: '1px solid #e0e0e0'
                          }}>
                            <h6 style={{
                              color: '#2c3e50',
                              margin: '0 0 8px 0',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}>
                              {section.title}
                            </h6>
                            {section.content.map((content, cIndex) => (
                              <p key={cIndex} style={{
                                margin: '4px 0',
                                fontSize: '14px',
                                lineHeight: '1.5'
                              }}>
                                {content}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Questions for Reflection */}
                    {message.structuredResponse.questions && message.structuredResponse.questions.length > 0 && (
                      <div className="reflection-questions">
                        <h6 style={{color: '#2c3e50', margin: '15px 0 8px 0', fontSize: '14px', fontWeight: 'bold'}}>
                          🤔 Questions for Reflection:
                        </h6>
                        {message.structuredResponse.questions.map((question, qIndex) => (
                          <div key={qIndex} style={{
                            backgroundColor: '#fff3cd',
                            padding: '8px 12px',
                            margin: '4px 0',
                            borderRadius: '8px',
                            borderLeft: '3px solid #ffc107',
                            fontSize: '14px',
                            fontStyle: 'italic'
                          }}>
                            {question}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Fallback to original text if no structure was found */}
                    {!message.structuredResponse.mainResponse && 
                     message.structuredResponse.sections.length === 0 && 
                     message.structuredResponse.keyPoints.length === 0 && (
                      <p>{message.text}</p>
                    )}
                  </div>
                ) : (
                  // Regular message display for user messages or unstructured bot messages
                  <p>{message.text}</p>
                )}
                
                {/* Display relevant Bible verses for bot messages */}
                {message.sender === 'bot' && message.relevantVerses && message.relevantVerses.length > 0 && (
                  <div className="bible-verses">
                    <h5>📖 Supporting Scripture:</h5>
                    <div className="mt-1">
                      {message.relevantVerses.map((verse, vIndex) => (
                        <div key={vIndex} className="verse-item">
                          <div className="verse-text">
                            "{verse.text}"
                          </div>
                          <div className="verse-reference">
                            — {verse.reference}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display keywords that were searched */}
                {message.sender === 'bot' && message.keywords && message.keywords.length > 0 && (
                  <div className="search-keywords">
                    🔍 Searched for: {message.keywords.join(', ')}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`message-timestamp ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
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