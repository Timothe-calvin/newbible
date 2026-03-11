import React from "react";

/**
 * TEN COMMANDMENTS COMPONENT
 * Features: 
 * - Full Biblical Text (Exodus 20)
 * - Text-based explanations (Unbiased/Linguistic)
 * - "Print to PDF" functionality
 * - Optimized for 8.5" x 11" paper printing
 */
function TenCommandments() {
  const commandments = [
    {
      number: 1,
      title: "No Other Gods",
      text: "I am the LORD your God... You shall have no other gods before Me.",
      reference: "Exodus 20:2-3",
      explanation: "Establishes exclusive loyalty. It forbids placing anything—wealth, power, or other spiritual entities—above the Creator.",
    },
    {
      number: 2,
      title: "No Idols",
      text: "You shall not make for yourself an image... You shall not bow down to them or worship them.",
      reference: "Exodus 20:4-5",
      explanation: "Prohibits representing the Divine through physical objects. Emphasizes that God is spirit and cannot be captured in man-made images.",
    },
    {
      number: 3,
      title: "No Misuse of God's Name",
      text: "You shall not misuse the name of the LORD your God.",
      reference: "Exodus 20:7",
      explanation: "Refers to using God's name for deceptive purposes, such as swearing false oaths or claiming divine authority for selfish agendas.",
    },
    {
      number: 4,
      title: "Remember the Sabbath",
      text: "Remember the Sabbath day by keeping it holy. Six days you shall labor... but the seventh day is a sabbath.",
      reference: "Exodus 20:8-10",
      explanation: "A mandate for rhythmic rest. It requires a cessation of creative labor every seven days to focus on spiritual restoration.",
    },
    {
      number: 5,
      title: "Honor Your Parents",
      text: "Honor your father and your mother, so that you may live long in the land.",
      reference: "Exodus 20:12",
      explanation: "The first command regarding human relationships. Commands respect for parental authority and carries a promise of societal longevity.",
    },
    {
      number: 6,
      title: "Do Not Murder",
      text: "You shall not murder.",
      reference: "Exodus 20:13",
      explanation: "Uses the Hebrew word 'Ratsach,' referring specifically to intentional, malicious killing, distinct from killing in war or self-defense.",
    },
    {
      number: 7,
      title: "Do Not Commit Adultery",
      text: "You shall not commit adultery.",
      reference: "Exodus 20:14",
      explanation: "Protects the sanctity of the marriage covenant. Demands absolute sexual and emotional fidelity within the marital union.",
    },
    {
      number: 8,
      title: "Do Not Steal",
      text: "You shall not steal.",
      reference: "Exodus 20:15",
      explanation: "Protects property and personal integrity. Forbids taking what belongs to another, including physical goods or time.",
    },
    {
      number: 9,
      title: "No False Witness",
      text: "You shall not give false testimony against your neighbor.",
      reference: "Exodus 20:16",
      explanation: "A command for absolute truth. It prohibits lying, slander, and perjury that harms another's reputation or legal standing.",
    },
    {
      number: 10,
      title: "Do Not Covet",
      text: "You shall not covet your neighbor's house... wife, or anything that belongs to your neighbor.",
      reference: "Exodus 20:17",
      explanation: "The only 'internal' commandment. It addresses the root of sin: the disordered desire for what belongs to someone else.",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="commandments-page" style={pageStyle}>
      
      {/* HEADER & PRINT BUTTON (Hidden on Print) */}
      <div className="no-print" style={headerStyle}>
        <h1 style={{ margin: "0 0 10px 0", color: "#1e3a8a" }}>The Ten Commandments</h1>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Biblical study resource formatted for digital reading and printing.
        </p>
        <button onClick={handlePrint} style={printButtonStyle}>
          🖨️ Print for Free / Save as PDF
        </button>
      </div>

      {/* PRINT-ONLY HEADER (Only shows on Paper) */}
      <div className="print-only" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center' }}>The Ten Commandments</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px' }}>Study Resource from BibleWebsite.com</p>
      </div>

      {/* COMMANDMENTS LIST */}
      <div className="commandments-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {commandments.map((item) => (
          <div key={item.number} className="commandment-card" style={cardStyle}>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={numberCircleStyle}>{item.number}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginTop: "0", marginBottom: "8px", color: "#1e3a8a" }}>{item.title}</h3>
                <p style={{ fontStyle: "italic", color: "#475569", lineHeight: "1.5", margin: "0 0 10px 0" }}>
                  "{item.text}"
                </p>
                <div style={explanationBoxStyle}>
                  <strong style={{ color: "#2563eb" }}>Context:</strong> {item.explanation}
                </div>
                <div style={refStyle}>Source: {item.reference}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER NOTE (February 2026 Context) */}
      <footer style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
        Resource generated for the 2026 Biblical Year.
      </footer>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .commandments-page { max-width: 100% !important; padding: 0 !important; }
          .commandment-card { 
            border: 1px solid #e2e8f0 !important; 
            break-inside: avoid; 
            margin-bottom: 20px !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          h3 { color: black !important; }
          strong { color: black !important; }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// STYLING OBJECTS
// ==========================================

const pageStyle = {
  maxWidth: "850px",
  margin: "0 auto",
  padding: "40px 20px",
  fontFamily: "system-ui, -apple-system, sans-serif",
  backgroundColor: "#fcfcfc",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "40px",
  padding: "30px",
  backgroundColor: "#fff",
  borderRadius: "16px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

const printButtonStyle = {
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "0.2s",
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const numberCircleStyle = {
  width: "40px",
  height: "40px",
  backgroundColor: "#eff6ff",
  color: "#2563eb",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "20px",
  flexShrink: 0,
};

const explanationBoxStyle = {
  backgroundColor: "#f8fafc",
  padding: "12px 15px",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#334155",
  lineHeight: "1.5",
  borderLeft: "4px solid #3b82f6",
};

const refStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  textAlign: "right",
  marginTop: "10px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

export default TenCommandments;