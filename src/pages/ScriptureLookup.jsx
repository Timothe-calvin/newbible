import React, { useState, useEffect, useCallback } from 'react';
import bibleApi from '../services/bibleApi';

// --- Helper: Relevance Scoring for Keyword Search ---
const scoreResults = (results, query) => {
  if (!query || query.length <= 2) return results;
  const words = query.toLowerCase().split(/\s+/);
  return [...results].sort((a, b) => {
    const aText = a.text.toLowerCase();
    const bText = b.text.toLowerCase();
    let aScore = 0, bScore = 0;
    
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      aScore += (aText.match(regex) || []).length * 3;
      bScore += (bText.match(regex) || []).length * 3;
    });
    return bScore - aScore;
  });
};

function ScriptureLookup() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('auto');
  const [availableBibles, setAvailableBibles] = useState([]);
  const [selectedBibleId, setSelectedBibleId] = useState('');
  const [loadingBibles, setLoadingBibles] = useState(true);

  // Load Bible Versions on Mount
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const bibles = await bibleApi.getEnglishBibles();
        setAvailableBibles(bibles);
        // Use env default or first available bible
        setSelectedBibleId(import.meta.env.VITE_DEFAULT_BIBLE_ID || bibles[0]?.id);
      } catch  {
        setError('Error loading versions. Please check your API configuration.');
      } finally {
        setLoadingBibles(false);
      }
    };
    loadVersions();
  }, []);

  // Main Search Logic with Smart Fallback
  const executeSearch = useCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      let searchResults = [];
      const verseRef = bibleApi.parseVerseReference(trimmed);

      // STEP 1: Attempt Verse Reference Lookup
      if ((searchType === 'auto' || searchType === 'verse') && verseRef) {
        try {
          if (verseRef.includes('-')) {
            // Handle Ranges (e.g., Gen 1:1-3)
            const [startPath, endVerse] = verseRef.split('-');
            const pathParts = startPath.split('.');
            const startNum = parseInt(pathParts.pop());
            const bookAndChapter = pathParts.join('.');
            
            const promises = [];
            for (let i = startNum; i <= parseInt(endVerse) && i <= startNum + 12; i++) {
              promises.push(
                bibleApi.getPassage(`${bookAndChapter}.${i}`, selectedBibleId)
                  .catch(() => null)
              );
            }
            
            const passages = (await Promise.all(promises)).filter(p => p !== null);
            searchResults = passages.map(p => ({
              reference: p.reference,
              text: p.content.replace(/<[^>]*>/g, '').trim(), // Robust Regex
              type: 'specific'
            }));
          } else {
            // Single Verse
            const p = await bibleApi.getPassage(verseRef, selectedBibleId);
            if (p) {
              searchResults = [{
                reference: p.reference,
                text: p.content.replace(/<[^>]*>/g, '').trim(),
                type: 'specific'
              }];
            }
          }
        } catch  {
          console.warn("Reference lookup failed, will attempt keyword fallback.");
        }
      }

      // STEP 2: Keyword Fallback (if specific search failed or keyword mode active)
      if (searchResults.length === 0 && (searchType === 'keyword' || searchType === 'auto')) {
        const verses = await bibleApi.searchVerses(trimmed, 25, selectedBibleId);
        if (verses && verses.length > 0) {
          searchResults = verses.map(v => ({
            reference: v.reference,
            text: v.text.replace(/<[^>]*>/g, '').trim(),
            type: 'search',
            details: `Book: ${v.bookId} • Chapter: ${v.chapterNumber}`
          }));
          searchResults = scoreResults(searchResults, trimmed);
        }
      }

      if (searchResults.length > 0) {
        setResults(searchResults);
      } else {
        setError(`No results found for "${trimmed}". Try "John 3" or a keyword.`);
      }

    } catch (err) {
      console.error("Search failure:", err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBibleId, searchType]);

  // Debounce search when typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) executeSearch(query);
    }, 1000);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  if (loadingBibles) return <div style={styles.loader}>Accessing Bible Library...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Scripture Lookup</h1>
        <p style={styles.subtitle}>Find strength and wisdom in the Word</p>
      </header>

      {/* Control Panel */}
      <section style={styles.panel}>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Translation</label>
            <select 
              value={selectedBibleId} 
              onChange={(e) => setSelectedBibleId(e.target.value)} 
              style={styles.select}
            >
              {availableBibles.map(b => (
                <option key={b.id} value={b.id}>{b.abbreviation} - {b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Search Mode</label>
            <div style={styles.radioGroup}>
              {['auto', 'verse', 'keyword'].map(t => (
                <label key={t} style={styles.radioLabel}>
                  <input 
                    type="radio" 
                    value={t} 
                    checked={searchType === t} 
                    onChange={(e) => setSearchType(e.target.value)} 
                  />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.searchRow}>
          <input 
            type="text" 
            placeholder="Search e.g. 'Psalm 23' or 'Love'..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            style={styles.input}
          />
          <button onClick={() => executeSearch(query)} style={styles.button} disabled={loading}>
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </section>

      {/* Error Output */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Result Meta */}
      {!loading && results.length > 0 && (
        <div style={styles.stats}>
          Found {results.length} results in <strong>{availableBibles.find(b => b.id === selectedBibleId)?.abbreviation}</strong>
        </div>
      )}

      {/* Result List */}
      <div style={styles.resultsList}>
        {results.map((res, i) => (
          <article 
            key={i} 
            style={{
              ...styles.card, 
              borderLeft: res.type === 'specific' ? '5px solid #3182ce' : '5px solid #e2e8f0'
            }}
          >
            <div style={styles.cardHeader}>
              <h3 style={styles.cardRef}>{res.reference}</h3>
              {res.type === 'specific' && <span style={styles.badge}>Match</span>}
            </div>
            <p style={styles.cardText}>{res.text}</p>
            {res.details && <small style={styles.cardDetails}>{res.details}</small>}
          </article>
        ))}
      </div>
    </div>
  );
}

// --- Fully Fixed Styles ---
const styles = {
  container: { maxWidth: '850px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: { color: '#ffffff', fontSize: '2.5rem', fontWeight: '800', marginBottom: '5px' },
  subtitle: { color: '#718096', fontSize: '1.1rem' },
  panel: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginBottom: '30px', border: '1px solid #edf2f7' },
  row: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  label: { display: 'block', fontWeight: 'bold', fontSize: '12px', color: '#4a5568', marginBottom: '8px', textTransform: 'uppercase' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', backgroundColor: '#fff', color: '#2d3748', fontSize: '14px' },
  radioGroup: { display: 'flex', gap: '15px', alignItems: 'center', height: '45px' },
  radioLabel: { fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#2d3748', fontWeight: '600' },
  searchRow: { display: 'flex', gap: '10px' },
  // INPUT FIX: High contrast black text on white background
  input: { 
    flex: 1, 
    padding: '14px 18px', 
    borderRadius: '10px', 
    border: '2px solid #cbd5e0', 
    fontSize: '16px', 
    backgroundColor: '#ffffff', 
    color: '#000000', // Force black text
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
  },
  button: { padding: '0 30px', borderRadius: '10px', border: 'none', backgroundColor: '#3182ce', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  card: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #edf2f7' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  cardRef: { margin: 0, fontSize: '20px', color: '#2d3748', fontWeight: '700' },
  badge: { backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800' },
  cardText: { fontSize: '18px', lineHeight: '1.8', color: '#4a5568', fontFamily: 'Georgia, serif' },
  cardDetails: { color: '#a0aec0', marginTop: '10px', display: 'block', fontSize: '12px' },
  error: { color: '#c53030', padding: '15px', borderRadius: '10px', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', marginBottom: '20px', textAlign: 'center' },
  stats: { textAlign: 'center', color: '#718096', fontSize: '14px', marginBottom: '20px' },
  loader: { textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#3182ce', fontWeight: 'bold' }
};

export default ScriptureLookup;