/**
 * Advanced caching strategies for performance optimization
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheItem<any>>();
  private stats = { hits: 0, misses: 0 };
  private maxSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set cache item with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      lastAccessed: Date.now()
    };

    // Evict old items if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.memoryCache.set(key, item);
    
    // Also store in localStorage for persistence
    this.setLocalStorage(key, item);
  }

  /**
   * Get cache item
   */
  get<T>(key: string): T | null {
    let item = this.memoryCache.get(key);
    
    // Try localStorage if not in memory
    if (!item) {
      item = this.getLocalStorage(key);
      if (item) {
        this.memoryCache.set(key, item);
      }
    }

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access stats
    item.hits++;
    item.lastAccessed = Date.now();
    this.stats.hits++;

    return item.data;
  }

  /**
   * Delete cache item
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0 };
    
    // Clear localStorage cache items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.memoryCache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }

  /**
   * Cache with automatic refresh
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private setLocalStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      // Handle localStorage quota exceeded
      console.warn('LocalStorage cache write failed:', error);
    }
  }

  private getLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Music-specific caching utilities
 */
export class MusicCache {
  private static cache = CacheManager.getInstance();

  /**
   * Cache song metadata
   */
  static setSong(songId: string, songData: any): void {
    this.cache.set(`song_${songId}`, songData, 30 * 60 * 1000); // 30 minutes
  }

  static getSong(songId: string): any | null {
    return this.cache.get(`song_${songId}`);
  }

  /**
   * Cache playlist data
   */
  static setPlaylist(playlistId: string, playlistData: any): void {
    this.cache.set(`playlist_${playlistId}`, playlistData, 15 * 60 * 1000); // 15 minutes
  }

  static getPlaylist(playlistId: string): any | null {
    return this.cache.get(`playlist_${playlistId}`);
  }

  /**
   * Cache search results
   */
  static setSearchResults(query: string, results: any): void {
    const key = `search_${btoa(query.toLowerCase())}`;
    this.cache.set(key, results, 10 * 60 * 1000); // 10 minutes
  }

  static getSearchResults(query: string): any | null {
    const key = `search_${btoa(query.toLowerCase())}`;
    return this.cache.get(key);
  }

  /**
   * Cache user data
   */
  static setUserData(userId: string, userData: any): void {
    this.cache.set(`user_${userId}`, userData, 60 * 60 * 1000); // 1 hour
  }

  static getUserData(userId: string): any | null {
    return this.cache.get(`user_${userId}`);
  }

  /**
   * Preload frequently accessed data
   */
  static async preloadUserData(userId: string, fetchFn: () => Promise<any>): Promise<void> {
    const cached = this.getUserData(userId);
    if (!cached) {
      const userData = await fetchFn();
      this.setUserData(userId, userData);
    }
  }
}

/**
 * Image caching with service worker
 */
export class ImageCache {
  private static readonly CACHE_NAME = 'meow-play-images';

  /**
   * Cache image with service worker
   */
  static async cacheImage(url: string): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        await cache.add(url);
      } catch (error) {
        console.warn('Failed to cache image:', error);
      }
    }
  }

  /**
   * Get cached image URL
   */
  static async getCachedImageUrl(url: string): Promise<string> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const response = await cache.match(url);
        if (response) {
          return URL.createObjectURL(await response.blob());
        }
      } catch (error) {
        console.warn('Failed to get cached image:', error);
      }
    }
    return url;
  }

  /**
   * Preload album artwork
   */
  static async preloadAlbumArt(urls: string[]): Promise<void> {
    const promises = urls.slice(0, 10).map(url => this.cacheImage(url)); // Limit to 10
    await Promise.allSettled(promises);
  }
}

/**
 * API response caching
 */
export class APICache {
  private static cache = CacheManager.getInstance();

  /**
   * Cache API response with smart invalidation
   */
  static async cacheAPIResponse<T>(
    endpoint: string,
    params: Record<string, any>,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = this.generateCacheKey(endpoint, params);
    return this.cache.getOrFetch(key, fetchFn, ttl);
  }

  /**
   * Invalidate cache for specific endpoint
   */
  static invalidateEndpoint(endpoint: string): void {
    // Remove all cache entries that start with the endpoint
    const cache = CacheManager.getInstance();
    const memoryCache = (cache as any).memoryCache;
    
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`api_${endpoint}`)) {
        cache.delete(key);
      }
    }
  }

  private static generateCacheKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `api_${endpoint}_${btoa(sortedParams)}`;
  }
}
