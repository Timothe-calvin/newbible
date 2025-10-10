// Bible API Service
// Centralized service for all Bible API interactions

class BibleApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_BIBLE_API_KEY;
    this.baseUrl = import.meta.env.VITE_BIBLE_BASE_URL;
    this.defaultBibleId = import.meta.env.VITE_DEFAULT_BIBLE_ID;
    
    this.isConfigured = !!(this.apiKey && this.baseUrl && this.defaultBibleId);
    this.availableBibles = null; // Cache for available Bibles
    this.englishBibles = null; // Cache for English-only Bibles
    
    if (!this.isConfigured) {
      console.warn('Bible API not fully configured. Missing:', {
        apiKey: !this.apiKey,
        baseUrl: !this.baseUrl, 
        bibleId: !this.defaultBibleId
      });
    }
  }

  // Check if service is properly configured
  checkConfiguration() {
    if (!this.isConfigured) {
      const missing = [];
      if (!this.apiKey) missing.push('API key');
      if (!this.baseUrl) missing.push('base URL');
      if (!this.defaultBibleId) missing.push('Bible ID');
      
      throw new Error(`Bible API not configured. Missing: ${missing.join(', ')}`);
    }
  }

  // Get all available Bible versions
  async getAvailableBibles() {
    this.checkConfiguration();

    // Return cached result if available
    if (this.availableBibles) {
      return this.availableBibles;
    }

    try {
      const response = await fetch(`${this.baseUrl}/bibles`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available Bibles: ${response.status}`);
      }

      const data = await response.json();
      this.availableBibles = data.data || [];
      return this.availableBibles;
    } catch (error) {
      console.error('Error fetching available Bibles:', error);
      throw error;
    }
  }

  // Get English-only Bible versions
  async getEnglishBibles() {
    if (this.englishBibles) {
      return this.englishBibles;
    }

    try {
      const allBibles = await this.getAvailableBibles();
      
      // Filter for English Bibles only
      this.englishBibles = allBibles.filter(bible => {
        const lang = bible.language?.id?.toLowerCase() || '';
        const name = bible.name?.toLowerCase() || '';
        const abbr = bible.abbreviation?.toLowerCase() || '';
        
        return (
          lang === 'eng' || 
          lang === 'en' || 
          lang.includes('english') ||
          name.includes('english') ||
          // Common English Bible abbreviations
          ['kjv', 'niv', 'esv', 'nlt', 'nasb', 'nkjv', 'rsv', 'nrsv', 'msg', 'amp', 'tpt', 'cev', 'gnb', 'gnt', 'hcsb', 'csb', 'net', 'web'].includes(abbr)
        );
      }).sort((a, b) => {
        // Sort by popularity/common usage
        const popularOrder = ['kjv', 'niv', 'esv', 'nlt', 'nasb', 'nkjv'];
        const aIndex = popularOrder.indexOf(a.abbreviation?.toLowerCase());
        const bIndex = popularOrder.indexOf(b.abbreviation?.toLowerCase());
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      return this.englishBibles;
    } catch (error) {
      console.error('Error filtering English Bibles:', error);
      // Return default KJV if filtering fails
      return [{
        id: this.defaultBibleId,
        name: 'King James Version',
        abbreviation: 'KJV',
        language: { id: 'eng', name: 'English' }
      }];
    }
  }

  // Get request headers
  getHeaders() {
    return {
      'api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Fetch a specific verse or passage (with optional Bible version)
  async getPassage(passageId, includeVerseNumbers = true, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/passages/${passageId}${includeVerseNumbers ? '?include-verse-numbers=true' : ''}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch passage: ${response.status}`);
      }

      const data = await response.json();
      return {
        reference: data.data.reference,
        content: data.data.content,
        copyright: data.data.copyright,
        bibleId: selectedBibleId
      };
    } catch (error) {
      console.error('Error fetching passage:', error);
      throw error;
    }
  }

  // Search for verses by keywords (with optional Bible version)
  async searchVerses(query, limit = 15, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.verses) {
        return data.data.verses.map(verse => ({
          reference: verse.reference,
          text: verse.text.replace(/<[^>]*>/g, ''), // Remove HTML tags
          bibleId: selectedBibleId,
          bookId: verse.bookId,
          chapterNumber: verse.chapterNumber,
          verseNumber: verse.verseNumber
        }));
      }
      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      throw error;
    }
  }

  // Get a random verse (verse of the day)
  async getRandomVerse() {
    // Popular verses for daily inspiration
    const popularVerses = [
      'JHN.3.16', 'ROM.8.28', 'PHP.4.13', 'PSA.23.1', 'JER.29.11',
      'MAT.28.20', 'ROM.8.31', 'PSA.46.10', 'PRO.3.5-6', 'ISA.41.10',
      'ROM.12.2', 'GAL.2.20', 'EPH.2.8-9', 'JHN.14.6', 'PSA.119.105'
    ];

    const randomIndex = Math.floor(Math.random() * popularVerses.length);
    const verseId = popularVerses[randomIndex];

    try {
      return await this.getPassage(verseId);
    } catch {
      // Fallback verse if API fails
      return {
        reference: 'John 3:16',
        content: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        copyright: 'Public Domain'
      };
    }
  }

  // Get canonical order for Bible books
  getCanonicalOrder() {
    return [
      // Old Testament
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
      '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST',
      'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK',
      'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB',
      'ZEP', 'HAG', 'ZEC', 'MAL',
      // New Testament
      'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL',
      'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM',
      'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
    ];
  }

  // Sort books in canonical order
  sortBooksCanonically(books) {
    const canonicalOrder = this.getCanonicalOrder();
    
    return books.sort((a, b) => {
      const aIndex = canonicalOrder.indexOf(a.id);
      const bIndex = canonicalOrder.indexOf(b.id);
      
      // If both books are in canonical order, sort by that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is in canonical order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in canonical order, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }

  // Get available books (with optional Bible version) - returns books in canonical order
  async getBooks(bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/books`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.status}`);
      }

      const data = await response.json();
      const books = data.data || [];
      
      // Return books sorted in canonical order
      return this.sortBooksCanonically(books);
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  // Get chapters for a specific book (with optional Bible version)
  async getChapters(bookId, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/books/${bookId}/chapters`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  }

  // Get verses for a specific chapter (with optional Bible version)
  async getVerses(bookId, chapterNumber, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/books/${bookId}/chapters/${chapterNumber}/verses`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch verses: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching verses:', error);
      throw error;
    }
  }

  // Parse verse reference string to API format
  parseVerseReference(reference) {
    const patterns = [
      // Pattern for "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
      /^(\d?\s?\w+(?:\s+\w+)*)\s+(\d+):(\d+)(?:-(\d+))?$/i,
      // Pattern for "Book Chapter" (whole chapter)
      /^(\d?\s?\w+(?:\s+\w+)*)\s+(\d+)$/i
    ];

    for (const pattern of patterns) {
      const match = reference.trim().match(pattern);
      if (match) {
        const book = match[1].trim();
        const chapter = match[2];
        const startVerse = match[3];
        const endVerse = match[4];
        
        // Convert book name to API format (abbreviated)
        const bookId = this.getBookId(book);
        
        if (startVerse && endVerse && startVerse !== endVerse) {
          // Range of verses
          return `${bookId}.${chapter}.${startVerse}-${bookId}.${chapter}.${endVerse}`;
        } else if (startVerse) {
          // Single verse
          return `${bookId}.${chapter}.${startVerse}`;
        } else {
          // Whole chapter
          return `${bookId}.${chapter}`;
        }
      }
    }
    return null;
  }

  // Convert book names to API book IDs
  getBookId(bookName) {
    const bookMap = {
      // Old Testament
      'genesis': 'GEN', 'gen': 'GEN',
      'exodus': 'EXO', 'exo': 'EXO',
      'leviticus': 'LEV', 'lev': 'LEV',
      'numbers': 'NUM', 'num': 'NUM',
      'deuteronomy': 'DEU', 'deut': 'DEU',
      'joshua': 'JOS', 'josh': 'JOS',
      'judges': 'JDG', 'judg': 'JDG',
      'ruth': 'RUT',
      '1 samuel': '1SA', '1sam': '1SA', '1 sam': '1SA',
      '2 samuel': '2SA', '2sam': '2SA', '2 sam': '2SA',
      '1 kings': '1KI', '1ki': '1KI',
      '2 kings': '2KI', '2ki': '2KI',
      '1 chronicles': '1CH', '1chr': '1CH',
      '2 chronicles': '2CH', '2chr': '2CH',
      'ezra': 'EZR',
      'nehemiah': 'NEH', 'neh': 'NEH',
      'esther': 'EST',
      'job': 'JOB',
      'psalms': 'PSA', 'psalm': 'PSA', 'ps': 'PSA',
      'proverbs': 'PRO', 'prov': 'PRO',
      'ecclesiastes': 'ECC', 'eccl': 'ECC',
      'song of solomon': 'SNG', 'song': 'SNG',
      'isaiah': 'ISA', 'isa': 'ISA',
      'jeremiah': 'JER', 'jer': 'JER',
      'lamentations': 'LAM', 'lam': 'LAM',
      'ezekiel': 'EZK', 'ezek': 'EZK',
      'daniel': 'DAN', 'dan': 'DAN',
      'hosea': 'HOS',
      'joel': 'JOL',
      'amos': 'AMO',
      'obadiah': 'OBA',
      'jonah': 'JON',
      'micah': 'MIC',
      'nahum': 'NAM',
      'habakkuk': 'HAB',
      'zephaniah': 'ZEP',
      'haggai': 'HAG',
      'zechariah': 'ZEC',
      'malachi': 'MAL',
      
      // New Testament
      'matthew': 'MAT', 'matt': 'MAT', 'mt': 'MAT',
      'mark': 'MRK', 'mk': 'MRK',
      'luke': 'LUK', 'lk': 'LUK',
      'john': 'JHN', 'jn': 'JHN',
      'acts': 'ACT',
      'romans': 'ROM', 'rom': 'ROM',
      '1 corinthians': '1CO', '1cor': '1CO', '1 cor': '1CO',
      '2 corinthians': '2CO', '2cor': '2CO', '2 cor': '2CO',
      'galatians': 'GAL', 'gal': 'GAL',
      'ephesians': 'EPH', 'eph': 'EPH',
      'philippians': 'PHP', 'phil': 'PHP',
      'colossians': 'COL', 'col': 'COL',
      '1 thessalonians': '1TH', '1thess': '1TH', '1 thess': '1TH',
      '2 thessalonians': '2TH', '2thess': '2TH', '2 thess': '2TH',
      '1 timothy': '1TI', '1tim': '1TI', '1 tim': '1TI',
      '2 timothy': '2TI', '2tim': '2TI', '2 tim': '2TI',
      'titus': 'TIT',
      'philemon': 'PHM', 'phlm': 'PHM',
      'hebrews': 'HEB', 'heb': 'HEB',
      'james': 'JAS', 'jas': 'JAS',
      '1 peter': '1PE', '1pet': '1PE', '1 pet': '1PE',
      '2 peter': '2PE', '2pet': '2PE', '2 pet': '2PE',
      '1 john': '1JN', '1jn': '1JN',
      '2 john': '2JN', '2jn': '2JN',
      '3 john': '3JN', '3jn': '3JN',
      'jude': 'JUD',
      'revelation': 'REV', 'rev': 'REV'
    };

    const normalizedName = bookName.toLowerCase().trim();
    return bookMap[normalizedName] || bookName.toUpperCase().replace(/\s+/g, '');
  }
}

// Export singleton instance
export const bibleApi = new BibleApiService();
export default bibleApi;