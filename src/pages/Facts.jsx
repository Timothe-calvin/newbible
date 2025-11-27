import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';
import preloadService from '../services/preloadService';

function Facts() {
  // Constants for batch loading optimization
  const DAILY_FACTS_COUNT = 5;
  const DAILY_QUOTES_COUNT = 3;
  const REQUESTS_PER_BATCH = 3;
  const BATCH_INTERVAL_MS = 8000; // 8 seconds between batches
  const BATCH_ITEM_DELAY_MS = 1000; // 1 second between items in batch
  
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState({ loaded: 0, total: 8 });
  const [nextVerseCountdown, setNextVerseCountdown] = useState(null);

  const factTemplates = [
    // ===== FOUNDATIONAL VERSES =====
    {
      title: "Shortest Verse",
      description: "John 11:35 is the shortest verse in the Bible, showing Jesus' compassion.",
      verseRef: "JHN.11.35"
    },
    {
      title: "Most Popular Verse", 
      description: "John 3:16 is often called the most popular verse in the Bible, summarizing God's love.",
      verseRef: "JHN.3.16"
    },
    {
      title: "Creation Beginning",
      description: "The very first verse of the Bible describes God's creation of everything.",
      verseRef: "GEN.1.1"
    },
    {
      title: "God is Love",
      description: "One of the most profound statements about God's essential nature.",
      verseRef: "1JN.4.8"
    },
    
    // ===== JESUS' TEACHINGS =====
    {
      title: "The Great Commandment",
      description: "Jesus summarized all commandments into two great ones about love.",
      verseRef: "MAT.22.37"
    },
    {
      title: "The Golden Rule",
      description: "This verse contains Jesus' famous Golden Rule for treating others.",
      verseRef: "MAT.7.12"
    },
    {
      title: "The Lord's Prayer",
      description: "Jesus taught His disciples this model prayer.",
      verseRef: "MAT.6.9"
    },
    {
      title: "Beatitudes - Blessed Are the Poor",
      description: "The first beatitude from Jesus' Sermon on the Mount.",
      verseRef: "MAT.5.3"
    },
    {
      title: "Love Your Enemies",
      description: "Jesus teaches the radical concept of loving our enemies.",
      verseRef: "MAT.5.44"
    },
    {
      title: "The Great Commission",
      description: "Jesus' final command to His disciples before ascending to heaven.",
      verseRef: "MAT.28.19"
    },
    {
      title: "Jesus' Identity",
      description: "Jesus declares His divine identity using the sacred name 'I AM'.",
      verseRef: "JHN.8.58"
    },
    {
      title: "I Am the Way",
      description: "Jesus declares He is the only way to the Father.",
      verseRef: "JHN.14.6"
    },
    
    // ===== SALVATION & GRACE =====
    {
      title: "Salvation by Grace",
      description: "Paul explains that salvation comes by grace through faith, not works.",
      verseRef: "EPH.2.8"
    },
    {
      title: "Romans Road - Sin",
      description: "All have sinned and fall short of God's glory.",
      verseRef: "ROM.3.23"
    },
    {
      title: "Romans Road - Consequence",
      description: "The wages of sin is death, but God's gift is eternal life.",
      verseRef: "ROM.6.23"
    },
    {
      title: "Romans Road - Confession",
      description: "Confess Jesus as Lord and believe in your heart for salvation.",
      verseRef: "ROM.10.9"
    },
    {
      title: "New Creation",
      description: "Anyone in Christ is a new creation; the old has gone.",
      verseRef: "2CO.5.17"
    },
    
    // ===== COMFORT & PROMISES =====
    {
      title: "God's Promise",
      description: "One of the most comforting promises about God's plans for us.",
      verseRef: "JER.29.11"
    },
    {
      title: "Perfect Love",
      description: "This verse describes how perfect love casts out fear.",
      verseRef: "1JN.4.18"
    },
    {
      title: "Be Still and Know",
      description: "God calls us to be still and recognize His divinity.",
      verseRef: "PSA.46.10"
    },
    {
      title: "God's Omnipresence",
      description: "David asks where he can flee from God's ever-present Spirit.",
      verseRef: "PSA.139.7"
    },
    {
      title: "The Lord is My Shepherd",
      description: "The beginning of the most famous Psalm of comfort.",
      verseRef: "PSA.23.1"
    },
    {
      title: "Fear Not",
      description: "God's command not to fear, for He is always with us.",
      verseRef: "ISA.41.10"
    },
    {
      title: "All Things Work Together",
      description: "Paul's assurance that God works all things for good.",
      verseRef: "ROM.8.28"
    },
    
    // ===== WISDOM & GUIDANCE =====
    {
      title: "Trust in the Lord",
      description: "Proverbs teaches us to trust God with all our heart.",
      verseRef: "PRO.3.5"
    },
    {
      title: "The Fear of the Lord",
      description: "The beginning of wisdom starts with fearing the Lord.",
      verseRef: "PRO.9.10"
    },
    {
      title: "God's Thoughts Higher",
      description: "God's ways and thoughts are higher than our ways.",
      verseRef: "ISA.55.8"
    },
    {
      title: "Seek First the Kingdom",
      description: "Jesus teaches about priorities and God's provision.",
      verseRef: "MAT.6.33"
    },
    
    // ===== FAITH & WORKS =====
    {
      title: "Faith Without Works",
      description: "James teaches about the relationship between faith and works.",
      verseRef: "JAS.2.17"
    },
    {
      title: "Definition of Faith",
      description: "The biblical definition of faith in things unseen.",
      verseRef: "HEB.11.1"
    },
    {
      title: "Faith Like a Mustard Seed",
      description: "Jesus teaches about the power of even small faith.",
      verseRef: "MAT.17.20"
    },
    {
      title: "Walk by Faith",
      description: "Paul teaches Christians to walk by faith, not by sight.",
      verseRef: "2CO.5.7"
    },
    
    // ===== SPIRITUAL WARFARE =====
    {
      title: "The Armor of God",
      description: "Paul describes the spiritual armor Christians should wear.",
      verseRef: "EPH.6.11"
    },
    {
      title: "Our Struggle",
      description: "Paul explains that our battle is not against flesh and blood.",
      verseRef: "EPH.6.12"
    },
    {
      title: "Greater is He",
      description: "The one in you is greater than the one in the world.",
      verseRef: "1JN.4.4"
    },
    
    // ===== RESURRECTION & ETERNAL LIFE =====
    {
      title: "The Resurrection",
      description: "Paul declares the victory over death through Christ.",
      verseRef: "1CO.15.55"
    },
    {
      title: "Jesus Lives",
      description: "The angel's announcement at the empty tomb.",
      verseRef: "LUK.24.6"
    },
    {
      title: "Eternal Life",
      description: "Jesus defines eternal life as knowing God and Jesus Christ.",
      verseRef: "JHN.17.3"
    },
    
    // ===== THE NATURE OF GOD =====
    {
      title: "God's Holiness",
      description: "The seraphim proclaim God's holiness three times.",
      verseRef: "ISA.6.3"
    },
    {
      title: "God Never Changes",
      description: "God declares that He never changes or varies.",
      verseRef: "MAL.3.6"
    },
    {
      title: "God's Mercy",
      description: "God's mercies are new every morning.",
      verseRef: "LAM.3.22"
    },
    
    // ===== CHRISTIAN LIVING =====
    {
      title: "Love One Another",
      description: "Jesus gives His disciples a new commandment to love.",
      verseRef: "JHN.13.34"
    },
    {
      title: "Fruits of the Spirit",
      description: "Paul lists the fruits that the Spirit produces in believers.",
      verseRef: "GAL.5.22"
    },
    {
      title: "Do Everything for God's Glory",
      description: "Paul instructs believers to do everything for God's glory.",
      verseRef: "1CO.10.31"
    },
    {
      title: "Present Your Bodies",
      description: "Paul urges believers to offer themselves as living sacrifices.",
      verseRef: "ROM.12.1"
    },
    
    // ===== PROPHECY & SECOND COMING =====
    {
      title: "Jesus' Return",
      description: "Jesus promises He will come again to take believers with Him.",
      verseRef: "JHN.14.2"
    },
    {
      title: "Every Knee Will Bow",
      description: "Paul prophesies that every knee will bow to Jesus.",
      verseRef: "PHP.2.10"
    },
    {
      title: "New Heaven and Earth",
      description: "John's vision of God creating a new heaven and new earth.",
      verseRef: "REV.21.1"
    }
  ];

  // Get today's date as a number for daily rotation
  const getDayNumber = () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear;
  };

  // Inspirational Bible quotes
  const inspirationalQuotes = [
    {
      title: "Hope in the Lord",
      quote: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      verseRef: "ISA.40.31"
    },
    {
      title: "God's Plans for You",
      quote: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
      verseRef: "JER.29.11"
    },
    {
      title: "Strength in Weakness",
      quote: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'",
      verseRef: "2CO.12.9"
    },
    {
      title: "Peace from God",
      quote: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      verseRef: "PHP.4.7"
    },
    {
      title: "All Things Possible",
      quote: "I can do all this through him who gives me strength.",
      verseRef: "PHP.4.13"
    },
    {
      title: "God's Love",
      quote: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      verseRef: "JHN.3.16"
    },
    {
      title: "Fear Not",
      quote: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
      verseRef: "ISA.41.10"
    },
    {
      title: "Trust in the Lord",
      quote: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      verseRef: "PRO.3.5"
    },
    {
      title: "God's Faithfulness",
      quote: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
      verseRef: "LAM.3.22"
    },
    {
      title: "Casting Anxieties",
      quote: "Cast all your anxiety on him because he cares for you.",
      verseRef: "1PE.5.7"
    },
    {
      title: "New Creation",
      quote: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
      verseRef: "2CO.5.17"
    },
    {
      title: "God's Presence",
      quote: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
      verseRef: "JOS.1.9"
    },
    {
      title: "Abundant Life",
      quote: "I have come that they may have life, and have it abundantly.",
      verseRef: "JHN.10.10"
    },
    {
      title: "God's Goodness",
      quote: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      verseRef: "ROM.8.28"
    },
    {
      title: "Light in Darkness",
      quote: "The light shines in the darkness, and the darkness has not overcome it.",
      verseRef: "JHN.1.5"
    }
  ];

  // Get today's 5 facts and 3 inspirational quotes
  const getTodaysFacts = () => {
    const dayNum = getDayNumber();
    setCurrentDay(dayNum);
    
    // Use day number as seed for consistent daily selection
    const factStartIndex = (dayNum * DAILY_FACTS_COUNT) % factTemplates.length;
    const quoteStartIndex = (dayNum * DAILY_QUOTES_COUNT) % inspirationalQuotes.length;
    
    // Select facts with verses (rotating through the array)
    const selectedFactsWithVerses = [];
    for (let i = 0; i < DAILY_FACTS_COUNT; i++) {
      const index = (factStartIndex + i) % factTemplates.length;
      selectedFactsWithVerses.push(factTemplates[index]);
    }
    
    // Select inspirational quotes (rotating through the array)
    const selectedQuotes = [];
    for (let i = 0; i < DAILY_QUOTES_COUNT; i++) {
      const index = (quoteStartIndex + i) % inspirationalQuotes.length;
      selectedQuotes.push({
        ...inspirationalQuotes[index],
        isInspirationalQuote: true
      });
    }
    
    return {
      factsWithVerses: selectedFactsWithVerses,
      inspirationalQuotes: selectedQuotes
    };
  };

  useEffect(() => {
    const fetchTodaysFacts = async () => {
      // Get today's selection of facts and quotes
      const todaysSelection = getTodaysFacts();
      const { factsWithVerses: todaysFactTemplates, inspirationalQuotes: todaysQuotes } = todaysSelection;
      
      console.log(`📅 Loading today's content (Day ${currentDay}): ${todaysFactTemplates.length} scripture facts + ${todaysQuotes.length} inspirational quotes`);
      
      // Check if today's facts are preloaded with verses
      const dayKey = `facts-day-${currentDay}`;
      const preloadedFacts = preloadService.getCached('facts', dayKey);
      
      if (preloadedFacts && preloadedFacts.length > 0 && preloadedFacts[0].verseText) {
        console.log('📚 Using preloaded daily Bible content with verses - instant display!');
        const processedFacts = preloadedFacts.map(item => ({
          title: item.title,
          description: item.description || item.quote,
          reference: item.verseText ? item.title : '',
          content: item.verseText ? item.verseText.replace(/<[^>]*>/g, '') : 
                   (item.success === false ? 'Verse temporarily unavailable' : 'Loading verse...'),
          verse: item.verseText ? { content: item.verseText } : null,
          loading: false,
          isInspirationalQuote: item.isInspirationalQuote || false
        }));
          
        setFacts(processedFacts);
        setLoading(false);
        return;
      }
      
      // STAGE 1: INSTANT FACTS DISPLAY (No API calls needed)
      console.log('🚀 STAGE 1: Displaying facts instantly...');
      
      // Combine facts and quotes for display
      const allTemplates = [
        ...todaysFactTemplates,
        ...todaysQuotes
      ];
      
      // Show fact titles and descriptions immediately (no API needed)
      const instantFacts = allTemplates.map((template, index) => ({
        title: template.title,
        description: template.description || template.quote,
        reference: '',
        content: 'Loading verse...',
        verse: null,
        loading: true,
        index: index,
        isInspirationalQuote: template.isInspirationalQuote || false,
        verseRef: template.verseRef
      }));
      
      // Facts display instantly - no loading screen needed
      setFacts(instantFacts);
      setLoading(false);
      
      // Set the correct total count for loading status
      setLoadingStatus({ loaded: 0, total: allTemplates.length });
      
      // STAGE 2: PROGRESSIVE VERSE LOADING
      console.log('📖 STAGE 2: Starting progressive verse loading...');
      
      // SMART LOADING: Load first 3 verses quickly, then remaining slowly
      const loadVerse = async (template, index) => {
        try {
          console.log(`📖 Loading verse ${index + 1}/${allTemplates.length}: ${template.title}`);
          const verse = await bibleApi.getPassage(template.verseRef);
          
          // Update this specific fact when loaded
          setFacts(prevFacts => {
            const updatedFacts = [...prevFacts];
            const factIndex = updatedFacts.findIndex(f => f.title === template.title);
            if (factIndex !== -1) {
              updatedFacts[factIndex] = {
                ...updatedFacts[factIndex],
                reference: verse.reference,
                content: verse.content.replace(/<[^>]*>/g, ''),
                verse: verse,
                loading: false
              };
            }
            return updatedFacts;
          });
          
          // Update loading progress
          setLoadingStatus(prev => ({
            ...prev,
            loaded: prev.loaded + 1
          }));
          

          
          console.log(`✅ Loaded verse ${index + 1}: ${template.title}`);
          
        } catch (error) {
          console.error(`Failed to load verse for ${template.title}:`, error);
          
          // Update fact with error state
          setFacts(prevFacts => {
            const updatedFacts = [...prevFacts];
            const factIndex = updatedFacts.findIndex(f => f.title === template.title);
            if (factIndex !== -1) {
              updatedFacts[factIndex] = {
                ...updatedFacts[factIndex],
                reference: '',
                content: error.message && error.message.includes('Rate limit') 
                  ? 'Verse temporarily unavailable - please refresh later' 
                  : 'Verse temporarily unavailable',
                verse: null,
                loading: false
              };
            }
            return updatedFacts;
          });
          
          // Update loading progress even on error
          setLoadingStatus(prev => ({
            ...prev,
            loaded: prev.loaded + 1
          }));
          
          // If rate limited, don't continue loading more verses
          return false;
        }
        return true;
      };
      
      // BATCH LOADING STRATEGY - Optimized for faster loading
      const batches = [];
      for (let i = 0; i < allTemplates.length; i += REQUESTS_PER_BATCH) {
        batches.push(allTemplates.slice(i, i + REQUESTS_PER_BATCH));
      }
      
      console.log(`📦 Loading ${allTemplates.length} verses in ${batches.length} batches of up to ${REQUESTS_PER_BATCH}`);
      
      const loadingSchedule = [];
      
      batches.forEach((batch, batchIndex) => {
        const batchStartTime = batchIndex * BATCH_INTERVAL_MS;
        
        batch.forEach((template, indexInBatch) => {
          const globalIndex = batchIndex * REQUESTS_PER_BATCH + indexInBatch;
          const delay = batchStartTime + (indexInBatch * BATCH_ITEM_DELAY_MS);
          const loadTime = new Date(Date.now() + delay);
          
          loadingSchedule.push({
            index: globalIndex + 1,
            title: template.title,
            delay: delay,
            loadTime: loadTime,
            batchNumber: batchIndex + 1
          });
          
          setTimeout(() => {
            console.log(`� Loading verse ${globalIndex + 1}/${allTemplates.length} (Batch ${batchIndex + 1}): ${template.title}`);
            loadVerse(template, globalIndex);
          }, delay);
          
          console.log(`📅 Batch ${batchIndex + 1}, Verse ${globalIndex + 1} (${template.title}) at ${loadTime.toLocaleTimeString()}`);
        });
      });
      
      // Set up batch-aware countdown display
      const startTime = Date.now();
      let nextLoadIndex = 0;
      
      const updateCountdown = () => {
        if (nextLoadIndex < loadingSchedule.length) {
          const nextLoad = loadingSchedule[nextLoadIndex];
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, nextLoad.delay - elapsed);
          const seconds = Math.ceil(remaining / 1000);
          
          if (seconds > 0) {
            setNextVerseCountdown({
              verse: nextLoad.index,
              title: nextLoad.title,
              seconds: seconds,
              batchNumber: nextLoad.batchNumber
            });
          } else {
            nextLoadIndex++;
            if (nextLoadIndex >= loadingSchedule.length) {
              setNextVerseCountdown(null);
            }
          }
        }
      };
      
      const countdownInterval = setInterval(updateCountdown, 1000);
      updateCountdown();
      
      // Cache the facts (without verses initially, will be updated as verses load)
      setTimeout(() => {
        // Cache after some time to include loaded verses
        const factsToCache = allTemplates.map(template => ({
          ...template,
          verseText: null, // Will be updated by background preload service
          success: null,
          isInspirationalQuote: template.isInspirationalQuote || false
        }));
        
        preloadService.setCached('facts', dayKey, factsToCache);
      }, 2000);
      
      // Trigger smart preloading for future content
      setTimeout(() => {
        preloadService.smartPreload('facts', { currentDay });
      }, 5000);
      
      // Clean up interval on unmount
      return () => {
        clearInterval(countdownInterval);
      };
    };

    fetchTodaysFacts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All 3 facts are scripture facts with verses

  // Get formatted date for display
  const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Separate facts and quotes for display
  const bibleFacts = facts.filter(f => !f.isInspirationalQuote);
  const inspirationalQuotesList = facts.filter(f => f.isInspirationalQuote);

  return (
    <div className="page">
      <h1>🕊️ Daily Bible Facts</h1>       
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
        border: '2px solid #e8f4fd'
      }}>
        <h2 style={{
          color: '#3498db',
          margin: '0 0 10px 0',
          fontSize: '24px'
        }}>
          📅 {getFormattedDate()}
        </h2>
        <p style={{
          color: '#666',
          margin: '0 0 10px 0',
          fontSize: '16px'
        }}>
          Today's selection: 5 Bible facts + 3 inspirational quotes with Scripture verses
        </p>
        <p style={{
          color: '#3498db',
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ⚡ Facts display instantly, verses load in fast batches (3 every minute)
        </p>
        {loadingStatus.loaded < loadingStatus.total && (
          <div>
            <p style={{
              color: '#e74c3c',
              margin: '0 0 5px 0',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              ⏸️ Verse loading paused: {loadingStatus.loaded}/{loadingStatus.total} completed
              <br />
              <span style={{ fontSize: '12px', fontStyle: 'italic' }}>
                (Waiting for Bible Reading API cooldown to complete - verses will load automatically when available)
              </span>
            </p>
            {nextVerseCountdown && (
              <p style={{
                color: '#3498db',
                margin: '0 0 8px 0',
                fontSize: '12px',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>
                ⏱️ Batch {nextVerseCountdown.batchNumber}: Next verse ({nextVerseCountdown.title}) in {nextVerseCountdown.seconds} seconds...
              </p>
            )}
          </div>
        )}
        <p style={{
          color: '#888',
          margin: 0,
          fontSize: '14px',
          fontStyle: 'italic'
        }}>
          ✨ Facts change daily - come back tomorrow for new discoveries!
        </p>
      </div>
      
      {loading ? (
        <div style={{
          textAlign: 'center', 
          padding: '60px',
          backgroundColor: 'white',
          borderRadius: '15px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
          margin: '20px 0'
        }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{color: '#666', fontSize: '18px', margin: 0}}>
            Loading Bible facts and verses...
          </p>
        </div>
      ) : (
        <div>
          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '40px',
            maxWidth: '800px',
            margin: '0 auto 40px auto'
          }}>
            <div style={{
              padding: '25px',
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
              textAlign: 'center',
              border: '3px solid #3498db'
            }}>
              <h3 style={{color: '#3498db', margin: '0 0 10px 0', fontSize: '32px', fontWeight: 'bold'}}>
                5
              </h3>
              <p style={{margin: '0 0 5px 0', color: '#666', fontSize: '16px', fontWeight: 'bold'}}>
                Bible Facts
              </p>
              <p style={{margin: 0, color: '#888', fontSize: '14px'}}>
                With supporting Scripture
              </p>
            </div>
            <div style={{
              padding: '25px',
              backgroundColor: 'white',
              borderRadius: '15px',
              boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
              textAlign: 'center',
              border: '3px solid #27ae60'
            }}>
              <h3 style={{color: '#27ae60', margin: '0 0 10px 0', fontSize: '32px', fontWeight: 'bold'}}>
                3
              </h3>
              <p style={{margin: '0 0 5px 0', color: '#666', fontSize: '16px', fontWeight: 'bold'}}>
                Inspirational Quotes
              </p>
              <p style={{margin: 0, color: '#888', fontSize: '14px'}}>
                Uplifting Bible verses
              </p>
            </div>
          </div>

          {/* Scripture Facts Section */}
          {bibleFacts.length > 0 && (
            <div style={{marginBottom: '50px'}}>
              <h2 style={{
                color: '#3498db',
                borderBottom: '3px solid #3498db',
                paddingBottom: '10px',
                marginBottom: '30px',
                fontSize: '28px',
                textAlign: 'center'
              }}>
                📖 Today's Bible Facts with Scripture
              </h2>
              <div className="facts-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px'
              }}>
                {bibleFacts.map((fact, index) => (
                  <div key={`scripture-${index}`} className="fact-card" style={{
                    padding: '25px',
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                    textAlign: 'left',
                    border: '1px solid #e8f4fd',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)';
                  }}>
                    <h3 style={{
                      color: '#3498db', 
                      marginBottom: '15px',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {fact.title}
                    </h3>
                    <p style={{
                      marginBottom: '20px', 
                      color: '#555',
                      lineHeight: 1.6,
                      fontSize: '16px'
                    }}>
                      {fact.description}
                    </p>
                    
                    <div style={{
                      marginTop: '20px',
                      padding: '20px',
                      backgroundColor: fact.content.includes('unavailable') || fact.content.includes('refresh') ? '#fff5f5' : 
                                       fact.loading ? '#f8f9fa' : '#e8f4fd',
                      borderRadius: '12px',
                      borderLeft: `5px solid ${
                        fact.content.includes('unavailable') || fact.content.includes('refresh') ? '#e74c3c' : 
                        fact.loading ? '#ffa726' : '#3498db'
                      }`,
                      transition: 'all 0.3s ease'
                    }}>
                      {fact.loading ? (
                        <div style={{
                          fontSize: '15px',
                          color: '#ffa726',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid #ffa726',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Fetching verse...
                        </div>
                      ) : fact.content.includes('unavailable') || fact.content.includes('refresh') ? (
                        <div style={{
                          fontSize: '15px',
                          color: '#e74c3c',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          📱 {fact.content}
                          <div style={{
                            fontSize: '13px',
                            marginTop: '8px',
                            color: '#c0392b',
                            fontWeight: 'normal'
                          }}>
                            API limits help us provide free access to everyone
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '16px',
                            lineHeight: '1.7',
                            fontStyle: 'italic',
                            color: '#2c3e50',
                            marginBottom: '12px'
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspirational Quotes Section */}
          {inspirationalQuotesList.length > 0 && (
            <div style={{marginBottom: '50px'}}>
              <h2 style={{
                color: '#27ae60',
                borderBottom: '3px solid #27ae60',
                paddingBottom: '10px',
                marginBottom: '30px',
                fontSize: '28px',
                textAlign: 'center'
              }}>
                💝 Inspirational Bible Quotes
              </h2>
              <div className="quotes-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px'
              }}>
                {inspirationalQuotesList.map((quote, index) => (
                  <div key={`quote-${index}`} className="quote-card" style={{
                    padding: '30px',
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    border: '1px solid #e8f5e8',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.08)';
                  }}>
                    <h3 style={{
                      color: '#27ae60', 
                      marginBottom: '20px',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {quote.title}
                    </h3>
                    
                    <div style={{
                      marginTop: '20px',
                      padding: '25px',
                      backgroundColor: quote.content.includes('unavailable') || quote.content.includes('refresh') ? '#fff5f5' :
                                       quote.loading ? '#f8f9fa' : '#f0f8f0',
                      borderRadius: '12px',
                      borderLeft: `5px solid ${
                        quote.content.includes('unavailable') || quote.content.includes('refresh') ? '#e74c3c' :
                        quote.loading ? '#ffa726' : '#27ae60'
                      }`,
                      transition: 'all 0.3s ease'
                    }}>
                      {quote.loading ? (
                        <div style={{
                          fontSize: '15px',
                          color: '#ffa726',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid #ffa726',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Fetching verse...
                        </div>
                      ) : quote.content.includes('unavailable') || quote.content.includes('refresh') ? (
                        <div style={{
                          fontSize: '15px',
                          color: '#e74c3c',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          📱 {quote.content}
                          <div style={{
                            fontSize: '13px',
                            marginTop: '8px',
                            color: '#c0392b',
                            fontWeight: 'normal'
                          }}>
                            API limits help us provide free access to everyone
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{
                            fontSize: '18px',
                            lineHeight: '1.7',
                            fontStyle: 'italic',
                            color: '#2c3e50',
                            marginBottom: '15px'
                          }}>
                            "{quote.content}"
                          </div>
                          {quote.reference && (
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#27ae60'
                            }}>
                              — {quote.reference}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default Facts;