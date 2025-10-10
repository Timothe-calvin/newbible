import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function BibleReading() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookContent, setBookContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  // Handle book selection - load entire book
  const handleBookSelect = async (book) => {
    setSelectedBook(book);
    setLoading(true);
    setBookContent('');
    
    try {
      // Get all chapters for the book
      const chapters = await bibleApi.getChapters(book.id, selectedBibleId);
      let fullBookContent = '';
      
      // Load each chapter sequentially
      for (const chapter of chapters) {
        try {
          const passageId = `${book.id}.${chapter.number}`;
          const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId);
          fullBookContent += `<div class="chapter-header"><h3>Chapter ${chapter.number}</h3></div>`;
          fullBookContent += chapterData.content;
          fullBookContent += '<div class="chapter-break"></div>';
        } catch (chapterError) {
          console.error(`Failed to load chapter ${chapter.number}:`, chapterError);
          fullBookContent += `<div class="chapter-error">Chapter ${chapter.number} could not be loaded.</div>`;
        }
      }
      
      setBookContent(fullBookContent);
    } catch (error) {
      console.error('Failed to load book:', error);
      setError('Failed to load book content.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reading the entire Bible from Genesis to Revelation
  const handleReadEntireBible = async () => {
    setLoading(true);
    setBookContent('');
    setSelectedBook({ name: 'The Holy Bible', id: 'ENTIRE_BIBLE' });
    
    try {
      let fullBibleContent = '';
      
      // Add Bible header
      fullBibleContent += `
        <div class="bible-header" style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px;">
          <h1 style="margin: 0 0 10px 0; font-size: 2.5em;">The Holy Bible</h1>
          <p style="margin: 0; font-size: 1.2em; opacity: 0.9;">From Genesis to Revelation</p>
        </div>
      `;
      
      // Load each book in canonical order
      for (const book of availableBooks) {
        try {
          // Get all chapters for the book
          const chapters = await bibleApi.getChapters(book.id, selectedBibleId);
          
          // Add book header
          const testament = isOldTestament(book.id) ? 'Old Testament' : 'New Testament';
          fullBibleContent += `
            <div class="book-header" style="margin: 50px 0 30px 0; padding: 20px; background: ${isOldTestament(book.id) ? '#8e44ad' : '#27ae60'}; color: white; border-radius: 10px; text-align: center;">
              <h2 style="margin: 0 0 5px 0; font-size: 2em;">${book.name}</h2>
              <p style="margin: 0; opacity: 0.9;">${testament}</p>
            </div>
          `;
          
          // Load each chapter
          for (const chapter of chapters) {
            try {
              const passageId = `${book.id}.${chapter.number}`;
              const chapterData = await bibleApi.getPassage(passageId, true, selectedBibleId);
              fullBibleContent += `<div class="chapter-header"><h3>${book.name} ${chapter.number}</h3></div>`;
              fullBibleContent += chapterData.content;
              fullBibleContent += '<div class="chapter-break"></div>';
            } catch (chapterError) {
              console.error(`Failed to load ${book.name} chapter ${chapter.number}:`, chapterError);
              fullBibleContent += `<div class="chapter-error">${book.name} ${chapter.number} could not be loaded.</div>`;
            }
          }
          
        } catch (bookError) {
          console.error(`Failed to load book ${book.name}:`, bookError);
          fullBibleContent += `<div class="chapter-error">The book of ${book.name} could not be loaded.</div>`;
        }
      }
      
      setBookContent(fullBibleContent);
    } catch (error) {
      console.error('Failed to load entire Bible:', error);
      setError('Failed to load the entire Bible. Please try selecting individual books.');
    } finally {
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
              <button
                onClick={() => handleReadEntireBible()}
                className="btn"
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '15px 25px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                📖 Read the Entire Bible (Genesis to Revelation)
              </button>
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
        // Full Book/Bible Content
        <>
          <div style={{marginBottom: '20px'}}>
            <button 
              onClick={() => setSelectedBook(null)}
              className="btn"
              style={{marginBottom: '15px'}}
            >
              ← Back to Books
            </button>
            <h3>{selectedBook.name}</h3>
            {availableBibles.find(b => b.id === selectedBibleId) && (
              <p style={{color: '#666'}}>
                {availableBibles.find(b => b.id === selectedBibleId).abbreviation} - {availableBibles.find(b => b.id === selectedBibleId).name}
              </p>
            )}
            <p style={{color: '#888', fontSize: '14px'}}>
              {selectedBook.id === 'ENTIRE_BIBLE' ? 'Reading the entire Bible from Genesis to Revelation' : 'Reading the entire book from beginning to end'}
            </p>
          </div>
          
          {error && (
            <div className="error-message">
              <p style={{color: 'red', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '5px', border: '1px solid #ffcccc'}}>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
          
          {loading ? (
            <div style={{textAlign: 'center', padding: '40px'}}>
              <p>Loading {selectedBook.name}...</p>
              <p style={{fontSize: '14px', color: '#666'}}>
                {selectedBook.id === 'ENTIRE_BIBLE' ? 'This will take several minutes as we load all 66 books' : 'This may take a moment as we load all chapters'}
              </p>
            </div>
          ) : (
            <div className="book-content" style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
              lineHeight: '1.8',
              fontSize: '18px'
            }}>
              <div 
                dangerouslySetInnerHTML={{ __html: bookContent }}
                style={{
                  textAlign: 'justify',
                  color: '#2c3e50'
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BibleReading;