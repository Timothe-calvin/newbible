// API Utilities for timeout, retry logic, and performance optimization

class ApiUtils {
  constructor() {
    this.defaultTimeout = 10000; // 10 seconds
    this.defaultRetries = 2;
  }

  // Execute fetch with timeout
  async fetchWithTimeout(url, options = {}, timeout = this.defaultTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  // Execute function with retry logic
  async executeWithRetry(fn, maxRetries = this.defaultRetries, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt <= maxRetries) {
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  // Wrapper for API calls with timeout and retry
  async apiCall(url, options = {}, timeout = this.defaultTimeout, retries = this.defaultRetries) {
    return this.executeWithRetry(
      () => this.fetchWithTimeout(url, options, timeout),
      retries
    );
  }

  // Cache management
  createCache(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    const cache = new Map();
    
    return {
      get(key) {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
          cache.delete(key);
          return null;
        }
        
        return item.value;
      },
      
      set(key, value, customTtl = ttl) {
        cache.set(key, {
          value,
          expires: Date.now() + customTtl
        });
      },
      
      clear() {
        cache.clear();
      },
      
      delete(key) {
        cache.delete(key);
      }
    };
  }

  // Performance monitoring
  createPerformanceMonitor() {
    const metrics = new Map();
    
    return {
      start(label) {
        const startTime = performance.now();
        return {
          end: () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            if (metrics.has(label)) {
              const existing = metrics.get(label);
              metrics.set(label, {
                count: existing.count + 1,
                total: existing.total + duration,
                avg: (existing.total + duration) / (existing.count + 1),
                min: Math.min(existing.min, duration),
                max: Math.max(existing.max, duration)
              });
            } else {
              metrics.set(label, {
                count: 1,
                total: duration,
                avg: duration,
                min: duration,
                max: duration
              });
            }
            
            return duration;
          }
        };
      },
      
      getMetrics(label) {
        return metrics.get(label);
      },
      
      getAllMetrics() {
        return Object.fromEntries(metrics);
      }
    };
  }

  // Rate limiting
  createRateLimiter(maxRequests = 5, windowMs = 60000) {
    const requests = [];
    
    return {
      async checkLimit() {
        const now = Date.now();
        
        // Remove old requests outside the window
        while (requests.length > 0 && now - requests[0] > windowMs) {
          requests.shift();
        }
        
        if (requests.length >= maxRequests) {
          const oldestRequest = requests[0];
          const waitTime = windowMs - (now - oldestRequest);
          throw new Error(`Rate limit exceeded. Wait ${waitTime}ms before making more requests.`);
        }
        
        requests.push(now);
      }
    };
  }
}

// Export singleton instance
export const apiUtils = new ApiUtils();
export default apiUtils;