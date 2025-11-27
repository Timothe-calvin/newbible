// Global Preloading Service for smooth user experience
import bibleApi from './bibleApi';

class PreloadService {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
    this.isPreloading = false;
    this.maxCacheSize = 25; // Increased cache size for better performance
    this.lastPreloadTime = 0;
    this.minPreloadInterval = 5000; // Minimum 5 seconds between preload attempts
  }

  // Generate cache key
  getCacheKey(type, identifier, bibleId = null) {
    return `${type}-${identifier}${bibleId ? `-${bibleId}` : ''}`;
  }

  // Check if item is cached
  isCached(type, identifier, bibleId = null) {
    const key = this.getCacheKey(type, identifier, bibleId);
    return this.cache.has(key);
  }

  // Get cached item
  getCached(type, identifier, bibleId = null) {
    const key = this.getCacheKey(type, identifier, bibleId);
    const cached = this.cache.get(key);
    if (cached) {
      // Update access time for LRU
      cached.lastAccessed = Date.now();
      this.cache.set(key, cached);
      console.log(`📄 Retrieved from cache: ${key}`);
      return cached.data;
    }
    return null;
  }

  // Cache item with LRU eviction
  setCached(type, identifier, data, bibleId = null) {
    const key = this.getCacheKey(type, identifier, bibleId);
    
    // If cache is full, remove oldest item
    if (this.cache.size >= this.maxCacheSize) {
      let oldestKey = null;
      let oldestTime = Date.now();
      
      for (const [cacheKey, value] of this.cache) {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed;
          oldestKey = cacheKey;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(`🗑️ Evicted from cache: ${oldestKey}`);
      }
    }
    
    this.cache.set(key, {
      data,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
    
    console.log(`💾 Cached: ${key}`);
  }

  // Clear cache for specific type or all
  clearCache(type = null) {
    if (type) {
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${type}-`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🧹 Cleared ${type} cache (${keysToDelete.length} items)`);
    } else {
      this.cache.clear();
      console.log('🧹 Cleared entire cache');
    }
  }

  // Preload Bible chapters (used by BibleReading)
  async preloadChapter(book, chapterNumber, bibleId) {
    if (!book || !chapterNumber || !bibleId) return null;
    
    const key = this.getCacheKey('chapter', `${book.id}.${chapterNumber}`, bibleId);
    
    // Return cached if available
    if (this.isCached('chapter', `${book.id}.${chapterNumber}`, bibleId)) {
      return this.getCached('chapter', `${book.id}.${chapterNumber}`, bibleId);
    }

    // Don't preload if already in queue
    if (this.preloadQueue.has(key)) return null;

    try {
      this.preloadQueue.add(key);
      
      const passageId = `${book.id}.${chapterNumber}`;
      const chapterData = await bibleApi.getPassage(passageId, true, bibleId);
      
      const processedData = {
        content: chapterData.content,
        book: book,
        chapter: chapterNumber,
        bibleId: bibleId
      };
      
      this.setCached('chapter', `${book.id}.${chapterNumber}`, processedData, bibleId);
      this.preloadQueue.delete(key);
      
      console.log(`🔄 Preloaded: ${book.name} Chapter ${chapterNumber}`);
      return processedData;
      
    } catch (error) {
      console.error(`Failed to preload ${book.name} chapter ${chapterNumber}:`, error);
      this.preloadQueue.delete(key);
      return null;
    }
  }

  // Preload Scripture search results
  async preloadScriptureSearch(query, searchType, bibleId) {
    if (!query || !bibleId) return null;
    
    const key = this.getCacheKey('search', `${query}-${searchType}`, bibleId);
    
    // Return cached if available
    if (this.isCached('search', `${query}-${searchType}`, bibleId)) {
      return this.getCached('search', `${query}-${searchType}`, bibleId);
    }

    // Don't preload if already in queue
    if (this.preloadQueue.has(key)) return null;

    try {
      this.preloadQueue.add(key);
      
      // This would integrate with your existing search logic
      // For now, we'll cache the search parameters for later use
      const searchData = {
        query,
        searchType,
        bibleId,
        timestamp: Date.now()
      };
      
      this.setCached('search', `${query}-${searchType}`, searchData, bibleId);
      this.preloadQueue.delete(key);
      
      console.log(`🔍 Preloaded search: ${query}`);
      return searchData;
      
    } catch (error) {
      console.error(`Failed to preload search for ${query}:`, error);
      this.preloadQueue.delete(key);
      return null;
    }
  }

  // Background facts preload - loads verses separately after page display
  async preloadFactsBackground(dayNumber) {
    const dayKey = `facts-day-${dayNumber}`;
    
    // Don't preload if already cached with verses
    const existing = this.getCached('facts', dayKey);
    if (existing && existing.length > 0 && existing[0].verseText) {
      console.log('📚 Facts already preloaded with verses');
      return existing;
    }

    try {
      console.log(`🔄 Starting background preload for day ${dayNumber} facts...`);
      
      // This would need to import the fact templates, but for now we'll check what's cached
      const factsToPreload = existing || [];
      
      if (factsToPreload.length === 0) {
        console.log('📚 No facts to preload in background');
        return null;
      }
      
      const preloadedFacts = [...factsToPreload];
      
      // Load verses in background with very conservative timing
      for (let i = 0; i < preloadedFacts.length; i++) {
        const fact = preloadedFacts[i];
        
        if (fact.verseRef && !fact.verseText) {
          try {
            // Very long delays between requests: 10s, 20s, 30s, etc.
            const delay = (i + 1) * 10000;
            console.log(`📚 Background: Waiting ${delay/1000}s before loading verse for: ${fact.title}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const verseData = await bibleApi.getPassage(fact.verseRef, true);
            
            // Update the fact with verse text
            preloadedFacts[i] = {
              ...fact,
              verseText: verseData.content,
              success: true
            };
            
            // Update cache immediately after each successful load
            this.setCached('facts', dayKey, [...preloadedFacts]);
            
            console.log(`📚 Background loaded verse for: ${fact.title}`);
            
          } catch (error) {
            console.error(`Background failed to load verse for ${fact.title}:`, error);
            
            preloadedFacts[i] = {
              ...fact,
              verseText: null,
              success: false
            };
            
            // If we hit a rate limit, stop background preloading
            if (error.message && error.message.includes('Rate limit')) {
              console.log('📚 Background preload stopped - rate limit hit');
              break;
            }
          }
        }
      }
      
      console.log(`📚 Background preload completed for day ${dayNumber}`);
      return preloadedFacts;
      
    } catch (error) {
      console.error('Background facts preload error:', error);
      return null;
    }
  }

  // Preload Bible facts - ULTRA CONSERVATIVE VERSION  
  async preloadBibleFacts(factRefs, cacheKey = 'bible-facts') {
    if (!factRefs || !Array.isArray(factRefs) || factRefs.length === 0) return null;
    
    // Return cached if available
    if (this.isCached('facts', cacheKey)) {
      return this.getCached('facts', cacheKey);
    }

    try {
      const facts = [];
      
      // Load up to 3 facts with long delays between each
      const factsToLoad = Math.min(factRefs.length, 3);
      
      for (let i = 0; i < factsToLoad; i++) {
        const fact = factRefs[i];
        
        try {
          // Add progressive delays: 3s, 8s, 15s
          const delay = i === 0 ? 3000 : i === 1 ? 8000 : 15000;
          console.log(`📚 Waiting ${delay/1000}s before loading fact ${i + 1}: ${fact.title}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          const verseData = await bibleApi.getPassage(fact.verseRef, true);
          facts.push({
            ...fact,
            verseText: verseData.content,
            success: true
          });
          
          console.log(`📚 Preloaded Bible fact ${i + 1}: ${fact.title}`);
          
          // Cache after each successful load
          this.setCached('facts', cacheKey, [...facts]);
          
        } catch (error) {
          console.error(`Failed to load fact verse ${fact.verseRef}:`, error);
          facts.push({
            ...fact,
            verseText: null,
            success: false
          });
          
          // If we hit a rate limit, stop trying to load more facts
          if (error.message && error.message.includes('Rate limit')) {
            console.log('📚 Rate limit hit - stopping fact preload');
            break;
          }
        }
      }
      
      console.log(`📚 Ultra-conservative preload completed: ${facts.length} facts loaded`);
      return facts;
      
    } catch (error) {
      console.error('Failed to preload Bible facts:', error);
      return null;
    }
  }

  // Preload Bible versions and books
  async preloadBibleMetadata() {
    // Return cached if available
    if (this.isCached('metadata', 'bibles')) {
      return this.getCached('metadata', 'bibles');
    }

    try {
      const englishBibles = await bibleApi.getEnglishBibles();
      const defaultId = import.meta.env.VITE_DEFAULT_BIBLE_ID || englishBibles[0]?.id;
      
      let books = [];
      if (defaultId) {
        books = await bibleApi.getBooks(defaultId);
      }
      
      const metadata = {
        bibles: englishBibles,
        defaultBibleId: defaultId,
        books: books
      };
      
      this.setCached('metadata', 'bibles', metadata);
      console.log('📖 Preloaded Bible metadata');
      return metadata;
      
    } catch (error) {
      console.error('Failed to preload Bible metadata:', error);
      return null;
    }
  }

  // Smart preloading based on user navigation patterns - ULTRA CONSERVATIVE VERSION
  async smartPreload(currentPage, currentContent = null) {
    const now = Date.now();
    
    // Don't preload if:
    // - Already preloading
    // - Cache is getting large (more than 20 items)
    // - Recent preload attempt (within 5 seconds)
    if (this.isPreloading || 
        this.cache.size > 20 || 
        (now - this.lastPreloadTime) < this.minPreloadInterval) {
      console.log('Preload skipped - too soon or cache full');
      return;
    }
    
    this.isPreloading = true;
    this.lastPreloadTime = now;
    
    try {
      switch (currentPage) {
        case 'home':
          // Disable metadata preloading to prevent rate limiting
          console.log('Home page - preloading disabled to prevent rate limits');
          break;
          
        case 'bible-reading':
          // If on a specific chapter, preload next chapter
          if (currentContent && currentContent.book && currentContent.currentChapter) {
            setTimeout(() => {
              this.preloadChapter(
                currentContent.book, 
                currentContent.currentChapter + 1, 
                currentContent.bibleId
              );
            }, 2000); // Wait 2 seconds before preloading next chapter
          }
          break;
          
        case 'scripture-lookup': {
          // Only preload one popular verse
          if (this.cache.size < 20) {
            setTimeout(async () => {
              try {
                await bibleApi.getPassage('JHN.3.16', true);
                console.log('📖 Preloaded John 3:16');
              } catch (error) {
                console.error('Failed to preload John 3:16:', error);
              }
            }, 1000); // Wait 1 second
          }
          break;
        }
          
        case 'facts': {
          // Start background preloading for tomorrow's facts
          if (this.cache.size < 15) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDayNum = Math.floor((tomorrow - new Date(tomorrow.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            
            setTimeout(() => {
              this.preloadFactsBackground(tomorrowDayNum);
            }, 10000); // Wait 10 seconds before starting background preload
            
            console.log('Facts page - scheduled background preload for tomorrow');
          }
          break;
        }
          
        default:
          break;
      }
    } catch (error) {
      console.error('Smart preload error:', error);
    } finally {
      setTimeout(() => {
        this.isPreloading = false;
      }, 1000);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      totalItems: this.cache.size,
      maxSize: this.maxCacheSize,
      queueSize: this.preloadQueue.size,
      isPreloading: this.isPreloading,
      cacheTypes: {}
    };
    
    for (const key of this.cache.keys()) {
      const type = key.split('-')[0];
      stats.cacheTypes[type] = (stats.cacheTypes[type] || 0) + 1;
    }
    
    return stats;
  }
}

// Export singleton instance
const preloadService = new PreloadService();
export default preloadService;