/**
 * Queue State Management with Redux Toolkit
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Song } from '../../types/music';

interface QueueItem {
  id: string;
  song: Song;
  addedAt: number;
  addedBy?: string;
  originalIndex?: number;
}

interface QueueState {
  items: QueueItem[];
  currentIndex: number;
  history: QueueItem[];
  isShuffled: boolean;
  originalOrder: QueueItem[];
  autoPlay: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

const initialState: QueueState = {
  items: [],
  currentIndex: -1,
  history: [],
  isShuffled: false,
  originalOrder: [],
  autoPlay: true,
  repeatMode: 'none',
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<{ song: Song; position?: 'next' | 'end' }>) => {
      const { song, position = 'end' } = action.payload;
      const queueItem: QueueItem = {
        id: `${song.id}-${Date.now()}`,
        song,
        addedAt: Date.now(),
      };

      if (position === 'next' && state.currentIndex >= 0) {
        state.items.splice(state.currentIndex + 1, 0, queueItem);
      } else {
        state.items.push(queueItem);
      }

      if (!state.isShuffled) {
        state.originalOrder = [...state.items];
      }
    },

    addMultipleToQueue: (state, action: PayloadAction<{ songs: Song[]; position?: 'next' | 'end' }>) => {
      const { songs, position = 'end' } = action.payload;
      const queueItems: QueueItem[] = songs.map(song => ({
        id: `${song.id}-${Date.now()}-${Math.random()}`,
        song,
        addedAt: Date.now(),
      }));

      if (position === 'next' && state.currentIndex >= 0) {
        state.items.splice(state.currentIndex + 1, 0, ...queueItems);
      } else {
        state.items.push(...queueItems);
      }

      if (!state.isShuffled) {
        state.originalOrder = [...state.items];
      }
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const index = state.items.findIndex(item => item.id === itemId);
      
      if (index >= 0) {
        state.items.splice(index, 1);
        
        // Adjust current index if necessary
        if (index < state.currentIndex) {
          state.currentIndex--;
        } else if (index === state.currentIndex && state.currentIndex >= state.items.length) {
          state.currentIndex = state.items.length - 1;
        }

        if (!state.isShuffled) {
          state.originalOrder = [...state.items];
        }
      }
    },

    clearQueue: (state) => {
      state.items = [];
      state.currentIndex = -1;
      state.history = [];
      state.originalOrder = [];
    },

    setCurrentIndex: (state, action: PayloadAction<number>) => {
      const newIndex = action.payload;
      if (newIndex >= 0 && newIndex < state.items.length) {
        // Add current song to history if moving to a different song
        if (state.currentIndex >= 0 && state.currentIndex !== newIndex) {
          const currentItem = state.items[state.currentIndex];
          if (currentItem) {
            state.history.unshift(currentItem);
            // Keep history limited to last 50 items
            state.history = state.history.slice(0, 50);
          }
        }
        state.currentIndex = newIndex;
      }
    },

    playNext: (state) => {
      if (state.items.length === 0) return;

      let nextIndex = state.currentIndex + 1;

      // Handle repeat modes
      if (state.repeatMode === 'one') {
        nextIndex = state.currentIndex;
      } else if (nextIndex >= state.items.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }

      // Add current song to history
      if (state.currentIndex >= 0) {
        const currentItem = state.items[state.currentIndex];
        if (currentItem) {
          state.history.unshift(currentItem);
          state.history = state.history.slice(0, 50);
        }
      }

      state.currentIndex = nextIndex;
    },

    playPrevious: (state) => {
      // First try to play from history
      if (state.history.length > 0) {
        const previousItem = state.history.shift()!;
        
        // Find the item in current queue or add it back
        const existingIndex = state.items.findIndex(item => item.song.id === previousItem.song.id);
        if (existingIndex >= 0) {
          state.currentIndex = existingIndex;
        } else {
          // Add back to queue at current position
          state.items.splice(state.currentIndex, 0, previousItem);
        }
        return;
      }

      // Fall back to previous in queue
      if (state.currentIndex > 0) {
        state.currentIndex--;
      } else if (state.repeatMode === 'all' && state.items.length > 0) {
        state.currentIndex = state.items.length - 1;
      }
    },

    reorderQueue: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      
      if (fromIndex >= 0 && fromIndex < state.items.length && 
          toIndex >= 0 && toIndex < state.items.length) {
        
        const [movedItem] = state.items.splice(fromIndex, 1);
        state.items.splice(toIndex, 0, movedItem);

        // Adjust current index
        if (fromIndex === state.currentIndex) {
          state.currentIndex = toIndex;
        } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
          state.currentIndex--;
        } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
          state.currentIndex++;
        }

        if (!state.isShuffled) {
          state.originalOrder = [...state.items];
        }
      }
    },

    shuffleQueue: (state) => {
      if (state.items.length <= 1) return;

      if (!state.isShuffled) {
        // Store original order
        state.originalOrder = [...state.items];
        
        // Shuffle items (excluding current song)
        const currentItem = state.currentIndex >= 0 ? state.items[state.currentIndex] : null;
        const otherItems = state.items.filter((_, index) => index !== state.currentIndex);
        
        // Fisher-Yates shuffle
        for (let i = otherItems.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
        }

        // Rebuild queue with current song first
        if (currentItem) {
          state.items = [currentItem, ...otherItems];
          state.currentIndex = 0;
        } else {
          state.items = otherItems;
        }
      } else {
        // Restore original order
        state.items = [...state.originalOrder];
        
        // Find current song in original order
        if (state.currentIndex >= 0) {
          const currentSongId = state.items[state.currentIndex]?.song.id;
          const originalIndex = state.originalOrder.findIndex(item => item.song.id === currentSongId);
          state.currentIndex = originalIndex >= 0 ? originalIndex : 0;
        }
      }

      state.isShuffled = !state.isShuffled;
    },

    setRepeatMode: (state, action: PayloadAction<'none' | 'one' | 'all'>) => {
      state.repeatMode = action.payload;
    },

    setAutoPlay: (state, action: PayloadAction<boolean>) => {
      state.autoPlay = action.payload;
    },

    // Smart queue features
    addSimilarSongs: (state, action: PayloadAction<Song[]>) => {
      const similarSongs = action.payload;
      const queueItems: QueueItem[] = similarSongs.map(song => ({
        id: `${song.id}-similar-${Date.now()}-${Math.random()}`,
        song,
        addedAt: Date.now(),
      }));

      // Add after current song
      if (state.currentIndex >= 0) {
        state.items.splice(state.currentIndex + 1, 0, ...queueItems);
      } else {
        state.items.push(...queueItems);
      }

      if (!state.isShuffled) {
        state.originalOrder = [...state.items];
      }
    },

    removePlayedSongs: (state) => {
      if (state.currentIndex > 0) {
        const removedItems = state.items.splice(0, state.currentIndex);
        state.currentIndex = 0;
        
        // Add removed items to history
        state.history.unshift(...removedItems);
        state.history = state.history.slice(0, 50);

        if (!state.isShuffled) {
          state.originalOrder = [...state.items];
        }
      }
    },

    // Collaborative queue features
    addCollaborativeItem: (state, action: PayloadAction<{ song: Song; addedBy: string }>) => {
      const { song, addedBy } = action.payload;
      const queueItem: QueueItem = {
        id: `${song.id}-collab-${Date.now()}`,
        song,
        addedAt: Date.now(),
        addedBy,
      };

      state.items.push(queueItem);

      if (!state.isShuffled) {
        state.originalOrder = [...state.items];
      }
    },
  },
});

export const {
  addToQueue,
  addMultipleToQueue,
  removeFromQueue,
  clearQueue,
  setCurrentIndex,
  playNext,
  playPrevious,
  reorderQueue,
  shuffleQueue,
  setRepeatMode,
  setAutoPlay,
  addSimilarSongs,
  removePlayedSongs,
  addCollaborativeItem,
} = queueSlice.actions;

export default queueSlice.reducer;
