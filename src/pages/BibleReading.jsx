import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';
import preloadService from '../services/preloadService';

function BibleReading() {
  // Constants
  const API_RATE_LIMIT_COOLDOWN = 6000; // 6 seconds between API requests
  const BATCH_PRELOAD_DELAY = 5000; // 5 seconds before starting batch preload
  const MAX_PRELOAD_CHAPTERS = 3; // Number of chapters to preload ahead
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  
  // Bible version state
  const [availableBibles, setAvailableBibles] = useState([]);
  const [selectedBibleId, setSelectedBibleId] = useState('');
  const [loadingBibles, setLoadingBibles] = useState(true);
  const [availableBooks, setAvailableBooks] = useState([]);
  
  // Smart caching and loading
  const [chapterCache, setChapterCache] = useState(new Map());
  const [batchLoadingStatus, setBatchLoadingStatus] = useState({ loading: false, count: 0 });
  
  // Navigation protection to prevent rapid clicking
  const [navigationCooldown, setNavigationCooldown] = useState(false);
  const [lastNavigationTime, setLastNavigationTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Generate cache key for chapters
  const getCacheKey = (book, chapterNumber, bibleId) => {
    return `${book?.id}-${chapterNumber}-${bibleId}`;
  };
  
  // Smart batch preloading for Bible Reading
  const batchPreloadChapters = async (book, startChapter, bibleId, maxChapters = 3) => {
    if (!book || startChapter > totalChapters) return;
    
    setBatchLoadingStatus({ loading: true, count: 0 });
    console.log(`🚀 Starting batch preload for ${book.name} chapters ${startChapter}-${Math.min(startChapter + maxChapters - 1, totalChapters)}`);
    
    const chaptersToLoad = [];
    for (let i = 0; i < maxChapters && (startChapter + i) <= totalChapters; i++) {
      const chapterNum = startChapter + i;
      const cacheKey = getCacheKey(book, chapterNum, bibleId);
      
      if (!chapterCache.has(cacheKey)) {
        chaptersToLoad.push(chapterNum);
      }
    }
    
    if (chaptersToLoad.length === 0) {
      setBatchLoadingStatus({ loading: false, count: 0 });
      return;
    }
    
    // Load chapters through queue system - no artificial delays needed
    const loadPromises = chaptersToLoad.map(async (chapterNum, i) => {
        try {
          console.log(`📖 Batch loading chapter ${chapterNum} of ${book.name}`);
          
          const passageId = `${book.id}.${chapterNum}`;
          const chapterData = await bibleApi.getPassage(passageId, true, bibleId, 'normal');
          
          // Get chapter introduction
          const chapterIntro = getChapterIntro(book.name, chapterNum);
          
          const content = `
            <div class="chapter-container">
              <div class="chapter-header">
                <h3 class="chapter-title">${book.name} - Chapter ${chapterNum}</h3>
                ${chapterIntro ? `<div class="chapter-intro">${chapterIntro}</div>` : ''}
              </div>
              <div class="chapter-content">
                ${chapterData.content}
              </div>
            </div>
          `;
          
          // Cache the loaded chapter
          const cacheKey = getCacheKey(book, chapterNum, bibleId);
          setChapterCache(prevCache => {
            const newCache = new Map(prevCache);
            newCache.set(cacheKey, content);
            return newCache;
          });
          
          setBatchLoadingStatus(prev => ({ 
            loading: prev.count + 1 < chaptersToLoad.length,
            count: prev.count + 1 
          }));
          
          console.log(`✅ Batch loaded chapter ${chapterNum} (${i + 1}/${chaptersToLoad.length})`);
          
        } catch (error) {
          console.error(`Failed to batch load chapter ${chapterNum}:`, error);
          
          setBatchLoadingStatus(prev => ({ 
            loading: prev.count + 1 < chaptersToLoad.length,
            count: prev.count + 1 
          }));
          
          // If rate limited, stop batch loading
          if (error.message && error.message.includes('Rate limit')) {
            console.log('Rate limit hit - stopping batch preload');
            setBatchLoadingStatus(prev => ({ loading: false, count: prev.count + 1 }));
            return;
          }
        }
    });
    
    await Promise.all(loadPromises);
    setBatchLoadingStatus({ loading: false, count: chaptersToLoad.length });
  };

  // Load available Bible versions on component mount
  useEffect(() => {
    const loadBibleVersions = async () => {
      try {
        const englishBibles = await bibleApi.getEnglishBibles();
        setAvailableBibles(englishBibles);
        
        // Set default Bible ID from env or first available
        const defaultId = import.meta.env.VITE_DEFAULT_BIBLE_ID || englishBibles[0]?.id;
        setSelectedBibleId(defaultId);
        
        // Load books for default Bible
        if (defaultId) {
          const books = await bibleApi.getBooks(defaultId);
          setAvailableBooks(books);
        }
      } catch (error) {
        console.error('Failed to load Bible versions:', error);
        setError('Failed to load Bible versions. Using default settings.');
      } finally {
        setLoadingBibles(false);
      }
    };

    loadBibleVersions();
  }, []);

  // Handle Bible version change
  const handleBibleVersionChange = async (newBibleId) => {
    setSelectedBibleId(newBibleId);
    setSelectedBook(null);
    setChapterContent('');
    
    // Clear cache when switching Bible versions
    clearChapterCache();
    
    try {
      const books = await bibleApi.getBooks(newBibleId);
      setAvailableBooks(books);
    } catch (error) {
      console.error('Failed to load books for Bible version:', error);
      setError('Failed to load books for selected Bible version.');
    }
  };

  // Check if a book is in the Old Testament
  const isOldTestament = (bookId) => {
    const oldTestamentBooks = [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
      '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST',
      'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK',
      'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB',
      'ZEP', 'HAG', 'ZEC', 'MAL'
    ];
    return oldTestamentBooks.includes(bookId);
  };

  // Get chapter introduction/context
  const getChapterIntro = (bookName, chapterNumber) => {
    const intros = {
      'Genesis': {
        1: 'The creation of the heavens, earth, and humanity',
        3: 'The fall of mankind and the first promise of redemption',
        12: 'God calls Abraham and makes the covenant',
        22: 'Abraham\'s test of faith with Isaac'
      },
      'Exodus': {
        3: 'Moses and the burning bush - God\'s call to deliver Israel',
        12: 'The first Passover and exodus from Egypt',
        20: 'The Ten Commandments given at Mount Sinai'
      },
      'Matthew': {
        5: 'The Sermon on the Mount begins with the Beatitudes',
        6: 'The Lord\'s Prayer and teachings on prayer and fasting',
        28: 'The Great Commission - Jesus\' final instructions'
      },
      'John': {
        1: 'The Word became flesh - Jesus as the eternal Word',
        3: 'Jesus teaches Nicodemus about being born again',
        14: 'Jesus comforts His disciples before His crucifixion',
        20: 'The resurrection of Jesus Christ'
      },
      'Romans': {
        1: 'Paul introduces the gospel and mankind\'s need for salvation',
        3: 'All have sinned and fall short of God\'s glory',
        8: 'Life in the Spirit and God\'s eternal love',
        12: 'Living sacrifices and practical Christian living'
      },
      'Psalms': {
        1: 'The way of the righteous versus the way of the wicked',
        23: 'The Lord is my shepherd - a psalm of trust and comfort',
        51: 'David\'s prayer of repentance after his sin with Bathsheba',
        91: 'God\'s protection and refuge for those who trust in Him',
        119: 'The longest chapter in the Bible - praising God\'s Word'
      },
      'Proverbs': {
        1: 'The beginning of wisdom and the fear of the Lord',
        31: 'The virtuous woman and wise living'
      },
      '1 Corinthians': {
        13: 'The love chapter - the greatest of these is love',
        15: 'The resurrection chapter - Christ\'s victory over death'
      },
      'Revelation': {
        1: 'John\'s vision of the glorified Christ',
        21: 'The new heaven and new earth - God\'s eternal kingdom',
        22: 'The river of life and Jesus\' promise to return'
      }
    };

    return intros[bookName]?.[chapterNumber] || null;
  };

  // Handle book selection - load chapter by chapter navigation
  const handleBookSelect = async (book) => {
    setSelectedBook(book);
    setLoading(true);
    setChapterContent('');
    setError('');
    setCurrentChapter(1);
    
    // Clear cache when switching books
    clearChapterCache();
    
    try {
      // Get all chapters for the book
      const chapters = await bibleApi.getChapters(book.id, selectedBibleId);
      
      // Filter out non-numeric chapters (like intro)
      const validChapters = chapters.filter(chapter => 
        chapter.number && !isNaN(chapter.number) && chapter.id !== 'intro'
      );
      
      setTotalChapters(validChapters.length);
      
      // Load first chapter
      if (validChapters.length > 0) {
        await loadChapter(book, 1);
      }
      
    } catch (error) {
      console.error('Failed to load book chapters:', error);
      setError(`Failed to load ${book.name}. Please try again or select a different book.`);
      setLoading(false);
    }
  };

  // Load a specific chapter
  const loadChapter = async (book, chapterNumber) => {
    setLoading(true);
    setError('');
    
    try {
      let content;
      
      // Check preload service cache first
      const preloadedData = preloadService.getCached('chapter', `${book.id}.${chapterNumber}`, selectedBibleId);
      let loadedFromCache = false;
      
      if (preloadedData) {
        console.log(`Loading ${book.name} Chapter ${chapterNumber} from preload cache`);
        loadedFromCache = true;
        
        // Get chapter introduction
        const chapterIntro = getChapterIntro(book.name, chapterNumber);
        
        content = `
          <div class="chapter-container">
            <div class="chapter-header">
              <h3 class="chapter-title">${book.name} - Chapter ${chapterNumber}</h3>
              ${chapterIntro ? `<div class="chapter-intro">${chapterIntro}</div>` : ''}
            </div>
            <div class="chapter-content">
              ${preloadedData.content}
            </div>
          </div>
        `;
      } else {
        // Check local cache
        const cacheKey = getCacheKey(book, chapterNumber, selectedBibleId);
        
        if (chapterCache.has(cacheKey)) {
          console.log(`Loading ${book.name} Chapter ${chapterNumber} from local cache`);
          content = chapterCache.get(cacheKey);
          loadedFromCache = true;
        } else {
          // Load chapter from API with high priority for user-requested chapters
          const passageId = `${book.id}.${chapterNumber}`;
          const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId, 'high');
          
          // Get chapter introduction
          const chapterIntro = getChapterIntro(book.name, chapterNumber);
          
          content = `
            <div class="chapter-container">
              <div class="chapter-header">
                <h3 class="chapter-title">${book.name} - Chapter ${chapterNumber}</h3>
                ${chapterIntro ? `<div class="chapter-intro">${chapterIntro}</div>` : ''}
              </div>
              <div class="chapter-content">
                ${chapterData.content}
              </div>
            </div>
          `;
          
          // Cache the loaded chapter in both caches
          setChapterCache(prevCache => {
            const newCache = new Map(prevCache);
            newCache.set(cacheKey, content);
            return newCache;
          });
          
          // Also cache in preload service
          preloadService.setCached('chapter', `${book.id}.${chapterNumber}`, {
            content: chapterData.content,
            book: book,
            chapter: chapterNumber,
            bibleId: selectedBibleId
          }, selectedBibleId);
        }
      }
      
      setChapterContent(content);
      setCurrentChapter(chapterNumber);
      setLoading(false);
      
      // Smart batch preloading - load next chapters if not cached
      if (!loadedFromCache && chapterNumber < totalChapters && !batchLoadingStatus.loading) {
        setTimeout(() => {
          batchPreloadChapters(book, chapterNumber + 1, selectedBibleId, MAX_PRELOAD_CHAPTERS);
        }, BATCH_PRELOAD_DELAY);
      } else if (loadedFromCache) {
        console.log(`Skipping batch preload - content was loaded from cache`);
      } else if (batchLoadingStatus.loading) {
        console.log(`Batch loading already in progress`);
      }
      
    } catch (error) {
      console.error(`Failed to load chapter ${chapterNumber}:`, error);
      setError(`Failed to load chapter ${chapterNumber}. Please try again.`);
      setLoading(false);
    }
  };

  // Navigation protection to enforce API rate limits
  const canNavigate = () => {
    const now = Date.now();
    const timeSinceLastNavigation = now - lastNavigationTime;
    
    // Prevent navigation if within API rate limit cooldown
    if (timeSinceLastNavigation < API_RATE_LIMIT_COOLDOWN) {
      const remainingCooldown = Math.ceil((API_RATE_LIMIT_COOLDOWN - timeSinceLastNavigation) / 1000);
      console.log(`Navigation blocked - API cooldown: ${remainingCooldown}s remaining`);
      return false;
    }
    
    // Prevent navigation if currently loading
    if (loading) {
      console.log('Navigation blocked - currently loading');
      return false;
    }
    
    return true;
  };

  // Start navigation cooldown with countdown timer
  const startNavigationCooldown = () => {
    const API_COOLDOWN_MS = 6000;
    const cooldownSeconds = Math.ceil(API_COOLDOWN_MS / 1000);
    
    setNavigationCooldown(true);
    setLastNavigationTime(Date.now());
    setCooldownRemaining(cooldownSeconds);
    
    const countdownInterval = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setNavigationCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Navigate to next chapter with API rate limit enforcement
  const handleNextChapter = () => {
    if (!canNavigate() || currentChapter >= totalChapters) return;
    
    startNavigationCooldown();
    loadChapter(selectedBook, currentChapter + 1);
  };

  // Navigate to previous chapter with API rate limit enforcement
  const handlePrevChapter = () => {
    if (!canNavigate() || currentChapter <= 1) return;
    
    startNavigationCooldown();
    loadChapter(selectedBook, currentChapter - 1);
  };
  
  // Clear cache when switching books
  const clearChapterCache = () => {
    setChapterCache(new Map());
    setBatchLoadingStatus({ loading: false, count: 0 }); // Reset batch loading
    setNavigationCooldown(false); // Reset navigation cooldown
    setLastNavigationTime(0); // Reset navigation timing
  };

  // Navigate to specific chapter with API rate limit enforcement
  const handleGoToChapter = (chapterNumber) => {
    if (!canNavigate() || chapterNumber < 1 || chapterNumber > totalChapters || chapterNumber === currentChapter) return;
    
    startNavigationCooldown();
    loadChapter(selectedBook, chapterNumber);
  };



  if (loadingBibles) {
    return (
      <div className="page">
        <div style={{textAlign: 'center', padding: '40px'}}>
          <p>Loading Bible versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>🕊️ Bible Reading</h1>
      <p>Read complete books of the Bible from beginning to end, or the entire Bible in canonical order</p>
      
      {/* Bible Version Selector */}
      <div className="bible-version-selector" style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
        <label style={{fontWeight: 'bold', marginRight: '10px'}}>Bible Version:</label>
        <select 
          value={selectedBibleId} 
          onChange={(e) => handleBibleVersionChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '14px',
            marginRight: '15px'
          }}
        >
          {availableBibles.map(bible => (
            <option key={bible.id} value={bible.id}>
              {bible.abbreviation} - {bible.name}
            </option>
          ))}
        </select>
        
        <span style={{fontSize: '12px', color: '#666'}}>
          English versions only
        </span>
      </div>

      {!selectedBook ? (
        // Book Selection View
        <>
          <div className="bible-reading-options" style={{marginBottom: '30px'}}>
            <div className="reading-options" style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '30px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Entire Bible reading disabled for chapter-by-chapter navigation */}
              <div style={{
                padding: '15px 25px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
                border: '2px dashed #dee2e6'
              }}>
                <p style={{margin: '0', color: '#6c757d', fontStyle: 'italic'}}>
                  📖 For a better reading experience, select individual books below to read chapter by chapter
                </p>
              </div>
            </div>
            <p style={{textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '30px'}}>
              Or select individual books below to read one at a time
            </p>
          </div>

          {/* Old Testament Books */}
          <div className="testament-section" style={{marginBottom: '40px'}}>
            <h4 style={{
              color: '#8e44ad',
              borderBottom: '2px solid #8e44ad',
              paddingBottom: '8px',
              marginBottom: '20px'
            }}>
              Old Testament
            </h4>
            <div className="books-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {availableBooks.filter(book => isOldTestament(book.id)).map(book => (
                <div 
                  key={book.id}
                  className="book-card"
                  onClick={() => handleBookSelect(book)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    textAlign: 'center',
                    border: '1px solid #f0f0f0'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h4 style={{margin: '0 0 5px 0', color: '#8e44ad', fontSize: '14px'}}>{book.name}</h4>
                  <p style={{margin: '0', fontSize: '11px', color: '#999'}}>{book.abbreviation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* New Testament Books */}
          <div className="testament-section">
            <h4 style={{
              color: '#27ae60',
              borderBottom: '2px solid #27ae60',
              paddingBottom: '8px',
              marginBottom: '20px'
            }}>
              New Testament
            </h4>
            <div className="books-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {availableBooks.filter(book => !isOldTestament(book.id)).map(book => (
                <div 
                  key={book.id}
                  className="book-card"
                  onClick={() => handleBookSelect(book)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    textAlign: 'center',
                    border: '1px solid #f0f0f0'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h4 style={{margin: '0 0 5px 0', color: '#27ae60', fontSize: '14px'}}>{book.name}</h4>
                  <p style={{margin: '0', fontSize: '11px', color: '#999'}}>{book.abbreviation}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Chapter Navigation View
        <>
          <div style={{marginBottom: '20px'}}>
            <button 
              onClick={() => {
                setSelectedBook(null);
                setChapterContent('');
                setCurrentChapter(1);
                setTotalChapters(0);
                clearChapterCache();
              }}
              className="btn"
              style={{marginBottom: '15px'}}
            >
              ← Back to Books
            </button>
            
            {/* Book Header */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{margin: '0 0 10px 0', color: '#2c3e50'}}>{selectedBook.name}</h3>
              {availableBibles.find(b => b.id === selectedBibleId) && (
                <p style={{color: '#666', margin: '0 0 10px 0'}}>
                  {availableBibles.find(b => b.id === selectedBibleId).abbreviation} - {availableBibles.find(b => b.id === selectedBibleId).name}
                </p>
              )}
              
              {/* Chapter Progress */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{color: '#7f8c8d', fontSize: '14px'}}>
                  Chapter {currentChapter} of {totalChapters}
                </div>
                
                {/* Chapter Selector */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <label style={{fontSize: '14px', color: '#2c3e50', fontWeight: '500'}}>Jump to:</label>
                    <select 
                      value={currentChapter} 
                      onChange={(e) => handleGoToChapter(parseInt(e.target.value))}
                      disabled={navigationCooldown || loading}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #3498db',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#2c3e50',
                        backgroundColor: 'white',
                        cursor: (navigationCooldown || loading) ? 'not-allowed' : 'pointer',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        minWidth: '120px',
                        opacity: (navigationCooldown || loading) ? 0.6 : 1
                      }}
                    >
                      {Array.from({length: totalChapters}, (_, i) => (
                        <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  {navigationCooldown && cooldownRemaining > 0 && (
                    <div style={{
                      fontSize: '12px',
                      color: '#e74c3c',
                      fontWeight: '500',
                      textAlign: 'right'
                    }}>
                      ⏳ Wait {cooldownRemaining}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="error-message" style={{marginBottom: '20px'}}>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff5f5',
                borderRadius: '12px',
                border: '2px solid #fed7d7',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                  <span style={{fontSize: '24px', marginRight: '10px'}}>⚠️</span>
                  <strong style={{color: '#e53e3e', fontSize: '18px'}}>Loading Error</strong>
                </div>
                <p style={{color: '#c53030', margin: '0 0 15px 0', lineHeight: 1.5}}>
                  {error}
                </p>
                <button
                  onClick={() => loadChapter(selectedBook, currentChapter)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '15px'
              }}></div>
              <p style={{margin: 0, color: '#666', fontSize: '16px'}}>
                Loading {selectedBook.name} - Chapter {currentChapter}...
              </p>
            </div>
          ) : (
            <>
              {/* Chapter Content */}
              <div className="chapter-display" style={{
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                marginBottom: '30px'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: chapterContent }}
                  style={{
                    lineHeight: '1.8',
                    fontSize: '18px',
                    color: '#2c3e50'
                  }}
                />
              </div>
              
              {/* API Rate Limit Notice */}
              {navigationCooldown && cooldownRemaining > 0 && (
                <div style={{
                  backgroundColor: '#fff5f5',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '2px solid #fed7d7',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    color: '#e74c3c',
                    fontSize: '16px'
                  }}>
                    ⏱️ API Rate Limit Protection Active
                  </h4>
                  <p style={{
                    margin: '0',
                    color: '#c53030',
                    fontSize: '14px'
                  }}>
                    Next chapter available in <strong>{cooldownRemaining} seconds</strong>
                    <br />
                    <span style={{ fontSize: '12px', fontStyle: 'italic' }}>
                      This prevents API overload and ensures reliable service for everyone
                    </span>
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <button
                  onClick={handlePrevChapter}
                  disabled={currentChapter <= 1 || navigationCooldown || loading}
                  title={navigationCooldown && cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s - API Rate Limit` : ''}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (currentChapter <= 1 || navigationCooldown || loading) ? '#e9ecef' : '#6c757d',
                    color: (currentChapter <= 1 || navigationCooldown || loading) ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: (currentChapter <= 1 || navigationCooldown || loading) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    opacity: navigationCooldown ? 0.6 : 1
                  }}
                >
                  {navigationCooldown && cooldownRemaining > 0 ? `⏳ ${cooldownRemaining}s` : '← Previous Chapter'}
                </button>
                
                <div style={{
                  textAlign: 'center',
                  color: '#495057',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {selectedBook.name} - Chapter {currentChapter}
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                  <button
                    onClick={handleNextChapter}
                    disabled={currentChapter >= totalChapters || navigationCooldown || loading}
                    title={navigationCooldown && cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s - API Rate Limit` : ''}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: (currentChapter >= totalChapters || navigationCooldown || loading) ? '#e9ecef' : '#28a745',
                      color: (currentChapter >= totalChapters || navigationCooldown || loading) ? '#6c757d' : 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: (currentChapter >= totalChapters || navigationCooldown || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      opacity: navigationCooldown ? 0.6 : 1
                    }}
                  >
                    {navigationCooldown && cooldownRemaining > 0 ? `Next Chapter ⏳ ${cooldownRemaining}s` : 'Next Chapter →'}
                  </button>
                  
                  {/* Batch Loading Status Indicator */}
                  {batchLoadingStatus.loading && (
                    <div style={{
                      fontSize: '12px',
                      color: '#28a745',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontStyle: 'italic'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #28a745',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Preloading chapters ({batchLoadingStatus.count}/3)...
                    </div>
                  )}
                  
                  {/* API Rate Limit Cooldown Indicator */}
                  {navigationCooldown && cooldownRemaining > 0 && (
                    <div style={{
                      fontSize: '14px',
                      color: '#e74c3c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 'bold',
                      padding: '8px 12px',
                      backgroundColor: '#fff5f5',
                      borderRadius: '6px',
                      border: '1px solid #fed7d7'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #e74c3c',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      API Cooldown: {cooldownRemaining}s remaining
                    </div>
                  )}
                  
                  {/* Cached Status Indicator */}
                  {!batchLoadingStatus.loading && !navigationCooldown && currentChapter < totalChapters && 
                   chapterCache.has(getCacheKey(selectedBook, currentChapter + 1, selectedBibleId)) && (
                    <div style={{
                      fontSize: '12px',
                      color: '#28a745',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontStyle: 'italic'
                    }}>
                      ✓ Next chapters ready ({Math.min(3, totalChapters - currentChapter)} cached)
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default BibleReading;