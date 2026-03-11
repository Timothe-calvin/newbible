import React, { useState, useEffect } from 'react';

// 1. DATA COLLECTIONS
const DEVOTIONALS = [
  { prayer: "Lord, guide our steps today...", ref: "Psalm 37:23", content: "The LORD makes firm the steps of the one who delights in him." },
  { prayer: "Father, help us to love as You love...", ref: "1 John 4:7", content: "Dear friends, let us love one another, for love comes from God." },
  { prayer: "God, grant us peace in the storm...", ref: "Psalm 46:1", content: "God is our refuge and strength, an ever-present help in trouble." }
  // Add as many as you like; it will cycle through them all
];

const TOPICS = {
  Hope: [
    { ref: "Jeremiah 29:11", text: "For I know the plans I have for you..." },
    { ref: "Romans 15:13", text: "May the God of hope fill you with all joy..." }
  ],
  Strength: [
    { ref: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength..." },
    { ref: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." }
  ],
  Wisdom: [
    { ref: "James 1:5", text: "If any of you lacks wisdom, you should ask God..." },
    { ref: "Proverbs 2:6", text: "For the Lord gives wisdom; from his mouth come knowledge and understanding." }
  ]
};

function Home() {
  const [dailyDevo, setDailyDevo] = useState(null);
  const [dailyTopics, setDailyTopics] = useState(null);
  const [activeTopic, setActiveTopic] = useState('Hope');

  useEffect(() => {
    // Calculate "Day of the Year" (1-366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);

    // 2. ROTATION LOGIC
    // Picks the devotional for today
    setDailyDevo(DEVOTIONALS[dayOfYear % DEVOTIONALS.length]);

    // Picks a specific verse for each topic for today
    const topicRotation = {};
    Object.keys(TOPICS).forEach(key => {
      const verses = TOPICS[key];
      topicRotation[key] = verses[dayOfYear % verses.length];
    });
    setDailyTopics(topicRotation);

  }, []);

  if (!dailyDevo || !dailyTopics) return <div style={{padding: '50px', textAlign: 'center'}}>Preparing Today's Word...</div>;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
        color: 'white', 
        padding: '50px 20px', 
        textAlign: 'center',
        borderRadius: '0 0 30px 30px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Daily Bread</h1>
        <p style={{ opacity: 0.8 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </header>

      {/* MAIN DEVOTIONAL CARD */}
      <main style={{ maxWidth: '800px', margin: '-40px auto 40px', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '35px', 
          borderRadius: '20px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Today's Scripture
            </span>
            <p style={{ fontSize: '1.4rem', fontStyle: 'italic', marginTop: '20px', lineHeight: '1.6', color: '#1e293b' }}>
              "{dailyDevo.content}"
            </p>
            <p style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '1.1rem' }}>— {dailyDevo.ref}</p>
          </div>
          
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '25px' }}>
            <h3 style={{ fontSize: '1rem', color: '#64748b', marginBottom: '10px', textAlign: 'center' }}>Daily Prayer</h3>
            <p style={{ textAlign: 'center', lineHeight: '1.7', color: '#334155', fontSize: '1.1rem' }}>{dailyDevo.prayer}</p>
          </div>
        </div>
      </main>

      {/* TOPIC DISCOVERY SECTION */}
      <section style={{ maxWidth: '800px', margin: '0 auto 60px', padding: '0 20px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px', textAlign: 'center' }}>Explore Daily Promises</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {Object.keys(TOPICS).map(topic => (
            <button 
              key={topic}
              onClick={() => setActiveTopic(topic)}
              style={{
                padding: '8px 20px',
                borderRadius: '15px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTopic === topic ? '#3b82f6' : '#fff',
                color: activeTopic === topic ? '#fff' : '#3b82f6',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                fontWeight: '600',
                transition: '0.2s'
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        <div style={{ 
          backgroundColor: '#eff6ff', 
          padding: '25px', 
          borderRadius: '15px', 
          borderLeft: '5px solid #3b82f6',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#1e3a8a', fontStyle: 'italic' }}>
            "{dailyTopics[activeTopic].text}"
          </p>
          <p style={{ marginTop: '10px', fontWeight: 'bold', color: '#2563eb' }}>
            — {dailyTopics[activeTopic].ref}
          </p>
        </div>
      </section>

      {/* QUICK LINKS AREA */}
      <footer style={{ textAlign: 'center', paddingBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <a href="/bible-reading" style={btnStyle}>📖 Reading Plan</a>
          <a href="/facts" style={btnStyle}>💡 Bible Facts</a>
          <a href="/chatbot" style={btnStyle}>🤖 AI Assistant</a>
        </div>
      </footer>
    </div>
  );
}

const btnStyle = {
  textDecoration: 'none',
  padding: '12px 25px',
  backgroundColor: '#fff',
  color: '#334155',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '600',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  border: '1px solid #e2e8f0'
};

export default Home;