/**
 * Advanced Music State Management with Redux Toolkit
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Song, Artist, Album, Playlist } from '../../types/music';
import { ApiService } from '../../services/api';

// Async thunks for API calls
export const fetchSongs = createAsyncThunk(
  'music/fetchSongs',
  async (params: { query?: string; genre?: string; limit?: number }) => {
    const api = ApiService.getInstance();
    return await api.searchSongs(params.query || '', params.limit || 20);
  }
);

export const fetchSongById = createAsyncThunk(
  'music/fetchSongById',
  async (songId: string) => {
    const api = ApiService.getInstance();
    return await api.getSong(songId);
  }
);

export const likeSong = createAsyncThunk(
  'music/likeSong',
  async ({ userId, songId }: { userId: string; songId: string }) => {
    const api = ApiService.getInstance();
    await api.likeSong(userId, songId);
    return songId;
  }
);

export const unlikeSong = createAsyncThunk(
  'music/unlikeSong',
  async ({ userId, songId }: { userId: string; songId: string }) => {
    const api = ApiService.getInstance();
    await api.unlikeSong(userId, songId);
    return songId;
  }
);

// Enhanced state interface
interface MusicState {
  // Current playback
  currentSong: Song | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  
  // Playback modes
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  
  // Audio quality and effects
  audioQuality: 'low' | 'medium' | 'high' | 'lossless';
  equalizerSettings: {
    enabled: boolean;
    preset: string;
    bands: number[];
  };
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  
  // Music library
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  genres: string[];
  likedSongs: string[];
  recentlyPlayed: Song[];
  
  // Search and discovery
  searchResults: {
    songs: Song[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
  };
  searchQuery: string;
  searchHistory: string[];
  recommendations: Song[];
  trending: Song[];
  
  // Loading states
  loading: {
    songs: boolean;
    artists: boolean;
    albums: boolean;
    search: boolean;
    recommendations: boolean;
  };
  
  // Error handling
  error: string | null;
  
  // Analytics
  playCount: Record<string, number>;
  skipCount: Record<string, number>;
  totalListeningTime: number;
}

const initialState: MusicState = {
  currentSong: null,
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  
  isShuffled: false,
  repeatMode: 'none',
  
  audioQuality: 'high',
  equalizerSettings: {
    enabled: false,
    preset: 'flat',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  
  songs: [],
  artists: [],
  albums: [],
  genres: [],
  likedSongs: [],
  recentlyPlayed: [],
  
  searchResults: {
    songs: [],
    artists: [],
    albums: [],
    playlists: []
  },
  searchQuery: '',
  searchHistory: [],
  recommendations: [],
  trending: [],
  
  loading: {
    songs: false,
    artists: false,
    albums: false,
    search: false,
    recommendations: false
  },
  
  error: null,
  
  playCount: {},
  skipCount: {},
  totalListeningTime: 0
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    // Playback controls
    playSong: (state, action: PayloadAction<Song>) => {
      state.currentSong = action.payload;
      state.isPlaying = true;
      state.isPaused = false;
      state.isLoading = false;
      
      // Add to recently played
      const existingIndex = state.recentlyPlayed.findIndex(s => s.id === action.payload.id);
      if (existingIndex >= 0) {
        state.recentlyPlayed.splice(existingIndex, 1);
      }
      state.recentlyPlayed.unshift(action.payload);
      state.recentlyPlayed = state.recentlyPlayed.slice(0, 50); // Keep last 50
      
      // Increment play count
      state.playCount[action.payload.id] = (state.playCount[action.payload.id] || 0) + 1;
    },
    
    pauseSong: (state) => {
      state.isPlaying = false;
      state.isPaused = true;
    },
    
    resumeSong: (state) => {
      state.isPlaying = true;
      state.isPaused = false;
    },
    
    stopSong: (state) => {
      state.isPlaying = false;
      state.isPaused = false;
      state.currentTime = 0;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Time and volume controls
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
      state.totalListeningTime += 1; // Increment by 1 second
    },
    
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
      state.isMuted = state.volume === 0;
    },
    
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    
    // Playback modes
    toggleShuffle: (state) => {
      state.isShuffled = !state.isShuffled;
    },
    
    setRepeatMode: (state, action: PayloadAction<'none' | 'one' | 'all'>) => {
      state.repeatMode = action.payload;
    },
    
    // Audio quality and effects
    setAudioQuality: (state, action: PayloadAction<'low' | 'medium' | 'high' | 'lossless'>) => {
      state.audioQuality = action.payload;
    },
    
    updateEqualizerSettings: (state, action: PayloadAction<Partial<MusicState['equalizerSettings']>>) => {
      state.equalizerSettings = { ...state.equalizerSettings, ...action.payload };
    },
    
    toggleCrossfade: (state) => {
      state.crossfadeEnabled = !state.crossfadeEnabled;
    },
    
    setCrossfadeDuration: (state, action: PayloadAction<number>) => {
      state.crossfadeDuration = Math.max(0, Math.min(10, action.payload));
    },
    
    // Library management
    setSongs: (state, action: PayloadAction<Song[]>) => {
      state.songs = action.payload;
    },
    
    addSong: (state, action: PayloadAction<Song>) => {
      const existingIndex = state.songs.findIndex(s => s.id === action.payload.id);
      if (existingIndex >= 0) {
        state.songs[existingIndex] = action.payload;
      } else {
        state.songs.push(action.payload);
      }
    },
    
    removeSong: (state, action: PayloadAction<string>) => {
      state.songs = state.songs.filter(s => s.id !== action.payload);
    },
    
    // Liked songs
    addLikedSong: (state, action: PayloadAction<string>) => {
      if (!state.likedSongs.includes(action.payload)) {
        state.likedSongs.push(action.payload);
      }
    },
    
    removeLikedSong: (state, action: PayloadAction<string>) => {
      state.likedSongs = state.likedSongs.filter(id => id !== action.payload);
    },
    
    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      if (action.payload && !state.searchHistory.includes(action.payload)) {
        state.searchHistory.unshift(action.payload);
        state.searchHistory = state.searchHistory.slice(0, 20); // Keep last 20
      }
    },
    
    setSearchResults: (state, action: PayloadAction<MusicState['searchResults']>) => {
      state.searchResults = action.payload;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = {
        songs: [],
        artists: [],
        albums: [],
        playlists: []
      };
      state.searchQuery = '';
    },
    
    // Recommendations and trending
    setRecommendations: (state, action: PayloadAction<Song[]>) => {
      state.recommendations = action.payload;
    },
    
    setTrending: (state, action: PayloadAction<Song[]>) => {
      state.trending = action.payload;
    },
    
    // Analytics
    incrementSkipCount: (state, action: PayloadAction<string>) => {
      state.skipCount[action.payload] = (state.skipCount[action.payload] || 0) + 1;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Fetch songs
    builder
      .addCase(fetchSongs.pending, (state) => {
        state.loading.songs = true;
        state.error = null;
      })
      .addCase(fetchSongs.fulfilled, (state, action) => {
        state.loading.songs = false;
        state.songs = action.payload;
      })
      .addCase(fetchSongs.rejected, (state, action) => {
        state.loading.songs = false;
        state.error = action.error.message || 'Failed to fetch songs';
      });
    
    // Fetch song by ID
    builder
      .addCase(fetchSongById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSongById.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add or update song in library
        const existingIndex = state.songs.findIndex(s => s.id === action.payload.id);
        if (existingIndex >= 0) {
          state.songs[existingIndex] = action.payload;
        } else {
          state.songs.push(action.payload);
        }
      })
      .addCase(fetchSongById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch song';
      });
    
    // Like song
    builder
      .addCase(likeSong.fulfilled, (state, action) => {
        if (!state.likedSongs.includes(action.payload)) {
          state.likedSongs.push(action.payload);
        }
      })
      .addCase(likeSong.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to like song';
      });
    
    // Unlike song
    builder
      .addCase(unlikeSong.fulfilled, (state, action) => {
        state.likedSongs = state.likedSongs.filter(id => id !== action.payload);
      })
      .addCase(unlikeSong.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to unlike song';
      });
  }
});

export const {
  playSong,
  pauseSong,
  resumeSong,
  stopSong,
  setLoading,
  setCurrentTime,
  setDuration,
  setVolume,
  toggleMute,
  toggleShuffle,
  setRepeatMode,
  setAudioQuality,
  updateEqualizerSettings,
  toggleCrossfade,
  setCrossfadeDuration,
  setSongs,
  addSong,
  removeSong,
  addLikedSong,
  removeLikedSong,
  setSearchQuery,
  setSearchResults,
  clearSearchResults,
  setRecommendations,
  setTrending,
  incrementSkipCount,
  setError,
  clearError
} = musicSlice.actions;

export default musicSlice.reducer;
