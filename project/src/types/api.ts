/**
 * Comprehensive API Types with strict typing
 */

// Generic API Response Types
export interface APIResponse<T = unknown> {
  readonly data: T;
  readonly success: boolean;
  readonly message?: string;
  readonly errors?: ReadonlyArray<APIError>;
  readonly metadata?: APIMetadata;
}

export interface APIError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
}

export interface APIMetadata {
  readonly page?: number;
  readonly limit?: number;
  readonly total?: number;
  readonly hasMore?: boolean;
  readonly timestamp?: string;
}

// User Types
export interface User {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly avatar?: string;
  readonly isAdmin?: boolean;
  readonly isPremium?: boolean;
  readonly createdAt: string;
  readonly lastLoginAt?: string;
  readonly preferences: UserPreferences;
  readonly profile: UserProfile;
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'system';
  readonly autoplay: boolean;
  readonly volume: number;
  readonly quality: 'low' | 'medium' | 'high' | 'lossless';
  readonly notifications: NotificationSettings;
}

export interface UserProfile {
  readonly displayName?: string;
  readonly bio?: string;
  readonly location?: string;
  readonly website?: string;
  readonly socialLinks?: ReadonlyArray<SocialLink>;
}

export interface NotificationSettings {
  readonly email: boolean;
  readonly push: boolean;
  readonly newFollowers: boolean;
  readonly newReleases: boolean;
  readonly recommendations: boolean;
}

export interface SocialLink {
  readonly platform: 'twitter' | 'instagram' | 'spotify' | 'soundcloud' | 'youtube';
  readonly url: string;
}

// Music Types
export interface Song {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly album?: string;
  readonly duration: number;
  readonly genre?: ReadonlyArray<string>;
  readonly mood?: ReadonlyArray<string>;
  readonly coverArt?: string;
  readonly audioUrl: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly playCount: number;
  readonly likes: number;
  readonly isLiked?: boolean;
  readonly metadata: AudioMetadata;
}

export interface AudioMetadata {
  readonly bitrate?: number;
  readonly sampleRate?: number;
  readonly format: 'mp3' | 'flac' | 'wav' | 'aac';
  readonly size: number;
  readonly checksum?: string;
}

export interface Playlist {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly coverArt?: string;
  readonly isPublic: boolean;
  readonly isCollaborative: boolean;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly songs: ReadonlyArray<Song>;
  readonly followers?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags?: ReadonlyArray<string>;
}

export interface Album {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly releaseDate: string;
  readonly coverArt?: string;
  readonly tracks: ReadonlyArray<Song>;
  readonly genre?: ReadonlyArray<string>;
  readonly description?: string;
}

// Playback Types
export interface PlaybackState {
  readonly isPlaying: boolean;
  readonly currentSong?: Song;
  readonly currentTime: number;
  readonly duration: number;
  readonly volume: number;
  readonly isMuted: boolean;
  readonly repeatMode: RepeatMode;
  readonly isShuffled: boolean;
  readonly queue: ReadonlyArray<Song>;
  readonly history: ReadonlyArray<Song>;
}

export type RepeatMode = 'off' | 'one' | 'all';

// Search Types
export interface SearchResults {
  readonly songs: ReadonlyArray<Song>;
  readonly playlists: ReadonlyArray<Playlist>;
  readonly albums: ReadonlyArray<Album>;
  readonly users: ReadonlyArray<User>;
  readonly totalResults: number;
}

export interface SearchFilters {
  readonly query: string;
  readonly type?: ReadonlyArray<'songs' | 'playlists' | 'albums' | 'users'>;
  readonly genre?: ReadonlyArray<string>;
  readonly mood?: ReadonlyArray<string>;
  readonly duration?: DurationFilter;
  readonly uploadDate?: DateFilter;
  readonly sortBy?: SortOption;
}

export interface DurationFilter {
  readonly min?: number;
  readonly max?: number;
}

export interface DateFilter {
  readonly from?: string;
  readonly to?: string;
}

export type SortOption = 'relevance' | 'newest' | 'oldest' | 'mostPlayed' | 'mostLiked';

// Upload Types
export interface UploadProgress {
  readonly file: File;
  readonly progress: number;
  readonly status: UploadStatus;
  readonly error?: string;
  readonly songId?: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface UploadMetadata {
  readonly title: string;
  readonly artist: string;
  readonly album?: string;
  readonly genre?: ReadonlyArray<string>;
  readonly mood?: ReadonlyArray<string>;
  readonly isPublic: boolean;
  readonly tags?: ReadonlyArray<string>;
}

// Authentication Types
export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface RegisterData {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly acceptTerms: boolean;
}

// Analytics Types
export interface UserStats {
  readonly totalListeningTime: number;
  readonly songsPlayed: number;
  readonly favoriteGenres: ReadonlyArray<GenreStats>;
  readonly recentActivity: ReadonlyArray<ActivityItem>;
  readonly achievements: ReadonlyArray<Achievement>;
}

export interface GenreStats {
  readonly genre: string;
  readonly count: number;
  readonly percentage: number;
}

export interface ActivityItem {
  readonly type: 'play' | 'like' | 'follow' | 'playlist' | 'upload';
  readonly timestamp: string;
  readonly metadata: Record<string, unknown>;
}

export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly unlockedAt?: string;
  readonly progress?: number;
  readonly maxProgress?: number;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export type SortDirection = 'asc' | 'desc';

// Error Types
export class APIErrorClass extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Type Guards
export const isUser = (obj: unknown): obj is User => {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'username' in obj && 'email' in obj;
};

export const isSong = (obj: unknown): obj is Song => {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'title' in obj && 'artist' in obj;
};

export const isPlaylist = (obj: unknown): obj is Playlist => {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj && 'songs' in obj;
};

// Branded Types for IDs
export type UserId = string & { readonly __brand: 'UserId' };
export type SongId = string & { readonly __brand: 'SongId' };
export type PlaylistId = string & { readonly __brand: 'PlaylistId' };
export type AlbumId = string & { readonly __brand: 'AlbumId' };

// Helper type for creating branded IDs
export const createUserId = (id: string): UserId => id as UserId;
export const createSongId = (id: string): SongId => id as SongId;
export const createPlaylistId = (id: string): PlaylistId => id as PlaylistId;
export const createAlbumId = (id: string): AlbumId => id as AlbumId;
