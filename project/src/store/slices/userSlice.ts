/**
 * User State Management with Redux Toolkit
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiService } from '../../services/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  subscription: 'free' | 'premium' | 'family';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    audioQuality: 'low' | 'medium' | 'high' | 'lossless';
    autoPlay: boolean;
    crossfade: boolean;
    notifications: boolean;
    explicitContent: boolean;
  };
  stats: {
    totalListeningTime: number;
    songsPlayed: number;
    playlistsCreated: number;
    followersCount: number;
    followingCount: number;
  };
  createdAt: string;
  lastActive: string;
}

// Async thunks
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }) => {
    const api = ApiService.getInstance();
    return await api.login(credentials.email, credentials.password);
  }
);

export const registerUser = createAsyncThunk(
  'user/register',
  async (userData: { email: string; password: string; username: string }) => {
    const api = ApiService.getInstance();
    return await api.register(userData.email, userData.password, userData.username);
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<User>) => {
    const api = ApiService.getInstance();
    return await api.updateProfile(updates);
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File) => {
    const api = ApiService.getInstance();
    return await api.uploadAvatar(file);
  }
);

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastLoginAttempt: number;
  sessionExpiry: number | null;
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: 0,
  sessionExpiry: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.sessionExpiry = null;
      state.error = null;
    },
    
    updatePreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload
        };
      }
    },
    
    updateStats: (state, action: PayloadAction<Partial<User['stats']>>) => {
      if (state.currentUser) {
        state.currentUser.stats = {
          ...state.currentUser.stats,
          ...action.payload
        };
      }
    },
    
    incrementListeningTime: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.stats.totalListeningTime += action.payload;
      }
    },
    
    incrementSongsPlayed: (state) => {
      if (state.currentUser) {
        state.currentUser.stats.songsPlayed += 1;
      }
    },
    
    setSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = 0;
    }
  },
  
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.user;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.expiresAt;
        state.loginAttempts = 0;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.loginAttempts += 1;
        state.lastLoginAttempt = Date.now();
      });
    
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.user;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.expiresAt;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      });
    
    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Profile update failed';
      });
    
    // Upload avatar
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentUser) {
          state.currentUser.avatar = action.payload.avatarUrl;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Avatar upload failed';
      });
  }
});

export const {
  logout,
  updatePreferences,
  updateStats,
  incrementListeningTime,
  incrementSongsPlayed,
  setSessionExpiry,
  clearError,
  resetLoginAttempts
} = userSlice.actions;

export default userSlice.reducer;
