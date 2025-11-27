// Bible API Service
// Centralized service for all Bible API interactions with performance optimization

import apiUtils from './apiUtils.js';

class BibleApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_BIBLE_API_KEY;
    this.baseUrl = import.meta.env.VITE_BIBLE_BASE_URL;
    this.defaultBibleId = import.meta.env.VITE_DEFAULT_BIBLE_ID;
    
    this.isConfigured = !!(this.apiKey && this.baseUrl && this.defaultBibleId);
    
    // Enhanced caching with TTL
    this.biblesCache = apiUtils.createCache(60 * 60 * 1000); // 1 hour
    this.englishBiblesCache = apiUtils.createCache(2 * 60 * 60 * 1000); // 2 hours
    this.booksCache = apiUtils.createCache(30 * 60 * 1000); // 30 minutes
    this.passageCache = apiUtils.createCache(15 * 60 * 1000); // 15 minutes
    this.searchCache = apiUtils.createCache(5 * 60 * 1000); // 5 minutes
    
    // Performance monitoring
    this.performanceMonitor = apiUtils.createPerformanceMonitor();
    
    // GLOBAL RATE LIMITING & QUEUE SYSTEM
    this.rateLimiter = apiUtils.createRateLimiter(3, 60000); // 3 requests per minute
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.globalCooldownUntil = 0;
    
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

  // Global API request queue to prevent rate limiting
  async queueRequest(requestFunction, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const request = {
        id: Date.now() + Math.random(),
        function: requestFunction,
        priority: priority,
        resolve: resolve,
        reject: reject,
        timestamp: Date.now()
      };

      // Add to appropriate position in queue based on priority
      if (priority === 'high') {
        this.requestQueue.unshift(request);
      } else {
        this.requestQueue.push(request);
      }

      console.log(`📋 Queued API request (${priority} priority). Queue size: ${this.requestQueue.length}`);
      
      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  // Process the request queue with proper rate limiting
  async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    console.log(`🔄 Starting queue processing. ${this.requestQueue.length} requests pending`);

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      
      // Check if we're in a global cooldown period
      if (now < this.globalCooldownUntil) {
        const waitTime = this.globalCooldownUntil - now;
        console.log(`⏳ Global cooldown active. Waiting ${Math.ceil(waitTime/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Ensure 6 seconds between requests for faster loading
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < 6000) {
        const waitTime = 6000 - timeSinceLastRequest;
        console.log(`⏱️ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Process next request
      const request = this.requestQueue.shift();
      if (!request) continue;

      try {
        console.log(`🚀 Processing API request ${request.id}`);
        this.lastRequestTime = Date.now();
        
        const result = await request.function();
        request.resolve(result);
        
        console.log(`✅ API request ${request.id} completed successfully`);
        
      } catch (error) {
        console.error(`❌ API request ${request.id} failed:`, error);
        
        // If rate limited, set global cooldown
        if (error.message && error.message.includes('Rate limit')) {
          const waitMatch = error.message.match(/Wait (\d+)ms/);
          if (waitMatch) {
            const waitTime = parseInt(waitMatch[1]);
            this.globalCooldownUntil = Date.now() + waitTime;
            console.log(`🚫 Rate limited! Setting global cooldown for ${Math.ceil(waitTime/1000)}s`);
          } else {
            // Default 60-second cooldown if no specific time given
            this.globalCooldownUntil = Date.now() + 60000;
            console.log(`🚫 Rate limited! Setting default 60s global cooldown`);
          }
        }
        
        request.reject(error);
      }

      // Small buffer between successful requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.isProcessingQueue = false;
    console.log(`✨ Queue processing completed`);
  }

  // Get all available Bible versions
  async getAvailableBibles() {
    this.checkConfiguration();

    // Check cache first
    const cacheKey = 'available-bibles';
    const cached = this.biblesCache.get(cacheKey);
    if (cached) {
      console.log('📚 Returning cached available Bibles');
      return cached;
    }

    const timer = this.performanceMonitor.start('getAvailableBibles');
    
    try {
      // Check rate limiting
      await this.rateLimiter.checkLimit();
      
      const monitor = this.performanceMonitor.start('api-call');
      const response = await apiUtils.apiCall(`${this.baseUrl}/bibles`, {
        headers: this.getHeaders()
      });
      monitor.end();

      if (!response.ok) {
        throw new Error(`Failed to fetch available Bibles: ${response.status}`);
      }

      const data = await response.json();
      const bibles = data.data || [];
      
      // Cache the result
      this.biblesCache.set(cacheKey, bibles);
      
      console.log(`📚 Fetched ${bibles.length} available Bibles in ${timer.end()}ms`);
      return bibles;
    } catch (error) {
      console.error('Error fetching available Bibles:', error);
      throw error;
    }
  }

  // Get English-only Bible versions
  async getEnglishBibles() {
    const cacheKey = 'english-bibles';
    const cached = this.englishBiblesCache.get(cacheKey);
    if (cached) {
      console.log('🇺🇸 Returning cached English Bibles');
      return cached;
    }

    const timer = this.performanceMonitor.start('getEnglishBibles');
    
    try {
      const allBibles = await this.getAvailableBibles();
      
      // Filter for English Bibles only
      const englishBibles = allBibles.filter(bible => {
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

      // Cache the result
      this.englishBiblesCache.set(cacheKey, englishBibles);
      
      console.log(`🇺🇸 Filtered ${englishBibles.length} English Bibles in ${timer.end()}ms`);
      return englishBibles;
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

  // Fetch a specific verse or passage (with optional Bible version and retry logic)
  async getPassage(passageId, includeVerseNumbers = true, bibleId = null, priority = 'normal') {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;
    const cacheKey = `passage-${selectedBibleId}-${passageId}-${includeVerseNumbers}`;
    
    // Check cache first
    const cached = this.passageCache.get(cacheKey);
    if (cached) {
      console.log(`📖 Returning cached passage: ${passageId}`);
      return cached;
    }

    // Queue the API request to prevent rate limiting
    return this.queueRequest(async () => {
      const timer = this.performanceMonitor.start('getPassage');

      try {
      
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/passages/${passageId}${includeVerseNumbers ? '?include-verse-numbers=true' : ''}`;
      
      const monitor = this.performanceMonitor.start('api-call');
      const response = await apiUtils.apiCall(url, {
        headers: this.getHeaders(),
        timeout: 10000 // 10 second timeout
      });
      monitor.end();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Passage not found: ${passageId}`);
        }
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Wait before making more requests.`);
        }
        throw new Error(`Failed to fetch passage: ${response.status}`);
      }

      const data = await response.json();
      const result = {
        reference: data.data.reference,
        content: data.data.content,
        copyright: data.data.copyright,
        bibleId: selectedBibleId
      };
      
      // Cache the result with longer TTL for successful requests
      this.passageCache.set(cacheKey, result);
      
        console.log(`📖 Fetched passage ${passageId} in ${timer.end()}ms`);
        return result;
      } catch (error) {
        console.error(`Error fetching passage ${passageId}:`, error);
        throw error;
      }
    }, priority);
  }

  // Search for verses by keywords (with optional Bible version)
  async searchVerses(query, limit = 15, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;
    const cacheKey = `search-${selectedBibleId}-${query}-${limit}`;
    
    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      console.log(`🔍 Returning cached search results for: "${query}"`);
      return cached;
    }

    const timer = this.performanceMonitor.start('searchVerses');

    try {
      // Check rate limiting
      await this.rateLimiter.checkLimit();
      
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      
      const monitor = this.performanceMonitor.start('api-call');
      const response = await apiUtils.apiCall(url, {
        headers: this.getHeaders()
      });
      monitor.end();

      if (!response.ok) {
        throw new Error(`Search request failed: ${response.status}`);
      }

      const data = await response.json();
      
      let results = [];
      if (data.data && data.data.verses) {
        results = data.data.verses.map(verse => ({
          reference: verse.reference,
          text: verse.text.replace(/<[^>]*>/g, ''), // Remove HTML tags
          bibleId: selectedBibleId,
          bookId: verse.bookId,
          chapterNumber: verse.chapterNumber,
          verseNumber: verse.verseNumber
        }));
      }
      
      // Cache the result
      this.searchCache.set(cacheKey, results);
      
      console.log(`🔍 Found ${results.length} verses for "${query}" in ${timer.end()}ms`);
      return results;
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

  // Get chapters for a specific book (with optional Bible version and caching)
  async getChapters(bookId, bibleId = null) {
    this.checkConfiguration();
    
    const selectedBibleId = bibleId || this.defaultBibleId;
    const cacheKey = `chapters-${selectedBibleId}-${bookId}`;
    
    // Check cache first
    const cached = this.booksCache.get(cacheKey);
    if (cached) {
      console.log(`📚 Returning cached chapters for ${bookId}`);
      return cached;
    }

    try {
      const url = `${this.baseUrl}/bibles/${selectedBibleId}/books/${bookId}/chapters`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
        timeout: 8000 // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chapters for ${bookId}: ${response.status}`);
      }

      const data = await response.json();
      const chapters = data.data || [];
      
      // Cache the result
      this.booksCache.set(cacheKey, chapters);
      
      console.log(`📚 Fetched ${chapters.length} chapters for ${bookId}`);
      return chapters;
    } catch (error) {
      console.error(`Error fetching chapters for ${bookId}:`, error);
      throw error;
    }
  }

  // Get multiple passages concurrently with batching
  async getMultiplePassages(passageIds, includeVerseNumbers = true, bibleId = null, batchSize = 5) {
    const selectedBibleId = bibleId || this.defaultBibleId;
    const results = [];
    
    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < passageIds.length; i += batchSize) {
      const batch = passageIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (passageId) => {
        try {
          const passage = await this.getPassage(passageId, includeVerseNumbers, selectedBibleId);
          return { passageId, passage, success: true };
        } catch (error) {
          console.error(`Failed to fetch passage ${passageId}:`, error);
          return { 
            passageId, 
            passage: null, 
            success: false, 
            error: error.message 
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < passageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
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

  // Performance monitoring methods
  getPerformanceMetrics() {
    return {
      apiMetrics: this.performanceMonitor.getAllMetrics(),
      cacheStats: {
        bibles: this.biblesCache ? 'initialized' : 'not initialized',
        englishBibles: this.englishBiblesCache ? 'initialized' : 'not initialized',
        books: this.booksCache ? 'initialized' : 'not initialized',
        passages: this.passageCache ? 'initialized' : 'not initialized',
        searches: this.searchCache ? 'initialized' : 'not initialized'
      },
      configuration: {
        isConfigured: this.isConfigured,
        rateLimiting: 'enabled'
      }
    };
  }

  // Clear all caches
  clearCaches() {
    this.biblesCache.clear();
    this.englishBiblesCache.clear();
    this.booksCache.clear();
    this.passageCache.clear();
    this.searchCache.clear();
    console.log('🗑️ All API caches cleared');
  }
}

// Export singleton instance
export const bibleApi = new BibleApiService();
export default bibleApi;