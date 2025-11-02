import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function BibleReading() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [chapterList, setChapterList] = useState([]);
  
  // Bible version state
  const [availableBibles, setAvailableBibles] = useState([]);
  const [selectedBibleId, setSelectedBibleId] = useState('');
  const [loadingBibles, setLoadingBibles] = useState(true);
  const [availableBooks, setAvailableBooks] = useState([]);

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
    setBookContent('');
    
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
    
    try {
      // Get all chapters for the book
      const chapters = await bibleApi.getChapters(book.id, selectedBibleId);
      
      // Filter out non-numeric chapters (like intro)
      const validChapters = chapters.filter(chapter => 
        chapter.number && !isNaN(chapter.number) && chapter.id !== 'intro'
      );
      
      setChapterList(validChapters);
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
      const passageId = `${book.id}.${chapterNumber}`;
      const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId);
      
      // Get chapter introduction
      const chapterIntro = getChapterIntro(book.name, chapterNumber);
      
      const content = `
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
      
      setChapterContent(content);
      setCurrentChapter(chapterNumber);
      setLoading(false);
      
    } catch (error) {
      console.error(`Failed to load chapter ${chapterNumber}:`, error);
      setError(`Failed to load chapter ${chapterNumber}. Please try again.`);
      setLoading(false);
    }
  };

  // Navigate to next chapter
  const handleNextChapter = () => {
    if (currentChapter < totalChapters) {
      loadChapter(selectedBook, currentChapter + 1);
    }
  };

  // Navigate to previous chapter
  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      loadChapter(selectedBook, currentChapter - 1);
    }
  };

  // Navigate to specific chapter
  const handleGoToChapter = (chapterNumber) => {
    if (chapterNumber >= 1 && chapterNumber <= totalChapters) {
      loadChapter(selectedBook, chapterNumber);
    }
  };

  // Handle reading the entire Bible from Genesis to Revelation (optimized)
  const handleReadEntireBible = async () => {
    setLoading(true);
    setBookContent('');
    setSelectedBook({ name: 'The Holy Bible', id: 'ENTIRE_BIBLE' });
    setError('');
    
    try {
      // Add Bible header immediately
      let initialContent = `
        <div class="bible-header" style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px;">
          <h1 style="margin: 0 0 10px 0; font-size: 2.5em;">The Holy Bible</h1>
          <p style="margin: 0; font-size: 1.2em; opacity: 0.9;">From Genesis to Revelation</p>
          <p style="margin: 10px 0 0 0; font-size: 0.9em; opacity: 0.8;">Loading books progressively for better performance...</p>
        </div>
      `;
      
      setBookContent(initialContent);
      setLoading(false);
      
      // Process books in smaller batches for better user experience
      const booksPerBatch = 3; // Process 3 books at a time
      
      for (let i = 0; i < availableBooks.length; i += booksPerBatch) {
        const bookBatch = availableBooks.slice(i, i + booksPerBatch);
        
        // Process books in parallel within each batch
        const bookPromises = bookBatch.map(async (book) => {
          try {
            // Get all chapters for the book
            const chapters = await bibleApi.getChapters(book.id, selectedBibleId);
            
            let bookContent = '';
            
            // Add book header
            const testament = isOldTestament(book.id) ? 'Old Testament' : 'New Testament';
            bookContent += `
              <div class="book-header" style="margin: 50px 0 30px 0; padding: 20px; background: ${isOldTestament(book.id) ? '#8e44ad' : '#27ae60'}; color: white; border-radius: 10px; text-align: center;">
                <h2 style="margin: 0 0 5px 0; font-size: 2em;">${book.name}</h2>
                <p style="margin: 0; opacity: 0.9;">${testament}</p>
              </div>
            `;
            
            // Load first few chapters immediately, then load rest progressively
            const firstChapters = chapters.slice(0, 2);
            const remainingChapters = chapters.slice(2);
            
            // Filter out non-numeric chapters (like intro) and load first chapters sequentially
            const validFirstChapters = firstChapters.filter(chapter => 
              chapter.number && !isNaN(chapter.number) && chapter.id !== 'intro'
            );
            
            const firstChapterPromises = validFirstChapters.map(async (chapter, index) => {
              try {
                // Add small delay between requests to prevent rate limiting
                if (index > 0) {
                  await new Promise(resolve => setTimeout(resolve, 200 * index));
                }
                
                const passageId = `${book.id}.${chapter.number}`;
                const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId);
                return {
                  number: chapter.number,
                  content: chapterData.content,
                  success: true
                };
              } catch (error) {
                console.error(`Failed to load ${book.name} chapter ${chapter.number}:`, error);
                return {
                  number: chapter.number,
                  content: `<div class="chapter-error">${book.name} ${chapter.number} could not be loaded.</div>`,
                  success: false
                };
              }
            });
            
            const firstChapterResults = await Promise.all(firstChapterPromises);
            firstChapterResults
              .sort((a, b) => a.number - b.number)
              .forEach(result => {
                // Add proper chapter introduction
                const chapterIntro = getChapterIntro(book.name, result.number);
                bookContent += `
                  <div class="chapter-container">
                    <div class="chapter-header">
                      <h3 class="chapter-title">${book.name} - Chapter ${result.number}</h3>
                      ${chapterIntro ? `<div class="chapter-intro">${chapterIntro}</div>` : ''}
                    </div>
                    <div class="chapter-content">
                      ${result.content}
                    </div>
                  </div>
                  <div class="chapter-break"></div>
                `;
              });
            
            // Add remaining chapters (will be loaded later)
            if (remainingChapters.length > 0) {
              bookContent += `<div class="loading-placeholder" data-book="${book.id}" data-start-chapter="${remainingChapters[0].number}">
                <p style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                  <em>Loading remaining chapters of ${book.name}...</em>
                </p>
              </div>`;
            }
            
            return {
              bookId: book.id,
              bookName: book.name,
              content: bookContent,
              remainingChapters: remainingChapters,
              success: true
            };
            
          } catch (error) {
            console.error(`Failed to load book ${book.name}:`, error);
            return {
              bookId: book.id,
              bookName: book.name,
              content: `<div class="chapter-error">The book of ${book.name} could not be loaded.</div>`,
              remainingChapters: [],
              success: false
            };
          }
        });
        
        // Wait for this batch of books
        const bookResults = await Promise.all(bookPromises);
        
        // Append books to content
        let batchContent = '';
        bookResults.forEach(result => {
          batchContent += result.content;
        });
        
        setBookContent(prev => prev + batchContent);
        
        // Load remaining chapters for books in this batch with proper rate limiting
        for (const bookResult of bookResults) {
          if (bookResult.remainingChapters.length > 0) {
            // Load remaining chapters sequentially to prevent rate limiting
            setTimeout(async () => {
              try {
                // Filter out invalid chapters
                const validRemainingChapters = bookResult.remainingChapters.filter(chapter => 
                  chapter.number && !isNaN(chapter.number) && chapter.id !== 'intro'
                );
                
                // Load chapters sequentially instead of concurrently to prevent rate limiting
                const chapterResults = [];
                for (let i = 0; i < validRemainingChapters.length; i++) {
                  const chapter = validRemainingChapters[i];
                  
                  try {
                    // Add delay between each request to prevent rate limiting
                    if (i > 0) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    
                    const passageId = `${bookResult.bookId}.${chapter.number}`;
                    const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId);
                    chapterResults.push({
                      number: chapter.number,
                      content: chapterData.content
                    });
                  } catch (error) {
                    console.error(`Failed to load ${bookResult.bookName} chapter ${chapter.number}:`, error);
                    chapterResults.push({
                      number: chapter.number,
                      content: `<div class="chapter-error">${bookResult.bookName} ${chapter.number} could not be loaded. <button onclick="window.location.reload()">Retry</button></div>`
                    });
                  }
                }
                
                let chaptersContent = '';
                chapterResults
                  .sort((a, b) => a.number - b.number)
                  .forEach(result => {
                    // Add proper chapter introduction
                    const chapterIntro = getChapterIntro(bookResult.bookName, result.number);
                    chaptersContent += `
                      <div class="chapter-container">
                        <div class="chapter-header">
                          <h3 class="chapter-title">${bookResult.bookName} - Chapter ${result.number}</h3>
                          ${chapterIntro ? `<div class="chapter-intro">${chapterIntro}</div>` : ''}
                        </div>
                        <div class="chapter-content">
                          ${result.content}
                        </div>
                      </div>
                      <div class="chapter-break"></div>
                    `;
                  });
                
                // Replace loading placeholder
                setBookContent(prev => {
                  const placeholder = `<div class="loading-placeholder" data-book="${bookResult.bookId}" data-start-chapter="${bookResult.remainingChapters[0].number}">
                <p style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                  <em>Loading remaining chapters of ${bookResult.bookName}...</em>
                </p>
              </div>`;
                  return prev.replace(placeholder, chaptersContent);
                });
                
              } catch (error) {
                console.error(`Failed to load remaining chapters for ${bookResult.bookName}:`, error);
              }
            }, 1000 + (i * 500)); // Stagger the loading
          }
        }
        
        // Small delay between book batches to prevent API overwhelming
        if (i + booksPerBatch < availableBooks.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
    } catch (error) {
      console.error('Failed to load entire Bible:', error);
      setError('Failed to load the entire Bible. Please try selecting individual books instead.');
      setLoading(false);
    }
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
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <label style={{fontSize: '14px', color: '#666'}}>Jump to:</label>
                  <select 
                    value={currentChapter} 
                    onChange={(e) => handleGoToChapter(parseInt(e.target.value))}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    {Array.from({length: totalChapters}, (_, i) => (
                      <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                    ))}
                  </select>
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
                  disabled={currentChapter <= 1}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: currentChapter <= 1 ? '#e9ecef' : '#6c757d',
                    color: currentChapter <= 1 ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: currentChapter <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ← Previous Chapter
                </button>
                
                <div style={{
                  textAlign: 'center',
                  color: '#495057',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {selectedBook.name} - Chapter {currentChapter}
                </div>
                
                <button
                  onClick={handleNextChapter}
                  disabled={currentChapter >= totalChapters}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: currentChapter >= totalChapters ? '#e9ecef' : '#28a745',
                    color: currentChapter >= totalChapters ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: currentChapter >= totalChapters ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next Chapter →
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default BibleReading;