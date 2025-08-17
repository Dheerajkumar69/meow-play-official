/**
 * Offline State Management with Redux Toolkit
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song } from '../../types/music';

interface OfflineItem {
  id: string;
  song: Song;
  downloadedAt: number;
  size: number;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  status: 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
}

interface OfflineState {
  isOnline: boolean;
  downloadedSongs: OfflineItem[];
  downloadQueue: OfflineItem[];
  totalStorageUsed: number;
  maxStorageLimit: number;
  autoDownload: boolean;
  downloadOnWifiOnly: boolean;
  downloadQuality: 'low' | 'medium' | 'high' | 'lossless';
  syncInProgress: boolean;
  lastSyncTime: number | null;
  offlineMode: boolean;
  queuedActions: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
    retryCount: number;
  }>;
}

const initialState: OfflineState = {
  isOnline: navigator.onLine,
  downloadedSongs: [],
  downloadQueue: [],
  totalStorageUsed: 0,
  maxStorageLimit: 2 * 1024 * 1024 * 1024, // 2GB default
  autoDownload: false,
  downloadOnWifiOnly: true,
  downloadQuality: 'high',
  syncInProgress: false,
  lastSyncTime: null,
  offlineMode: false,
  queuedActions: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      if (action.payload && state.queuedActions.length > 0) {
        // Trigger sync when coming back online
        state.syncInProgress = true;
      }
    },

    addToDownloadQueue: (state, action: PayloadAction<{ song: Song; quality?: 'low' | 'medium' | 'high' | 'lossless' }>) => {
      const { song, quality = state.downloadQuality } = action.payload;
      
      // Check if already downloaded or in queue
      const alreadyDownloaded = state.downloadedSongs.some(item => item.song.id === song.id);
      const alreadyInQueue = state.downloadQueue.some(item => item.song.id === song.id);
      
      if (!alreadyDownloaded && !alreadyInQueue) {
        const offlineItem: OfflineItem = {
          id: `offline-${song.id}-${Date.now()}`,
          song,
          downloadedAt: 0,
          size: 0,
          quality,
          status: 'downloading',
          progress: 0,
        };
        
        state.downloadQueue.push(offlineItem);
      }
    },

    updateDownloadProgress: (state, action: PayloadAction<{ id: string; progress: number; size?: number }>) => {
      const { id, progress, size } = action.payload;
      const item = state.downloadQueue.find(item => item.id === id);
      
      if (item) {
        item.progress = progress;
        if (size) item.size = size;
      }
    },

    completeDownload: (state, action: PayloadAction<{ id: string; size: number }>) => {
      const { id, size } = action.payload;
      const itemIndex = state.downloadQueue.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        const item = state.downloadQueue[itemIndex];
        item.status = 'completed';
        item.downloadedAt = Date.now();
        item.size = size;
        item.progress = 100;
        
        // Move to downloaded songs
        state.downloadedSongs.push(item);
        state.downloadQueue.splice(itemIndex, 1);
        state.totalStorageUsed += size;
      }
    },

    failDownload: (state, action: PayloadAction<{ id: string; error?: string }>) => {
      const { id } = action.payload;
      const item = state.downloadQueue.find(item => item.id === id);
      
      if (item) {
        item.status = 'failed';
      }
    },

    pauseDownload: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const item = state.downloadQueue.find(item => item.id === id);
      
      if (item) {
        item.status = 'paused';
      }
    },

    resumeDownload: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const item = state.downloadQueue.find(item => item.id === id);
      
      if (item && item.status === 'paused') {
        item.status = 'downloading';
      }
    },

    removeFromDownloads: (state, action: PayloadAction<string>) => {
      const songId = action.payload;
      
      // Remove from downloaded songs
      const downloadedIndex = state.downloadedSongs.findIndex(item => item.song.id === songId);
      if (downloadedIndex >= 0) {
        const item = state.downloadedSongs[downloadedIndex];
        state.totalStorageUsed -= item.size;
        state.downloadedSongs.splice(downloadedIndex, 1);
      }
      
      // Remove from download queue
      const queueIndex = state.downloadQueue.findIndex(item => item.song.id === songId);
      if (queueIndex >= 0) {
        state.downloadQueue.splice(queueIndex, 1);
      }
    },

    clearAllDownloads: (state) => {
      state.downloadedSongs = [];
      state.downloadQueue = [];
      state.totalStorageUsed = 0;
    },

    setAutoDownload: (state, action: PayloadAction<boolean>) => {
      state.autoDownload = action.payload;
    },

    setDownloadOnWifiOnly: (state, action: PayloadAction<boolean>) => {
      state.downloadOnWifiOnly = action.payload;
    },

    setDownloadQuality: (state, action: PayloadAction<'low' | 'medium' | 'high' | 'lossless'>) => {
      state.downloadQuality = action.payload;
    },

    setMaxStorageLimit: (state, action: PayloadAction<number>) => {
      state.maxStorageLimit = action.payload;
    },

    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },

    // Queued actions for offline sync
    queueAction: (state, action: PayloadAction<{ type: string; data: any }>) => {
      const { type, data } = action.payload;
      const queuedAction = {
        id: `action-${Date.now()}-${Math.random()}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      state.queuedActions.push(queuedAction);
    },

    removeQueuedAction: (state, action: PayloadAction<string>) => {
      const actionId = action.payload;
      state.queuedActions = state.queuedActions.filter(action => action.id !== actionId);
    },

    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const actionId = action.payload;
      const action_ = state.queuedActions.find(a => a.id === actionId);
      if (action_) {
        action_.retryCount++;
      }
    },

    clearQueuedActions: (state) => {
      state.queuedActions = [];
    },

    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
      if (!action.payload) {
        state.lastSyncTime = Date.now();
      }
    },

    // Smart download management
    autoDownloadLikedSongs: (state, action: PayloadAction<Song[]>) => {
      if (!state.autoDownload) return;
      
      const likedSongs = action.payload;
      likedSongs.forEach(song => {
        const alreadyDownloaded = state.downloadedSongs.some(item => item.song.id === song.id);
        const alreadyInQueue = state.downloadQueue.some(item => item.song.id === song.id);
        
        if (!alreadyDownloaded && !alreadyInQueue) {
          const offlineItem: OfflineItem = {
            id: `auto-${song.id}-${Date.now()}`,
            song,
            downloadedAt: 0,
            size: 0,
            quality: state.downloadQuality,
            status: 'downloading',
            progress: 0,
          };
          
          state.downloadQueue.push(offlineItem);
        }
      });
    },

    cleanupOldDownloads: (state, action: PayloadAction<{ maxAge: number; maxCount: number }>) => {
      const { maxAge, maxCount } = action.payload;
      const now = Date.now();
      
      // Remove old downloads
      state.downloadedSongs = state.downloadedSongs.filter(item => {
        const age = now - item.downloadedAt;
        return age < maxAge;
      });
      
      // Keep only most recent downloads if over limit
      if (state.downloadedSongs.length > maxCount) {
        state.downloadedSongs.sort((a, b) => b.downloadedAt - a.downloadedAt);
        const removed = state.downloadedSongs.splice(maxCount);
        
        // Update storage usage
        const removedSize = removed.reduce((total, item) => total + item.size, 0);
        state.totalStorageUsed -= removedSize;
      }
    },

    optimizeStorage: (state) => {
      // Remove failed downloads
      state.downloadQueue = state.downloadQueue.filter(item => item.status !== 'failed');
      
      // If over storage limit, remove oldest downloads
      if (state.totalStorageUsed > state.maxStorageLimit) {
        state.downloadedSongs.sort((a, b) => a.downloadedAt - b.downloadedAt);
        
        while (state.totalStorageUsed > state.maxStorageLimit && state.downloadedSongs.length > 0) {
          const removed = state.downloadedSongs.shift()!;
          state.totalStorageUsed -= removed.size;
        }
      }
    },
  },
});

export const {
  setOnlineStatus,
  addToDownloadQueue,
  updateDownloadProgress,
  completeDownload,
  failDownload,
  pauseDownload,
  resumeDownload,
  removeFromDownloads,
  clearAllDownloads,
  setAutoDownload,
  setDownloadOnWifiOnly,
  setDownloadQuality,
  setMaxStorageLimit,
  setOfflineMode,
  queueAction,
  removeQueuedAction,
  incrementRetryCount,
  clearQueuedActions,
  setSyncInProgress,
  autoDownloadLikedSongs,
  cleanupOldDownloads,
  optimizeStorage,
} = offlineSlice.actions;

export default offlineSlice.reducer;
