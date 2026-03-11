/* eslint-disable no-unused-vars */
// Bible API Service - Fixed & Sanitized Version
// Resolves the "403 /bibles/true/" error found in logs
import apiUtils from './apiUtils.js';

class BibleApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_BIBLE_API_KEY;
    this.baseUrl = import.meta.env.VITE_BIBLE_BASE_URL;
    // Fallback to KJV if the .env is missing
    this.defaultBibleId = import.meta.env.VITE_DEFAULT_BIBLE_ID || 'de4e12af7f28f528-02';
    
    this.cache = {
      bibles: apiUtils.createCache(1000 * 60 * 60 * 24),
      passages: apiUtils.createCache(1000 * 60 * 60),
    };

    this.activeRequests = new Map();
  }

  /**
   * SAFETY GUARD: Prevents "true" or "null" from being used as a Bible ID
   */
  _resolveId(id) {
    if (typeof id === 'string' && id.length > 5 && id !== 'true' && id !== 'false') {
      return id;
    }
    return this.defaultBibleId;
  }

  async fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 
          ...options.headers, 
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 429 && retries > 0) {
        await new Promise(res => setTimeout(res, backoff));
        return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (retries > 0) return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
      throw err;
    }
  }

  async getEnglishBibles() {
    const cached = this.cache.bibles.get('english-list');
    if (cached) return cached;

    try {
      const data = await this.fetchWithRetry(`${this.baseUrl}/bibles`);
      const englishOnly = data.data.filter(b => 
        b.language.id === 'eng' || ['kjv', 'niv', 'esv', 'nasb', 'nlt'].includes(b.abbreviation?.toLowerCase())
      ).sort((a, b) => {
        const order = ['niv', 'esv', 'kjv', 'nlt', 'nasb'];
        const aIdx = order.indexOf(a.abbreviation?.toLowerCase());
        const bIdx = order.indexOf(b.abbreviation?.toLowerCase());
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });

      this.cache.bibles.set('english-list', englishOnly);
      return englishOnly;
    } catch (e) {
      return [{ id: this.defaultBibleId, name: 'King James Version', abbreviation: 'KJV' }];
    }
  }

  async getBooks(bibleId = null) {
    const bId = this._resolveId(bibleId);
    const cacheKey = `books-${bId}`;
    if (this.cache.bibles.get(cacheKey)) return this.cache.bibles.get(cacheKey);

    try {
      const data = await this.fetchWithRetry(`${this.baseUrl}/bibles/${bId}/books`);
      const canon = this.getCanonicalOrder();
      const sorted = (data.data || []).sort((a, b) => canon.indexOf(a.id) - canon.indexOf(b.id));
      this.cache.bibles.set(cacheKey, sorted);
      return sorted;
    } catch (e) { return []; }
  }

  async getChapters(bookId, bibleId = null) {
    const bId = this._resolveId(bibleId);
    const cacheKey = `chapters-${bId}-${bookId}`;
    if (this.cache.bibles.get(cacheKey)) return this.cache.bibles.get(cacheKey);

    try {
      const data = await this.fetchWithRetry(`${this.baseUrl}/bibles/${bId}/books/${bookId}/chapters`);
      const chapters = data.data || [];
      this.cache.bibles.set(cacheKey, chapters);
      return chapters;
    } catch (e) { return []; }
  }

  async getPassage(passageId, bibleId = null) {
    const bId = this._resolveId(bibleId);
    const cacheKey = `p-${bId}-${passageId}`;
    if (this.cache.passages.get(cacheKey)) return this.cache.passages.get(cacheKey);

    // Clean URL construction
    const url = `${this.baseUrl}/bibles/${bId}/passages/${passageId}?include-verse-numbers=true`;
    
    try {
      const data = await this.fetchWithRetry(url);
      const res = {
        reference: data.data.reference,
        content: data.data.content.replace(/<[^>]*>/g, ''), 
        copyright: data.data.copyright
      };
      this.cache.passages.set(cacheKey, res);
      return res;
    } catch (e) { 
      console.error(`Passage fetch failed for ${passageId} on Bible ${bId}`);
      throw e; 
    }
  }

  getCanonicalOrder() {
    return [
      'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
      'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
    ];
  }

  parseVerseReference(input) {
    if (!input) return null;

    const cleaned = input
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\.(?=\d)/g, ' ');

    const match = cleaned.match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
    if (!match) return null;

    const [, rawBook, chapter, verseStart, verseEnd] = match;
    const bookId = this.getBookId(rawBook);
    if (!bookId) return null;

    if (verseStart && verseEnd) {
      return `${bookId}.${chapter}.${verseStart}-${verseEnd}`;
    }

    if (verseStart) {
      return `${bookId}.${chapter}.${verseStart}`;
    }

    return `${bookId}.${chapter}`;
  }

  async searchVerses(query, limit = 25, bibleId = null) {
    const bId = this._resolveId(bibleId);
    const cacheKey = `search-${bId}-${query}-${limit}`;
    const cached = this.cache.passages.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/bibles/${bId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;

    try {
      const data = await this.fetchWithRetry(url);
      const verses = (data.data?.verses || []).map(v => ({
        reference: v.reference,
        text: (v.text || '').replace(/<[^>]*>/g, '').trim(),
        bookId: v.bookId,
        chapterNumber: v.chapterNumber || v.chapterId?.split('.')?.[1]
      }));
      this.cache.passages.set(cacheKey, verses);
      return verses;
    } catch (e) {
      console.error('Search failed:', e);
      return [];
    }
  }

  getBookId(n) {
    const m = {
      'genesis': 'GEN', 'gen': 'GEN',
      'exodus': 'EXO', 'exo': 'EXO',
      'leviticus': 'LEV', 'lev': 'LEV',
      'numbers': 'NUM', 'num': 'NUM',
      'deuteronomy': 'DEU', 'deut': 'DEU',
      'joshua': 'JOS', 'josh': 'JOS',
      'judges': 'JDG', 'judg': 'JDG',
      'ruth': 'RUT',
      '1 samuel': '1SA', '2 samuel': '2SA',
      '1 kings': '1KI', '2 kings': '2KI',
      '1 chronicles': '1CH', '2 chronicles': '2CH',
      'ezra': 'EZR', 'nehemiah': 'NEH', 'esther': 'EST',
      'job': 'JOB',
      'psalm': 'PSA', 'psalms': 'PSA', 'ps': 'PSA',
      'proverbs': 'PRO', 'prov': 'PRO',
      'ecclesiastes': 'ECC', 'song of songs': 'SNG', 'song of solomon': 'SNG',
      'isaiah': 'ISA', 'jeremiah': 'JER', 'lamentations': 'LAM', 'ezekiel': 'EZK',
      'daniel': 'DAN', 'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA',
      'jonah': 'JON', 'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB',
      'zephaniah': 'ZEP', 'haggai': 'HAG', 'zechariah': 'ZEC', 'malachi': 'MAL',
      'matthew': 'MAT', 'mat': 'MAT',
      'mark': 'MRK', 'mrk': 'MRK',
      'luke': 'LUK', 'luk': 'LUK',
      'john': 'JHN', 'jn': 'JHN',
      'acts': 'ACT',
      'romans': 'ROM', 'rom': 'ROM',
      '1 corinthians': '1CO', '2 corinthians': '2CO',
      'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL',
      '1 thessalonians': '1TH', '2 thessalonians': '2TH',
      '1 timothy': '1TI', '2 timothy': '2TI',
      'titus': 'TIT', 'philemon': 'PHM', 'hebrews': 'HEB',
      'james': 'JAS',
      '1 peter': '1PE', '2 peter': '2PE',
      '1 john': '1JN', '2 john': '2JN', '3 john': '3JN',
      'jude': 'JUD', 'revelation': 'REV', 'rev': 'REV'
    };
    const clean = n.toLowerCase().replace(/\s+/g, ' ').trim();
    return m[clean] || clean.toUpperCase().substring(0, 3);
  }
}

export const bibleApi = new BibleApiService();
export default bibleApi;