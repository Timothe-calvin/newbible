import React, { useState, useMemo } from 'react';

// ==========================================
// 1. DATA CONSTANTS (All Info Included)
// ==========================================

const GREGORIAN_OVERRIDES = {
  2026: {
    passover: { start: { month: 3, day: 1 }, end: { month: 3, day: 1 } }, 
    tabernacles: { start: { month: 9, day: 25 }, end: { month: 10, day: 1 } } 
  }
};

const HOLIDAYS = [
  { id: 'purim', name: 'Purim', type: 'fixed', start: { month: 1, day: 1 }, end: { month: 1, day: 1 }, description: 'Deliverance in the days of Esther.', scripture: 'Esther 9' },
  { id: 'sabbath', name: 'Weekly Sabbath', type: 'weekly', weekday: 6, description: 'Weekly day of rest.', scripture: 'Lev. 23:3' },
  { id: 'passover', name: 'Passover (Pesach)', type: 'fixed', start: { month: 3, day: 1 }, end: { month: 3, day: 1 }, description: 'The Exodus and the Lamb.', scripture: 'Ex. 12' },
  { id: 'unleavened-bread', name: 'Unleavened Bread', type: 'relative', offsetDays: 1, durationDays: 7, anchor: 'passover', description: 'Removing leaven/sin.', scripture: 'Lev. 23:6' },
  { id: 'weeks', name: 'Pentecost (Shavuot)', type: 'relative', offsetDays: 50, durationDays: 1, anchor: 'passover', description: 'The Law and the Spirit.', scripture: 'Acts 2' },
  { id: 'trumpets', name: 'Feast of Trumpets', type: 'fixed', start: { month: 8, day: 16 }, end: { month: 8, day: 16 }, description: 'The awakening blast.', scripture: 'Lev. 23:24' },
  { id: 'atonement', name: 'Day of Atonement', type: 'fixed', start: { month: 8, day: 25 }, end: { month: 8, day: 25 }, description: 'Fasting and repentance.', scripture: 'Lev. 23:27' },
  { id: 'tabernacles', name: 'Tabernacles (Sukkot)', type: 'fixed', start: { month: 8, day: 30 }, end: { month: 9, day: 6 }, description: 'God dwelling with man.', scripture: 'Lev. 23:42' }
];

const APPOINTMENTS = [
  { id: 'sabbath', name: 'The Sabbath', pertainsTo: 'Creation & Rest', rules: ['No buying/selling.', 'No occupational work.'], steps: ['Finish chores Friday.', 'Read Bible on Saturday.'], scripture: 'Exodus 20:8' },
  { id: 'passover', name: 'Passover', pertainsTo: 'Deliverance', rules: ['Eat Matzah.', 'Tell the story.'], steps: ['Memorial meal.', 'Study the Lamb.'], scripture: 'Leviticus 23:5' },
  { id: 'unleavened-bread', name: 'Unleavened Bread', pertainsTo: 'Holiness', rules: ['Lasts 7 days.', 'No yeast in home.'], steps: ['Purge the pantry.', 'Pray for purity.'], scripture: 'Leviticus 23:6' }
];

const CYCLES = [
  { name: 'New Moon', text: 'Monthly reset. Trumpet blasts and business rest.', ref: 'Numbers 10:10' },
  { name: 'Sabbatical Year', text: 'Every 7 years. Let the land rest and release all debts.', ref: 'Lev. 25:1-7' },
  { name: 'Jubilee', text: 'Every 50 years. Total liberty and restoration of property.', ref: 'Lev. 25:10' }
];

const INSIGHTS = [
  { title: 'The Biblical Day', text: 'Starts at sunset, not midnight. Rest starts the evening before.' },
  { title: 'Tradition vs. Bible', text: 'Bible-alone practice focus: Gather, Read, and Rest. No extra garments or fixed liturgies.' },
  { title: 'Temple Note', text: 'Without a Temple, prayer and study replace animal sacrifices (Hosea 14:2).' }
];

// ==========================================
// 2. COMPONENT LOGIC
// ==========================================

