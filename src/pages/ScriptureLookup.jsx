import React, { useState, useEffect } from 'react';
import bibleApi from '../services/bibleApi';

function ScriptureLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('auto'); // 'auto', 'verse', 'keyword'
  
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

  // Handle Bible version change
  const handleBibleVersionChange = async (newBibleId) => {
    setSelectedBibleId(newBibleId);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      let searchResults = [];

      // Determine search type
      const verseReference = bibleApi.parseVerseReference(query);
      
      if (searchType === 'verse' || (searchType === 'auto' && verseReference)) {
        // Try to fetch specific verse/passage using the selected Bible version
        if (verseReference) {
          try {
            const passage = await bibleApi.getPassage(verseReference, true, selectedBibleId);
            searchResults = [{
              reference: passage.reference,
              text: passage.content.replace(/<[^>]*>/g, ''),
              type: 'specific',
              bibleId: selectedBibleId
            }];
          } catch {
            throw new Error('Invalid verse reference format. Try "John 3:16" or "Romans 8:28-30"');
          }
        } else {
          throw new Error('Invalid verse reference format. Try "John 3:16" or "Romans 8:28-30"');
        }
      } else {
        // Search by keywords using the selected Bible version
        const verses = await bibleApi.searchVerses(query, 15, selectedBibleId);
        searchResults = verses.map(verse => ({
          reference: verse.reference,
          text: verse.text,
          type: 'search',
          bibleId: selectedBibleId
        }));
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

          <div className="search-box">
            <input
              type="text"
              placeholder={
                searchType === 'verse' 
                  ? "e.g., John 3:16, Romans 8:28-30, 1 Corinthians 13" 
                  : searchType === 'keyword'
                  ? "e.g., love, faith, hope, salvation"
                  : "John 3:16, love, faith, Romans 8:28-30..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
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

          {/* Search Results */}
          {error && (
            <div className="error-message">
              <p style={{color: 'red', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '5px', border: '1px solid #ffcccc'}}>
                <strong>Error:</strong> {error}
              </p>
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
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
                border: result.type === 'specific' ? '2px solid #3498db' : '1px solid #eee'
              }}>
                <h3 style={{color: '#3498db', marginBottom: '10px', fontSize: '18px'}}>
                  {result.reference}
                  {result.type === 'specific' && <span style={{fontSize: '12px', color: '#27ae60', marginLeft: '10px'}}>📍 Exact Match</span>}
                </h3>
                <div 
                  style={{
                    fontSize: '16px', 
                    lineHeight: '1.6', 
                    color: '#2c3e50',
                    textAlign: 'justify'
                  }}
                  dangerouslySetInnerHTML={{ __html: result.text }}
                />
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

export default ScriptureLookup;