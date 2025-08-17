import { Song, Playlist } from '../types';

interface DBCollection<T> {
  get(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  add(item: T): Promise<string>;
  update(id: string, changes: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  put(item: T): Promise<void>;
  clear(): Promise<void>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
}

class IndexedDBManager {
  private dbName = 'MusicStreamingDB';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  public songs: DBCollection<Song>;
  public playlists: DBCollection<Playlist>;

  constructor() {
    this.songs = this.createCollection<Song>('songs');
    this.playlists = this.createCollection<Playlist>('playlists');
  }

  private createCollection<T>(storeName: string): DBCollection<T> {
    const manager = this;
    
    return {
      async get(id: string): Promise<T | undefined> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      },

      async getAll(): Promise<T[]> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      },

      async add(item: T): Promise<string> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
          const request = store.add(item);
          request.onsuccess = () => resolve(request.result as string);
          request.onerror = () => reject(request.error);
        });
      },

      async update(id: string, changes: Partial<T>): Promise<void> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
          const getRequest = store.get(id);
          getRequest.onsuccess = () => {
            const item = { ...getRequest.result, ...changes };
            const updateRequest = store.put(item);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
      },

      async delete(id: string): Promise<void> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },

      async put(item: T): Promise<void> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },

      async clear(): Promise<void> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },

      async toArray(): Promise<T[]> {
        return this.getAll();
      },

      async count(): Promise<number> {
        await manager.init();
        const store = manager.getObjectStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    };
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        
        // Handle database errors
        this.db.onerror = (event) => {
          console.error('Database error:', event);
        };
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        try {
          // Songs store
          if (!db.objectStoreNames.contains('songs')) {
            const songStore = db.createObjectStore('songs', { keyPath: 'id' });
            songStore.createIndex('title', 'title', { unique: false });
            songStore.createIndex('artist', 'artist', { unique: false });
            songStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Audio blobs store
          if (!db.objectStoreNames.contains('audioBlobs')) {
            db.createObjectStore('audioBlobs', { keyPath: 'songId' });
          }

          // Playlists store
          if (!db.objectStoreNames.contains('playlists')) {
            const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
            playlistStore.createIndex('userId', 'userId', { unique: false });
          }

          // Recently played store
          if (!db.objectStoreNames.contains('recentlyPlayed')) {
            const recentStore = db.createObjectStore('recentlyPlayed', { keyPath: 'id' });
            recentStore.createIndex('playedAt', 'playedAt', { unique: false });
          }
        } catch (error) {
          console.error('Error creating object stores:', error);
          reject(error);
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  private async performTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    operation: (stores: IDBObjectStore | IDBObjectStore[]) => Promise<T> | T
  ): Promise<T> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeNames, mode);
        
        transaction.onerror = () => {
          reject(transaction.error || new Error('Transaction failed'));
        };
        
        transaction.onabort = () => {
          reject(new Error('Transaction aborted'));
        };

        const stores = Array.isArray(storeNames) 
          ? storeNames.map(name => transaction.objectStore(name))
          : transaction.objectStore(storeNames);

        Promise.resolve(operation(stores))
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async saveSong(song: Song): Promise<void> {
    return this.performTransaction('songs', 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).put(song);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getSong(id: string): Promise<Song | null> {
    return this.performTransaction('songs', 'readonly', (store) => {
      return new Promise<Song | null>((resolve, reject) => {
        const request = (store as IDBObjectStore).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async saveAudioBlob(songId: string, blob: Blob): Promise<void> {
    // Check quota before saving
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        
        // If we're using more than 80% of quota, don't save
        if (usage / quota > 0.8) {
          console.warn('Storage quota nearly exceeded, skipping blob save');
          return;
        }
      } catch (error) {
        console.warn('Could not check storage quota:', error);
      }
    }

    return this.performTransaction('audioBlobs', 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).put({ songId, blob });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAudioBlob(songId: string): Promise<Blob | null> {
    return this.performTransaction('audioBlobs', 'readonly', (store) => {
      return new Promise<Blob | null>((resolve, reject) => {
        const request = (store as IDBObjectStore).get(songId);
        request.onsuccess = () => resolve(request.result?.blob || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    return this.performTransaction('playlists', 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).put(playlist);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getPlaylists(userId: string): Promise<Playlist[]> {
    return this.performTransaction('playlists', 'readonly', (store) => {
      return new Promise<Playlist[]>((resolve, reject) => {
        const index = (store as IDBObjectStore).index('userId');
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async addToRecentlyPlayed(song: Song): Promise<void> {
    const recentItem = {
      id: `${song.id}-${Date.now()}`,
      song,
      playedAt: new Date()
    };
    
    return this.performTransaction('recentlyPlayed', 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        // Add new item
        const addRequest = (store as IDBObjectStore).put(recentItem);
        addRequest.onsuccess = () => {
          // Clean up old entries (keep only last 50)
          const index = (store as IDBObjectStore).index('playedAt');
          const getAllRequest = index.getAll();
          getAllRequest.onsuccess = () => {
            const items = getAllRequest.result || [];
            if (items.length > 50) {
              // Sort by playedAt and remove oldest
              items.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
              const toDelete = items.slice(50);
              
              let deleteCount = 0;
              toDelete.forEach(item => {
                const deleteRequest = (store as IDBObjectStore).delete(item.id);
                deleteRequest.onsuccess = () => {
                  deleteCount++;
                  if (deleteCount === toDelete.length) {
                    resolve();
                  }
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
              });
              
              if (toDelete.length === 0) {
                resolve();
              }
            } else {
              resolve();
            }
          };
          getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        addRequest.onerror = () => reject(addRequest.error);
      });
    });
  }

  async getRecentlyPlayed(): Promise<Song[]> {
    return this.performTransaction('recentlyPlayed', 'readonly', (store) => {
      return new Promise<Song[]>((resolve, reject) => {
        const index = (store as IDBObjectStore).index('playedAt');
        const request = index.getAll();
        
        request.onsuccess = () => {
          const results = request.result || [];
          const uniqueSongs = new Map();
          
          // Sort by playedAt descending and deduplicate
          results
            .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
            .forEach(item => {
              if (!uniqueSongs.has(item.song.id)) {
                uniqueSongs.set(item.song.id, item.song);
              }
            });
          
          resolve(Array.from(uniqueSongs.values()).slice(0, 20));
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clearCache(): Promise<void> {
    return this.performTransaction(['audioBlobs', 'recentlyPlayed'], 'readwrite', (stores) => {
      return new Promise<void>((resolve, reject) => {
        const [blobStore, recentStore] = stores as IDBObjectStore[];
        
        let clearCount = 0;
        const clearRequests = [
          blobStore.clear(),
          recentStore.clear()
        ];
        
        clearRequests.forEach(request => {
          request.onsuccess = () => {
            clearCount++;
            if (clearCount === clearRequests.length) {
              resolve();
            }
          };
          request.onerror = () => reject(request.error);
        });
      });
    });
  }
}

export const db = new IndexedDBManager();