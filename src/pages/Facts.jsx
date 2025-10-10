import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function Facts() {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const factTemplates = [
    {
      title: "Shortest Verse",
      description: "John 11:35 is the shortest verse in the Bible.",
      verseRef: "JHN.11.35"
    },
    {
      title: "Most Popular Verse", 
      description: "John 3:16 is often called the most popular verse in the Bible.",
      verseRef: "JHN.3.16"
    },
    {
      title: "The Great Commandment",
      description: "Jesus summarized all commandments into two great ones.",
      verseRef: "MAT.22.37-39"
    },
    {
      title: "The Golden Rule",
      description: "This verse contains Jesus' famous Golden Rule.",
      verseRef: "MAT.7.12"
    },
    {
      title: "God's Promise",
      description: "One of the most comforting promises in the Bible.",
      verseRef: "JER.29.11"
    },
    {
      title: "Perfect Love",
      description: "This verse describes the nature of perfect love.",
      verseRef: "1JN.4.18"
    },
    {
      title: "The Lord's Prayer",
      description: "Jesus taught His disciples this model prayer.",
      verseRef: "MAT.6.9-13"
    },
    {
      title: "Beatitudes - Blessed Are the Poor",
      description: "The first beatitude from Jesus' Sermon on the Mount.",
      verseRef: "MAT.5.3"
    },
    {
      title: "Faith Without Works",
      description: "James teaches about the relationship between faith and works.",
      verseRef: "JAS.2.17"
    },
    {
      title: "God is Love",
      description: "One of the most profound statements about God's nature.",
      verseRef: "1JN.4.8"
    },
    {
      title: "The Armor of God",
      description: "Paul describes the spiritual armor Christians should wear.",
      verseRef: "EPH.6.11"
    },
    {
      title: "Creation Beginning",
      description: "The very first verse of the Bible describes God's creation.",
      verseRef: "GEN.1.1"
    },
    {
      title: "Jesus' Identity",
      description: "Jesus declares His divine identity using the sacred name.",
      verseRef: "JHN.8.58"
    },
    {
      title: "The Great Commission",
      description: "Jesus' final command to His disciples before ascending.",
      verseRef: "MAT.28.19-20"
    },
    {
      title: "Salvation by Grace",
      description: "Paul explains that salvation comes by grace through faith.",
      verseRef: "EPH.2.8-9"
    },
    {
      title: "God's Omnipresence",
      description: "David asks where he can flee from God's presence.",
      verseRef: "PSA.139.7"
    },
    {
      title: "The Resurrection",
      description: "Paul declares the victory over death through Christ.",
      verseRef: "1CO.15.55"
    },
    {
      title: "Trust in the Lord",
      description: "Proverbs teaches us to trust God with all our heart.",
      verseRef: "PRO.3.5-6"
    },
    {
      title: "Be Still and Know",
      description: "God calls us to be still and recognize His divinity.",
      verseRef: "PSA.46.10"
    },
    {
      title: "Love Your Enemies",
      description: "Jesus teaches the radical concept of loving our enemies.",
      verseRef: "MAT.5.44"
    }
  ];

  useEffect(() => {
    const fetchFactsWithVerses = async () => {
      setLoading(true);
      const factsWithVerses = [];

      for (const template of factTemplates) {
        try {
          const verse = await bibleApi.getPassage(template.verseRef);
          factsWithVerses.push({
            title: template.title,
            description: template.description,
            reference: verse.reference,
            content: verse.content.replace(/<[^>]*>/g, ''),
            verse: verse
          });
        } catch (error) {
          console.error(`Failed to fetch verse for ${template.title}:`, error);
          // Add fact without verse if API fails
          factsWithVerses.push({
            title: template.title,
            description: template.description,
            reference: '',
            content: 'Verse temporarily unavailable',
            verse: null
          });
        }
      }

      // Add some non-verse facts
      factsWithVerses.push(
        {
          title: "Books in the Bible",
          description: "There are 66 books in the Bible - 39 in the Old Testament and 27 in the New Testament.",
          isGeneralFact: true
        },
        {
          title: "Languages",
          description: "The Bible has been translated into over 3,000 languages worldwide.",
          isGeneralFact: true
        },
        {
          title: "Authors",
          description: "The Bible was written by approximately 40 different authors over a span of 1,600 years.",
          isGeneralFact: true
        }
      );

      setFacts(factsWithVerses);
      setLoading(false);
    };

    fetchFactsWithVerses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h1>🕊️ Bible Facts</h1>       
      <p>Interesting facts and trivia about the Bible with actual verses</p>
      
      {loading ? (
        <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
          <p>Loading Bible facts...</p>
        </div>
      ) : (
        <div className="facts-grid">
          {facts.map((fact, index) => (
            <div key={index} className="fact-card" style={{
              padding: '25px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
              textAlign: 'left'
            }}>
              <h3 style={{color: '#3498db', marginBottom: '15px'}}>{fact.title}</h3>
              <p style={{marginBottom: '15px', color: '#666'}}>{fact.description}</p>
              
              {!fact.isGeneralFact && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db'
                }}>
                  <div style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    color: '#2c3e50',
                    marginBottom: '10px'
                  }}>
                    "{fact.content}"
                  </div>
                  {fact.reference && (
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#3498db'
                    }}>
                      — {fact.reference}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Facts;