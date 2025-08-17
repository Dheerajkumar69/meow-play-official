import { db } from './indexedDB';
import { Song } from '../types';
import { errorService } from '../services/ErrorService';
import { withDatabaseRetry } from './retry';

interface CacheConfig {
  maxCacheSize: number; // Maximum cache size in bytes
  maxCacheAge: number; // Maximum age of cached items in milliseconds
  cleanupInterval: number; // Interval to run cache cleanup in milliseconds
}

interface CacheMetadata {
  key: string;
  size: number;
  lastAccessed: number;
  lastModified: number;
}

export class CacheManager {
  private config: CacheConfig;
  private metadata: Map<string, CacheMetadata>;
  private cleanupTimer: number | null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxCacheSize: 500 * 1024 * 1024, // 500MB default
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days default
      cleanupInterval: 60 * 60 * 1000, // 1 hour default
      ...config
    };
    this.metadata = new Map();
    this.cleanupTimer = null;
    this.startCleanupTimer();
    this.loadMetadata();
  }

  private async loadMetadata() {
    try {
      const songs = await db.songs.toArray();
      for (const song of songs) {
        const size = this.estimateSize(song);
        this.metadata.set(song.id, {
          key: song.id,
          size,
          lastAccessed: Date.now(),
          lastModified: song.createdAt.getTime()
        });
      }
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'loadMetadata', 'songs');
    }
  }

  private estimateSize(song: Song): number {
    // Estimate size of song metadata
    const metadataSize = JSON.stringify(song).length;
    
    // Estimate audio file size (if we have duration)
    // Assuming average bitrate of 192kbps
    const estimatedAudioSize = song.duration ? (song.duration * 192 * 1024) / 8 : 0;
    
    // Add estimated cover art size if present (assuming average JPG size)
    const coverArtSize = song.coverArt ? 100 * 1024 : 0;
    
    return metadataSize + estimatedAudioSize + coverArtSize;
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      window.clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = window.setInterval(
      () => void this.cleanup(),
      this.config.cleanupInterval
    );
  }

  private async cleanup() {
    try {
      const now = Date.now();
      let currentSize = 0;
      const items = Array.from(this.metadata.values())
        .sort((a, b) => b.lastAccessed - a.lastAccessed);

      const itemsToRemove: string[] = [];

      // Calculate current cache size and find items to remove
      for (const item of items) {
        const isExpired = now - item.lastAccessed > this.config.maxCacheAge;
        
        if (isExpired || currentSize + item.size > this.config.maxCacheSize) {
          itemsToRemove.push(item.key);
        } else {
          currentSize += item.size;
        }
      }

      // Remove expired or excess items
      for (const key of itemsToRemove) {
        await this.remove(key);
      }
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'cleanup', 'cache');
    }
  }

  async get(key: string): Promise<Song | undefined> {
    const getWithRetry = withDatabaseRetry(async () => {
      const item = this.metadata.get(key);
      if (!item) return undefined;

      // Update last accessed time
      item.lastAccessed = Date.now();
      this.metadata.set(key, item);

      return await db.songs.get(key);
    });

    try {
      return await getWithRetry();
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'get', 'songs');
      return undefined;
    }
  }

  async set(key: string, value: Song): Promise<void> {
    const setWithRetry = withDatabaseRetry(async () => {
      const size = this.estimateSize(value);
      
      // Check if adding this item would exceed cache size
      if (size > this.config.maxCacheSize) {
        throw new Error('Item too large for cache');
      }

      // Add to database
      await db.songs.put(value);

      // Update metadata
      this.metadata.set(key, {
        key,
        size,
        lastAccessed: Date.now(),
        lastModified: value.createdAt.getTime()
      });
    });

    try {
      await setWithRetry();
      // Run cleanup if needed (outside retry to avoid infinite loops)
      await this.cleanup();
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'set', 'songs');
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await db.songs.delete(key);
      this.metadata.delete(key);
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'remove', 'songs');
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await db.songs.clear();
      this.metadata.clear();
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'clear', 'songs');
      throw error;
    }
  }

  getStats(): { size: number; count: number; averageAge: number } {
    let totalSize = 0;
    let totalAge = 0;
    const now = Date.now();

    for (const item of this.metadata.values()) {
      totalSize += item.size;
      totalAge += now - item.lastAccessed;
    }

    return {
      size: totalSize,
      count: this.metadata.size,
      averageAge: this.metadata.size ? totalAge / this.metadata.size : 0
    };
  }

  destroy() {
    if (this.cleanupTimer) {
      window.clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.metadata.clear();
  }
}
