import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function TenCommandments() {
  const [commandmentsData, setCommandmentsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const commandmentsList = [
    {
      number: 1,
      title: "No other gods",
      text: "And God spoke all these words: 'I am the LORD your God, who brought you out of Egypt, out of the land of slavery. You shall have no other gods before me.'"
    },
    {
      number: 2,
      title: "No idols",
      text: "You shall not make for yourself an image in the form of anything in heaven above or on the earth beneath or in the waters below. You shall not bow down to them or worship them; for I, the LORD your God, am a jealous God, punishing the children for the sin of the parents to the third and fourth generation of those who hate me, but showing love to a thousand generations of those who love me and keep my commandments."
    },
    {
      number: 3,
      title: "Do not misuse God's name",
      text: "You shall not misuse the name of the LORD your God, for the LORD will not hold anyone guiltless who misuses his name."
    },
    {
      number: 4,
      title: "Remember the Sabbath",
      text: "Remember the Sabbath day by keeping it holy. Six days you shall labor and do all your work, but the seventh day is a sabbath to the LORD your God. On it you shall not do any work, neither you, nor your son or daughter, nor your male or female servant, nor your animals, nor any foreigner residing in your towns. For in six days the LORD made the heavens and the earth, the sea, and all that is in them, but he rested on the seventh day. Therefore the LORD blessed the Sabbath day and made it holy."
    },
    {
      number: 5,
      title: "Honor your parents",
      text: "Honor your father and your mother, so that you may live long in the land the LORD your God is giving you. This is the first commandment with a promise attached to it - long life in the land that God provides. It establishes the foundation of respect for authority and family structure, recognizing parents as God's appointed guardians and teachers in our lives."
    },
    {
      number: 6,
      title: "You shall not murder",
      text: "You shall not murder. This commandment protects the sanctity of human life, as every person is made in the image of God (Genesis 1:27). It encompasses not just physical killing, but Jesus expanded this to include hatred and anger toward others (Matthew 5:21-22), showing that murder begins in the heart with malice and contempt for others."
    },
    {
      number: 7,
      title: "You shall not commit adultery",
      text: "You shall not commit adultery. This commandment protects the sacred covenant of marriage, which God established as a reflection of His faithful love for His people. It preserves the integrity of the family unit and the trust between spouses. Jesus further taught that even lustful thoughts constitute adultery of the heart (Matthew 5:27-28)."
    },
    {
      number: 8,
      title: "You shall not steal",
      text: "You shall not steal. This commandment protects personal property and establishes the principle of honest work and fair exchange. It goes beyond taking physical objects to include stealing time, reputation, credit for work, or defrauding others in business. It affirms that we should work honestly for what we need and share generously with those in need (Ephesians 4:28)."
    },
    {
      number: 9,
      title: "You shall not bear false witness",
      text: "You shall not give false testimony against your neighbor. This commandment protects truth and justice, particularly in legal matters, but extends to all forms of dishonesty including lies, slander, gossip, and character assassination. It establishes that truth is sacred because God Himself is truth (John 14:6), and calls us to speak truthfully and protect others' reputations."
    },
    {
      number: 10,
      title: "You shall not covet",
      text: "You shall not covet your neighbor's house. You shall not covet your neighbor's wife, or his male or female servant, his ox or donkey, or anything that belongs to your neighbor. This final commandment addresses the heart's desires and is unique because it deals with internal attitudes rather than external actions. Coveting is the root of many other sins - it can lead to theft, adultery, murder, and false testimony. It calls us to contentment with what God has provided and to rejoice in others' blessings rather than envying them."
    }
  ];

  useEffect(() => {
    const fetchCommandments = async () => {
      try {
        // Fetch Exodus 20:1-17 (The Ten Commandments)
        const passage = await bibleApi.getPassage('EXO.20.1-17');
        setCommandmentsData(passage);
      } catch (error) {
        console.error('Failed to fetch Ten Commandments:', error);
        // Keep default list if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchCommandments();
  }, []);

  return (
    <div className="page">
      <h1>🕊️ The Ten Commandments</h1>
      <p>The fundamental laws given by God to Moses on Mount Sinai (Exodus 20:1-17)</p>
      
      {loading ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
          <p>Loading Ten Commandments from Scripture...</p>
        </div>
      ) : (
        <>
          {/* Display the full biblical passage */}
          {commandmentsData && (
            <div style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '10px',
              boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
              marginBottom: '30px',
              borderLeft: '4px solid #3498db'
            }}>
              <h3 style={{color: '#3498db', marginBottom: '15px'}}>
                📜 {commandmentsData.reference}
              </h3>
              <div 
                style={{
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#2c3e50',
                  textAlign: 'justify'
                }}
                dangerouslySetInnerHTML={{ __html: commandmentsData.content }}
              />
            </div>
          )}

          {/* Display the complete commandments */}
          <h2 style={{color: '#2c3e50', marginBottom: '20px'}}>The Ten Commandments in Full:</h2>
          <div className="commandments-list">
            {commandmentsList.map((commandment, index) => (
              <div key={index} className="commandment-card" style={{
                backgroundColor: 'white',
                padding: '25px',
                margin: '20px 0',
                borderRadius: '10px',
                boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
                borderLeft: '5px solid #3498db'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}>
                  <div style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {commandment.number}
                  </div>
                  <div style={{flex: 1}}>
                    <h3 style={{
                      color: '#2c3e50',
                      marginBottom: '15px',
                      fontSize: '20px'
                    }}>
                      {commandment.title}
                    </h3>
                    <p style={{
                      fontSize: '16px',
                      lineHeight: '1.7',
                      color: '#34495e',
                      margin: 0,
                      textAlign: 'justify'
                    }}>
                      "{commandment.text}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TenCommandments;