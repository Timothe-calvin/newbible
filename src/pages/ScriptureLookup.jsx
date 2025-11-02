import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function ScriptureLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('auto'); // 'auto', 'verse', 'keyword'
  const [searchCache, setSearchCache] = useState(new Map());
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  // Bible version and navigation state
  const [availableBibles, setAvailableBibles] = useState([]);
  const [selectedBibleId, setSelectedBibleId] = useState('');
  const [loadingBibles, setLoadingBibles] = useState(true);




  // Load available Bible versions on component mount
  useEffect(() => {
    const loadBibleVersions = async () => {
      try {
        const englishBibles = await bibleApi.getEnglishBibles();
        setAvailableBibles(englishBibles);
        
        // Set default Bible ID from env or first available
        const defaultId = import.meta.env.VITE_DEFAULT_BIBLE_ID || englishBibles[0]?.id;
        setSelectedBibleId(defaultId);
        

      } catch (error) {
        console.error('Failed to load Bible versions:', error);
        setError('Failed to load Bible versions. Using default settings.');
      } finally {
        setLoadingBibles(false);
      }
    };

    loadBibleVersions();
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Handle Bible version change
  const handleBibleVersionChange = async (newBibleId) => {
    setSelectedBibleId(newBibleId);
  };

  const handleSearch = async (searchQuery = query, immediate = false) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    // Check cache first for faster results
    const cacheKey = `${selectedBibleId}-${trimmedQuery}-${searchType}`;
    if (searchCache.has(cacheKey) && !immediate) {
      console.log('🔍 Returning cached search results');
      setResults(searchCache.get(cacheKey));
      setError('');
      return;
    }
    
    setLoading(true);
    setError('');
    if (immediate) setResults([]);
    
    try {
      let searchResults = [];

      // Determine search type
      const verseReference = bibleApi.parseVerseReference(trimmedQuery);
      
      if (searchType === 'verse' || (searchType === 'auto' && verseReference)) {
        // Handle verse/passage lookup with enhanced performance
        if (verseReference) {
          try {
            // For range references, try to get multiple verses concurrently
            if (verseReference.includes('-') && !verseReference.includes('.')) {
              // Handle ranges like "John 3:16-18"
              const parts = verseReference.split('-');
              if (parts.length === 2) {
                const startRef = parts[0];
                const endVerse = parts[1];
                const baseRef = startRef.substring(0, startRef.lastIndexOf('.'));
                
                // Create array of individual verse references
                const startVerse = parseInt(startRef.split('.').pop());
                const endVerseNum = parseInt(endVerse);
                const verseRefs = [];
                
                for (let i = startVerse; i <= endVerseNum && i <= startVerse + 10; i++) {
                  verseRefs.push(`${baseRef}.${i}`);
                }
                
                // Fetch verses concurrently
                const versePromises = verseRefs.map(async (ref) => {
                  try {
                    return await bibleApi.getPassage(ref, true, selectedBibleId);
                  } catch (error) {
                    console.error(`Failed to fetch verse ${ref}:`, error);
                    return null;
                  }
                });
                
                const passages = await Promise.all(versePromises);
                const validPassages = passages.filter(p => p !== null);
                
                if (validPassages.length > 0) {
                  searchResults = validPassages.map(passage => ({
                    reference: passage.reference,
                    text: passage.content.replace(/<[^>]*>/g, ''),
                    type: 'specific',
                    bibleId: selectedBibleId
                  }));
                }
              }
            } else {
              // Single verse or chapter
              const passage = await bibleApi.getPassage(verseReference, true, selectedBibleId);
              searchResults = [{
                reference: passage.reference,
                text: passage.content.replace(/<[^>]*>/g, ''),
                type: 'specific',
                bibleId: selectedBibleId
              }];
            }
          } catch {
            throw new Error('Invalid verse reference format. Try "John 3:16" or "Romans 8:28-30"');
          }
        } else {
          throw new Error('Invalid verse reference format. Try "John 3:16" or "Romans 8:28-30"');
        }
      } else {
        // Enhanced keyword search with better performance
        const searchLimit = 20; // Increased limit for better results
        const verses = await bibleApi.searchVerses(trimmedQuery, searchLimit, selectedBibleId);
        
        // Process results with better formatting
        searchResults = verses.map(verse => ({
          reference: verse.reference,
          text: verse.text.replace(/<[^>]*>/g, ''), // Remove HTML tags
          type: 'search',
          bibleId: selectedBibleId,
          bookId: verse.bookId,
          chapterNumber: verse.chapterNumber,
          verseNumber: verse.verseNumber
        }));

        // Sort results by relevance (books closer to query match first)
        if (trimmedQuery.length > 2) {
          const queryWords = trimmedQuery.toLowerCase().split(/\s+/);
          searchResults.sort((a, b) => {
            const aText = a.text.toLowerCase();
            const bText = b.text.toLowerCase();
            
            let aScore = 0;
            let bScore = 0;
            
            queryWords.forEach(word => {
              // Count exact matches
              const aExact = (aText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
              const bExact = (bText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
              
              aScore += aExact * 3; // Weight exact matches higher
              bScore += bExact * 3;
              
              // Count partial matches
              const aPartial = (aText.match(new RegExp(word, 'g')) || []).length - aExact;
              const bPartial = (bText.match(new RegExp(word, 'g')) || []).length - bExact;
              
              aScore += aPartial;
              bScore += bPartial;
            });
            
            return bScore - aScore; // Higher score first
          });
        }
      }

      // Cache successful results
      if (searchResults.length > 0) {
        const newCache = new Map(searchCache);
        newCache.set(cacheKey, searchResults);
        
        // Limit cache size to prevent memory issues
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        
        setSearchCache(newCache);
      }

      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError('No verses found. Try different keywords or check your verse reference format.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search verses. Please try again.');
    }
    
    setLoading(false);
  };

  // Debounced search for real-time typing
  const handleQueryChange = (newQuery) => {
    setQuery(newQuery);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for auto-search after user stops typing
    if (newQuery.trim() && newQuery.length > 2) {
      const timer = setTimeout(() => {
        handleSearch(newQuery, false);
      }, 800); // Wait 800ms after user stops typing
      
      setDebounceTimer(timer);
    } else {
      setResults([]);
      setError('');
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
      <h1>🕊️ Scripture Lookup</h1>
      <p>Search for specific Bible verses, verse ranges, or find verses by keywords across different Bible versions</p>
      
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

      {/* Search Interface */}
      <div className="search-interface">
        {/* Search Type Selector */}
          <div className="search-type-selector" style={{marginBottom: '20px'}}>
            <label style={{marginRight: '20px', fontWeight: 'bold'}}>Search Type:</label>
            <label style={{marginRight: '15px'}}>
              <input 
                type="radio" 
                value="auto" 
                checked={searchType === 'auto'} 
                onChange={(e) => setSearchType(e.target.value)}
                style={{marginRight: '5px'}}
              />
              Auto-detect
            </label>
            <label style={{marginRight: '15px'}}>
              <input 
                type="radio" 
                value="verse" 
                checked={searchType === 'verse'} 
                onChange={(e) => setSearchType(e.target.value)}
                style={{marginRight: '5px'}}
              />
              Specific Verse
            </label>
            <label>
              <input 
                type="radio" 
                value="keyword" 
                checked={searchType === 'keyword'} 
                onChange={(e) => setSearchType(e.target.value)}
                style={{marginRight: '5px'}}
              />
              Keyword Search
            </label>
          </div>

          <div className="search-box" style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            border: '1px solid #f0f0f0'
          }}>
            <input
              type="text"
              placeholder={
                searchType === 'verse' 
                  ? "e.g., John 3:16, Romans 8:28-30, 1 Corinthians 13" 
                  : searchType === 'keyword'
                  ? "e.g., love, faith, hope, salvation"
                  : "John 3:16, love, faith, Romans 8:28-30... (auto-search as you type)"
              }
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(query, true)}
              style={{
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                marginRight: '10px',
                flex: 1,
                transition: 'border-color 0.3s ease'
              }}
            />
            <button 
              onClick={() => handleSearch(query, true)} 
              disabled={loading || !query.trim()}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#bdc3c7' : '#3498db',
                color: 'white',
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s ease',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Searching...' : 'Search Now'}
            </button>
          </div>

          {/* Search Examples */}
          <div className="search-examples" style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
            <h4 style={{margin: '0 0 10px 0', color: '#2c3e50'}}>Search Examples:</h4>
            <div style={{fontSize: '14px', color: '#666'}}>
              <p style={{margin: '5px 0'}}><strong>Specific Verses:</strong> John 3:16, Romans 8:28, 1 Corinthians 13:4-7</p>
              <p style={{margin: '5px 0'}}><strong>Whole Chapters:</strong> Psalm 23, John 14, Romans 8</p>
              <p style={{margin: '5px 0'}}><strong>Keywords:</strong> love, faith, hope, salvation, forgiveness</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '30px',
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
                Searching for "{query}"...
              </p>
              <p style={{margin: '5px 0 0 0', color: '#999', fontSize: '14px'}}>
                {searchType === 'verse' ? 'Looking up specific verse' : 'Searching through scripture'}
              </p>
            </div>
          )}

          {/* Search Results */}
          {error && (
            <div className="error-message">
              <div style={{
                padding: '20px',
                backgroundColor: '#fff5f5',
                borderRadius: '12px',
                border: '2px solid #fed7d7',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                marginBottom: '20px'
              }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                  <span style={{fontSize: '24px', marginRight: '10px'}}>⚠️</span>
                  <strong style={{color: '#e53e3e', fontSize: '18px'}}>Search Error</strong>
                </div>
                <p style={{color: '#c53030', margin: '0 0 15px 0', lineHeight: 1.5}}>
                  {error}
                </p>
                <button
                  onClick={() => handleSearch(query, true)}
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

          <div className="results">
            {results.length === 0 && !loading && !error && query && (
              <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                <p>No verses found for "{query}".</p>
                <p>Try different keywords or check your verse reference format.</p>
              </div>
            )}
            
            {results.length > 0 && (
              <div style={{marginBottom: '15px', color: '#666'}}>
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                {availableBibles.find(b => b.id === selectedBibleId) && (
                  <span> in {availableBibles.find(b => b.id === selectedBibleId).abbreviation}</span>
                )}
              </div>
            )}
            
            {results.map((result, index) => (
              <div key={index} className="result-card" style={{
                marginBottom: '25px',
                padding: '25px',
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                border: result.type === 'specific' ? '3px solid #3498db' : '1px solid #f0f0f0',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = result.type === 'specific' 
                  ? '0 5px 20px rgba(0,0,0,0.08)' 
                  : '0 5px 20px rgba(0,0,0,0.08)';
              }}>
                {result.type === 'specific' && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '20px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    padding: '5px 15px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)'
                  }}>
                    📍 Exact Match
                  </div>
                )}
                
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                  <h3 style={{
                    color: result.type === 'specific' ? '#3498db' : '#2c3e50',
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    flex: 1
                  }}>
                    {result.reference}
                  </h3>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    backgroundColor: '#ecf0f1',
                    padding: '4px 10px',
                    borderRadius: '15px',
                    fontWeight: 'bold'
                  }}>
                    {availableBibles.find(b => b.id === selectedBibleId)?.abbreviation || 'KJV'}
                  </div>
                </div>
                
                <div 
                  style={{
                    fontSize: '17px',
                    lineHeight: '1.7',
                    color: '#2c3e50',
                    textAlign: 'justify',
                    fontFamily: 'Georgia, serif',
                    letterSpacing: '0.3px'
                  }}
                >
                  {result.text}
                </div>
                
                {result.type === 'search' && result.bookId && (
                  <div style={{
                    marginTop: '15px',
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#6c757d',
                    borderLeft: '4px solid #3498db'
                  }}>
                    📚 Book: {result.bookId} • Chapter: {result.chapterNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

export default ScriptureLookup;