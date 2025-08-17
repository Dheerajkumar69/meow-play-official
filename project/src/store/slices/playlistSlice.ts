/**
 * Playlist State Management with Redux Toolkit
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Playlist, Song } from '../../types/music';
import { ApiService } from '../../services/api';

// Async thunks
export const fetchPlaylists = createAsyncThunk(
  'playlists/fetchPlaylists',
  async (userId: string) => {
    const api = ApiService.getInstance();
    return await api.getUserPlaylists(userId);
  }
);

export const createPlaylist = createAsyncThunk(
  'playlists/createPlaylist',
  async (playlistData: { name: string; description?: string; isPublic: boolean }) => {
    const api = ApiService.getInstance();
    return await api.createPlaylist(playlistData.name, playlistData.description, playlistData.isPublic);
  }
);

export const updatePlaylist = createAsyncThunk(
  'playlists/updatePlaylist',
  async ({ id, updates }: { id: string; updates: Partial<Playlist> }) => {
    const api = ApiService.getInstance();
    return await api.updatePlaylist(id, updates);
  }
);

export const deletePlaylist = createAsyncThunk(
  'playlists/deletePlaylist',
  async (playlistId: string) => {
    const api = ApiService.getInstance();
    await api.deletePlaylist(playlistId);
    return playlistId;
  }
);

export const addSongToPlaylist = createAsyncThunk(
  'playlists/addSong',
  async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
    const api = ApiService.getInstance();
    await api.addSongToPlaylist(playlistId, songId);
    return { playlistId, songId };
  }
);

export const removeSongFromPlaylist = createAsyncThunk(
  'playlists/removeSong',
  async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
    const api = ApiService.getInstance();
    await api.removeSongFromPlaylist(playlistId, songId);
    return { playlistId, songId };
  }
);

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  loading: {
    fetch: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    addSong: boolean;
    removeSong: boolean;
  };
  error: string | null;
  searchResults: Playlist[];
  filters: {
    sortBy: 'name' | 'created' | 'updated' | 'songCount';
    sortOrder: 'asc' | 'desc';
    showPublicOnly: boolean;
    showPrivateOnly: boolean;
  };
}

const initialState: PlaylistState = {
  playlists: [],
  currentPlaylist: null,
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
    addSong: false,
    removeSong: false,
  },
  error: null,
  searchResults: [],
  filters: {
    sortBy: 'updated',
    sortOrder: 'desc',
    showPublicOnly: false,
    showPrivateOnly: false,
  },
};

const playlistSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    setCurrentPlaylist: (state, action: PayloadAction<Playlist | null>) => {
      state.currentPlaylist = action.payload;
    },
    
    updatePlaylistLocally: (state, action: PayloadAction<{ id: string; updates: Partial<Playlist> }>) => {
      const { id, updates } = action.payload;
      const playlist = state.playlists.find(p => p.id === id);
      if (playlist) {
        Object.assign(playlist, updates);
      }
      if (state.currentPlaylist?.id === id) {
        Object.assign(state.currentPlaylist, updates);
      }
    },
    
    reorderSongs: (state, action: PayloadAction<{ playlistId: string; fromIndex: number; toIndex: number }>) => {
      const { playlistId, fromIndex, toIndex } = action.payload;
      const playlist = state.playlists.find(p => p.id === playlistId);
      
      if (playlist && playlist.songs) {
        const songs = [...playlist.songs];
        const [movedSong] = songs.splice(fromIndex, 1);
        songs.splice(toIndex, 0, movedSong);
        playlist.songs = songs;
        
        if (state.currentPlaylist?.id === playlistId) {
          state.currentPlaylist.songs = songs;
        }
      }
    },
    
    setFilters: (state, action: PayloadAction<Partial<PlaylistState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    searchPlaylists: (state, action: PayloadAction<string>) => {
      const query = action.payload.toLowerCase();
      if (!query) {
        state.searchResults = [];
        return;
      }
      
      state.searchResults = state.playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query) ||
        playlist.creator.toLowerCase().includes(query)
      );
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Collaborative features
    addCollaborator: (state, action: PayloadAction<{ playlistId: string; userId: string }>) => {
      const { playlistId, userId } = action.payload;
      const playlist = state.playlists.find(p => p.id === playlistId);
      
      if (playlist && !playlist.collaborators?.includes(userId)) {
        playlist.collaborators = [...(playlist.collaborators || []), userId];
        
        if (state.currentPlaylist?.id === playlistId) {
          state.currentPlaylist.collaborators = playlist.collaborators;
        }
      }
    },
    
    removeCollaborator: (state, action: PayloadAction<{ playlistId: string; userId: string }>) => {
      const { playlistId, userId } = action.payload;
      const playlist = state.playlists.find(p => p.id === playlistId);
      
      if (playlist && playlist.collaborators) {
        playlist.collaborators = playlist.collaborators.filter(id => id !== userId);
        
        if (state.currentPlaylist?.id === playlistId) {
          state.currentPlaylist.collaborators = playlist.collaborators;
        }
      }
    },
  },
  
  extraReducers: (builder) => {
    // Fetch playlists
    builder
      .addCase(fetchPlaylists.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchPlaylists.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.playlists = action.payload;
      })
      .addCase(fetchPlaylists.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.error.message || 'Failed to fetch playlists';
      });
    
    // Create playlist
    builder
      .addCase(createPlaylist.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.loading.create = false;
        state.playlists.unshift(action.payload);
      })
      .addCase(createPlaylist.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.error.message || 'Failed to create playlist';
      });
    
    // Update playlist
    builder
      .addCase(updatePlaylist.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updatePlaylist.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.playlists.findIndex(p => p.id === action.payload.id);
        if (index >= 0) {
          state.playlists[index] = action.payload;
        }
        if (state.currentPlaylist?.id === action.payload.id) {
          state.currentPlaylist = action.payload;
        }
      })
      .addCase(updatePlaylist.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.error.message || 'Failed to update playlist';
      });
    
    // Delete playlist
    builder
      .addCase(deletePlaylist.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deletePlaylist.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.playlists = state.playlists.filter(p => p.id !== action.payload);
        if (state.currentPlaylist?.id === action.payload) {
          state.currentPlaylist = null;
        }
      })
      .addCase(deletePlaylist.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.error.message || 'Failed to delete playlist';
      });
    
    // Add song to playlist
    builder
      .addCase(addSongToPlaylist.pending, (state) => {
        state.loading.addSong = true;
        state.error = null;
      })
      .addCase(addSongToPlaylist.fulfilled, (state, action) => {
        state.loading.addSong = false;
        const { playlistId, songId } = action.payload;
        const playlist = state.playlists.find(p => p.id === playlistId);
        
        if (playlist) {
          playlist.songCount = (playlist.songCount || 0) + 1;
          playlist.updatedAt = new Date().toISOString();
          
          if (state.currentPlaylist?.id === playlistId) {
            state.currentPlaylist.songCount = playlist.songCount;
            state.currentPlaylist.updatedAt = playlist.updatedAt;
          }
        }
      })
      .addCase(addSongToPlaylist.rejected, (state, action) => {
        state.loading.addSong = false;
        state.error = action.error.message || 'Failed to add song to playlist';
      });
    
    // Remove song from playlist
    builder
      .addCase(removeSongFromPlaylist.pending, (state) => {
        state.loading.removeSong = true;
        state.error = null;
      })
      .addCase(removeSongFromPlaylist.fulfilled, (state, action) => {
        state.loading.removeSong = false;
        const { playlistId, songId } = action.payload;
        const playlist = state.playlists.find(p => p.id === playlistId);
        
        if (playlist) {
          playlist.songCount = Math.max(0, (playlist.songCount || 1) - 1);
          playlist.updatedAt = new Date().toISOString();
          
          if (playlist.songs) {
            playlist.songs = playlist.songs.filter(song => song.id !== songId);
          }
          
          if (state.currentPlaylist?.id === playlistId) {
            state.currentPlaylist.songCount = playlist.songCount;
            state.currentPlaylist.updatedAt = playlist.updatedAt;
            if (state.currentPlaylist.songs) {
              state.currentPlaylist.songs = playlist.songs;
            }
          }
        }
      })
      .addCase(removeSongFromPlaylist.rejected, (state, action) => {
        state.loading.removeSong = false;
        state.error = action.error.message || 'Failed to remove song from playlist';
      });
  }
});

export const {
  setCurrentPlaylist,
  updatePlaylistLocally,
  reorderSongs,
  setFilters,
  searchPlaylists,
  clearSearchResults,
  clearError,
  addCollaborator,
  removeCollaborator
} = playlistSlice.actions;

export default playlistSlice.reducer;
