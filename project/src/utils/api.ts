import axios from 'axios';
import { Song, User } from '../types';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const authAPI = {
  register: async (email: string, username: string, password: string) => {
    const response = await api.post('/users/register', { email, username, password });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (userData: Partial<User>) => {
    const response = await api.patch('/users/me', userData);
    return response.data;
  }
};

// Songs API
export const songsAPI = {
  // Upload a song with metadata and optional poster
  uploadSong: async (audioFile: File, metadata: Partial<Song>, posterFile?: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    if (posterFile) {
      formData.append('poster', posterFile);
    }
    
    // Add metadata fields
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle arrays (like mood)
        if (Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await api.post('/songs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  checkDuplicate: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const response = await api.post('/songs/check-duplicate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get all songs
  getAllSongs: async () => {
    const response = await api.get('/songs');
    return response.data;
  },
  
  // Get a specific song
  getSong: async (id: string) => {
    const response = await api.get(`/songs/${id}`);
    return response.data;
  },
  
  // Get songs by user
  getUserSongs: async (userId: string) => {
    const response = await api.get(`/songs/user/${userId}`);
    return response.data;
  },
  
  // Search songs
  searchSongs: async (query: string) => {
    const response = await api.get(`/songs/search/${encodeURIComponent(query)}`);
    return response.data;
  },
  
  // Update a song
  updateSong: async (id: string, updates: Partial<Song>) => {
    const response = await api.patch(`/songs/${id}`, updates);
    return response.data;
  },
  
  // Delete a song
  deleteSong: async (id: string) => {
    const response = await api.delete(`/songs/${id}`);
    return response.data;
  },
  
  // Get stream URL for a song
  getStreamUrl: (song: any) => {
    // If we have a filename, use that for streaming
    if (song.filename) {
      return `${API_URL}/stream/${song.filename}`;
    }
    // Fallback to ID-based streaming for backward compatibility
    return `${API_URL}/stream/id/${song.id}`;
  }
};

// Users API
export const usersAPI = {
  // Get user by ID
  getUser: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  // Follow a user
  followUser: async (id: string) => {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  },
  
  // Unfollow a user
  unfollowUser: async (id: string) => {
    const response = await api.post(`/users/${id}/unfollow`);
    return response.data;
  }
};

export default {
  auth: authAPI,
  songs: songsAPI,
  users: usersAPI
};