function BiblicalHolidays() {
  const [activeTab, setActiveTab] = useState('calendar');
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();

  // Date Logic
  const getDates = useMemo(() => {
    const pOverride = GREGORIAN_OVERRIDES[year]?.passover;
    const pAnchor = pOverride ? new Date(year, pOverride.start.month, pOverride.start.day) : new Date(year, 3, 1);
    
    return HOLIDAYS.map(h => {
      let s, e;
      if (h.type === 'weekly') { 
        s = new Date(today); s.setDate(s.getDate() + (h.weekday - s.getDay() + 7) % 7); e = s; 
      } else if (h.type === 'relative') {
        s = new Date(pAnchor); s.setDate(s.getDate() + h.offsetDays);
        e = new Date(s); e.setDate(e.getDate() + h.durationDays - 1);
      } else {
        const o = GREGORIAN_OVERRIDES[year]?.[h.id] || h;
        s = new Date(year, o.start.month, o.start.day);
        e = new Date(year, o.end.month, o.end.day);
      }
      return { ...h, startDate: s, endDate: e };
    });
  }, [today, year]);

  const spotlight = getDates.find(h => today >= h.startDate && today <= h.endDate) || getDates.find(h => h.startDate > today) || getDates[0];

  const formatDate = (s, e) => s.toDateString() === e.toDateString() 
    ? s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
    : `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#334155' }}>
      
      {/* HERO SECTION (Feb 2026 Context) */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>{spotlight.name}</h2>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatDate(spotlight.startDate, spotlight.endDate)}</p>
        <p style={{ maxWidth: '600px', margin: '15px auto', opacity: 0.9 }}>{spotlight.description}</p>
        <div style={{ fontWeight: 'bold' }}>📖 {spotlight.scripture}</div>
      </section>

      {/* NAVIGATION */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
        {['calendar', 'practice', 'insights'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '10px 25px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            backgroundColor: activeTab === t ? '#3b82f6' : '#fff', color: activeTab === t ? '#fff' : '#64748b',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transition: '0.2s'
          }}>
            {t.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* TAB CONTENT */}
      <div style={{ minHeight: '400px' }}>
        
        {/* CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {getDates.map(h => (
              <div key={h.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: spotlight.id === h.id ? '2px solid #3b82f6' : '1px solid #f1f5f9' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>{h.name}</h4>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '10px' }}>{formatDate(h.startDate, h.endDate)}</div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{h.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* PRACTICE VIEW */}
        {activeTab === 'practice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {APPOINTMENTS.map(a => (
              <div key={a.id} style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '15px', border: '2px solid #e0e7ff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)' }}>
                <h3 style={{ gridColumn: '1 / -1', margin: 0, color: '#1e3a8a', fontSize: '1.5rem' }}>{a.name} <small style={{ fontWeight: 'normal', color: '#64748b' }}>— {a.pertainsTo}</small></h3>
                <div>
                  <h5 style={{ color: '#3b82f6', marginBottom: '10px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>RULES</h5>
                  <ul style={{ fontSize: '16px', paddingLeft: '20px', color: '#000', fontWeight: '500' }}>{a.rules.map(r => <li key={r} style={{ marginBottom: '8px', color: '#000' }}>{r}</li>)}</ul>
                </div>
                <div>
                  <h5 style={{ color: '#10b981', marginBottom: '10px', fontSize: '0.9rem', letterSpacing: '0.05em' }}>STEPS</h5>
                  <ul style={{ fontSize: '16px', paddingLeft: '20px', color: '#000', fontWeight: '500' }}>{a.steps.map(s => <li key={s} style={{ marginBottom: '8px', color: '#000' }}>{s}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INSIGHTS & CYCLES VIEW */}
        {activeTab === 'insights' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {CYCLES.map(c => (
              <div key={c.name} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #3b82f6' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{c.name}</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>{c.text}</p>
                <small style={{ fontWeight: 'bold', color: '#3b82f6' }}>{c.ref}</small>
              </div>
            ))}
            {INSIGHTS.map(i => (
              <div key={i.title} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{i.title}</h4>
                <p style={{ fontSize: '14px', color: '#64748b' }}>{i.text}</p>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FOOTER CHECKLIST */}
      <footer style={{ marginTop: '50px', padding: '30px', backgroundColor: '#f1f5f9', borderRadius: '20px', textAlign: 'center' }}>
        <h4 style={{ marginBottom: '15px' }}>Beginner Checklist</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {['Sunset App', 'Read Aloud', 'Keep it Biblical'].map(tag => (
            <span key={tag} style={{ backgroundColor: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>✔️ {tag}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default BiblicalHolidays;