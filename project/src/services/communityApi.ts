/**
 * Community API Service for Global Music Sharing
 */
import { ApiService } from './api';

export interface CommunityMusic {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  file_url: string;
  cover_art_url?: string;
  file_size?: number;
  bitrate?: number;
  sample_rate?: number;
  audio_format?: string;
  
  // Upload metadata
  uploaded_by?: string;
  uploaded_at: string;
  original_filename?: string;
  file_hash: string;
  
  // Community metrics
  play_count: number;
  like_count: number;
  download_count: number;
  share_count: number;
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderated_by?: string;
  moderated_at?: string;
  moderation_notes?: string;
  
  // Additional metadata
  lyrics?: string;
  tags?: string[];
  language?: string;
  explicit_content: boolean;
  copyright_info?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CommunityPlaylist {
  id: string;
  name: string;
  description?: string;
  cover_art_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Community metrics
  follower_count: number;
  play_count: number;
  like_count: number;
  
  // Settings
  is_public: boolean;
  is_collaborative: boolean;
  allow_downloads: boolean;
  
  status: 'approved' | 'flagged' | 'removed';
  tags?: string[];
  mood?: string;
  genre?: string;
  
  // Populated data
  items?: CommunityMusic[];
  creator?: CommunityUserProfile;
}

export interface CommunityUserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  website?: string;
  
  // Community stats
  uploads_count: number;
  followers_count: number;
  following_count: number;
  total_plays: number;
  total_likes: number;
  
  // Settings
  is_public: boolean;
  allow_messages: boolean;
  show_listening_activity: boolean;
  
  // Verification
  is_verified: boolean;
  is_artist: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface CommunitySearchFilters {
  query?: string;
  genre?: string;
  tags?: string[];
  duration_min?: number;
  duration_max?: number;
  explicit_content?: boolean;
  audio_format?: string;
  sort_by?: 'relevance' | 'play_count' | 'like_count' | 'created_at' | 'title' | 'artist';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  message?: string;
}

export class CommunityApiService {
  private static instance: CommunityApiService;
  private apiService: ApiService;

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  static getInstance(): CommunityApiService {
    if (!CommunityApiService.instance) {
      CommunityApiService.instance = new CommunityApiService();
    }
    return CommunityApiService.instance;
  }

  /**
   * Upload music to community database
   */
  async uploadMusic(
    file: File,
    metadata: {
      title: string;
      artist: string;
      album?: string;
      genre?: string;
      tags?: string[];
      lyrics?: string;
      explicit_content?: boolean;
      copyright_info?: string;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CommunityMusic> {
    try {
      // Calculate file hash for duplicate detection
      const fileHash = await this.calculateFileHash(file);
      
      // Check for duplicates
      const existingMusic = await this.findMusicByHash(fileHash);
      if (existingMusic) {
        throw new Error('This music file already exists in the community database');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        ...metadata,
        file_hash: fileHash,
        original_filename: file.name,
        file_size: file.size,
      }));

      // Upload with progress tracking
      const response = await this.uploadWithProgress(
        '/api/community/music/upload',
        formData,
        onProgress
      );

      return response.data;
    } catch (error) {
      console.error('Failed to upload music to community:', error);
      throw error;
    }
  }

  /**
   * Search community music
   */
  async searchMusic(filters: CommunitySearchFilters): Promise<{
    items: CommunityMusic[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await this.apiService.get(`/api/community/music/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search community music:', error);
      throw error;
    }
  }

  /**
   * Get trending music
   */
  async getTrendingMusic(limit: number = 20): Promise<CommunityMusic[]> {
    try {
      const response = await this.apiService.get(`/api/community/music/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get trending music:', error);
      throw error;
    }
  }

  /**
   * Get music by ID
   */
  async getMusicById(id: string): Promise<CommunityMusic> {
    try {
      const response = await this.apiService.get(`/api/community/music/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get music by ID:', error);
      throw error;
    }
  }

  /**
   * Like/unlike music
   */
  async toggleMusicLike(musicId: string): Promise<{ liked: boolean; like_count: number }> {
    try {
      const response = await this.apiService.post(`/api/community/music/${musicId}/like`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle music like:', error);
      throw error;
    }
  }

  /**
   * Download music
   */
  async downloadMusic(musicId: string): Promise<{ download_url: string }> {
    try {
      const response = await this.apiService.post(`/api/community/music/${musicId}/download`);
      return response.data;
    } catch (error) {
      console.error('Failed to download music:', error);
      throw error;
    }
  }

  /**
   * Report music
   */
  async reportMusic(
    musicId: string,
    reason: 'copyright' | 'inappropriate' | 'spam' | 'harassment' | 'other',
    description?: string
  ): Promise<void> {
    try {
      await this.apiService.post(`/api/community/music/${musicId}/report`, {
        reason,
        description,
      });
    } catch (error) {
      console.error('Failed to report music:', error);
      throw error;
    }
  }

  /**
   * Get user's uploaded music
   */
  async getUserMusic(userId: string, limit: number = 20, offset: number = 0): Promise<{
    items: CommunityMusic[];
    total: number;
  }> {
    try {
      const response = await this.apiService.get(
        `/api/community/users/${userId}/music?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get user music:', error);
      throw error;
    }
  }

  /**
   * Create community playlist
   */
  async createPlaylist(data: {
    name: string;
    description?: string;
    is_public?: boolean;
    is_collaborative?: boolean;
    tags?: string[];
    mood?: string;
    genre?: string;
  }): Promise<CommunityPlaylist> {
    try {
      const response = await this.apiService.post('/api/community/playlists', data);
      return response.data;
    } catch (error) {
      console.error('Failed to create community playlist:', error);
      throw error;
    }
  }

  /**
   * Get community playlists
   */
  async getPlaylists(filters: {
    query?: string;
    genre?: string;
    tags?: string[];
    is_public?: boolean;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CommunityPlaylist[]; total: number }> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await this.apiService.get(`/api/community/playlists?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get community playlists:', error);
      throw error;
    }
  }

  /**
   * Add music to playlist
   */
  async addMusicToPlaylist(playlistId: string, musicId: string): Promise<void> {
    try {
      await this.apiService.post(`/api/community/playlists/${playlistId}/items`, {
        music_id: musicId,
      });
    } catch (error) {
      console.error('Failed to add music to playlist:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<CommunityUserProfile> {
    try {
      const response = await this.apiService.get(`/api/community/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: Partial<CommunityUserProfile>): Promise<CommunityUserProfile> {
    try {
      const response = await this.apiService.put('/api/community/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Follow/unfollow user
   */
  async toggleUserFollow(userId: string): Promise<{ following: boolean; followers_count: number }> {
    try {
      const response = await this.apiService.post(`/api/community/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle user follow:', error);
      throw error;
    }
  }

  /**
   * Get user activity feed
   */
  async getActivityFeed(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const response = await this.apiService.get(
        `/api/community/activity?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get activity feed:', error);
      throw error;
    }
  }

  /**
   * Get music recommendations based on community data
   */
  async getCommunityRecommendations(limit: number = 20): Promise<CommunityMusic[]> {
    try {
      const response = await this.apiService.get(
        `/api/community/recommendations?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get community recommendations:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async findMusicByHash(hash: string): Promise<CommunityMusic | null> {
    try {
      const response = await this.apiService.get(`/api/community/music/by-hash/${hash}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private async uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            stage: 'uploading',
            message: 'Uploading file...',
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Get auth token
      const token = localStorage.getItem('auth_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.open('POST', url);
      xhr.send(formData);
    });
  }
}

export default CommunityApiService;
