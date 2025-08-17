/**
 * Comprehensive Type Definitions for Meow-Play
 */

// Core Music Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  url: string;
  coverArt?: string;
  releaseDate?: string;
  trackNumber?: number;
  explicit?: boolean;
  audioFeatures?: AudioFeatures;
  lyrics?: string;
  playCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  isDownloaded?: boolean;
  quality?: AudioQuality;
  fileSize?: number;
  bitrate?: number;
  sampleRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AudioFeatures {
  energy: number; // 0-1
  valence: number; // 0-1 (happiness)
  danceability: number; // 0-1
  acousticness: number; // 0-1
  instrumentalness: number; // 0-1
  liveness: number; // 0-1
  speechiness: number; // 0-1
  tempo: number; // BPM
  loudness: number; // dB
  key: number; // 0-11 (C, C#, D, etc.)
  mode: number; // 0 (minor) or 1 (major)
  timeSignature: number; // 3, 4, 5, etc.
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image?: string;
  genres: string[];
  followers?: number;
  verified?: boolean;
  monthlyListeners?: number;
  topSongs?: Song[];
  albums?: Album[];
  socialLinks?: {
    spotify?: string;
    apple?: string;
    youtube?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverArt?: string;
  releaseDate: string;
  genre?: string;
  trackCount: number;
  duration: number;
  songs?: Song[];
  type: 'album' | 'ep' | 'single' | 'compilation';
  label?: string;
  isExplicit?: boolean;
  popularity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  creator: string;
  creatorId: string;
  coverArt?: string;
  songs?: Song[];
  songCount: number;
  duration: number;
  isPublic: boolean;
  isCollaborative?: boolean;
  collaborators?: string[];
  followers?: number;
  tags?: string[];
  mood?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

// Audio and Playback Types
export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';
export type RepeatMode = 'none' | 'one' | 'all';
export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';

export interface PlaybackSettings {
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  audioQuality: AudioQuality;
  equalizerEnabled: boolean;
  equalizerPreset: string;
  equalizerBands: number[];
  replayGainEnabled: boolean;
  normalizationEnabled: boolean;
}

export interface AudioContext {
  sampleRate: number;
  currentTime: number;
  state: 'suspended' | 'running' | 'closed';
}

// User and Social Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  subscription: SubscriptionTier;
  preferences: UserPreferences;
  stats: UserStats;
  socialProfile: SocialProfile;
  privacy: PrivacySettings;
  createdAt: string;
  lastActive: string;
  isVerified?: boolean;
  badges?: string[];
}

export type SubscriptionTier = 'free' | 'premium' | 'family' | 'student';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  country: string;
  timezone: string;
  audioQuality: AudioQuality;
  autoPlay: boolean;
  crossfade: boolean;
  showExplicitContent: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  email: boolean;
  push: boolean;
  newReleases: boolean;
  friendActivity: boolean;
  playlistUpdates: boolean;
  recommendations: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showListeningActivity: boolean;
  showPlaylists: boolean;
  showFollowers: boolean;
  allowCollaborativeInvites: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
}

export interface UserStats {
  totalListeningTime: number;
  songsPlayed: number;
  artistsDiscovered: number;
  playlistsCreated: number;
  followersCount: number;
  followingCount: number;
  likedSongs: number;
  streakDays: number;
  topGenres: Record<string, number>;
  monthlyMinutes: number;
  yearlyMinutes: number;
}

export interface SocialProfile {
  followers: string[];
  following: string[];
  friends: string[];
  blockedUsers: string[];
  recentActivity: ActivityItem[];
  sharedPlaylists: string[];
  collaborativePlaylists: string[];
}

export interface ActivityItem {
  id: string;
  type: 'played' | 'liked' | 'shared' | 'created' | 'followed';
  data: any;
  timestamp: number;
  visibility: 'public' | 'friends' | 'private';
}

// Search and Discovery Types
export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  users?: User[];
  total: number;
  query: string;
  filters?: SearchFilters;
  suggestions?: string[];
}

export interface SearchFilters {
  type?: 'all' | 'songs' | 'artists' | 'albums' | 'playlists' | 'users';
  genre?: string;
  year?: number;
  duration?: { min: number; max: number };
  explicit?: boolean;
  quality?: AudioQuality;
  sortBy?: 'relevance' | 'popularity' | 'date' | 'duration' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

// Recommendation Types
export interface Recommendation {
  id: string;
  type: 'song' | 'artist' | 'album' | 'playlist';
  item: Song | Artist | Album | Playlist;
  score: number;
  reasons: string[];
  source: 'collaborative' | 'content' | 'contextual' | 'trending' | 'ml';
  context?: RecommendationContext;
}

export interface RecommendationContext {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  mood?: string;
  activity?: string;
  weather?: string;
  location?: string;
  device?: string;
  previousSongs?: string[];
}

// Analytics and Metrics Types
export interface AnalyticsEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceInfo?: DeviceInfo;
  location?: GeolocationData;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  cookieEnabled: boolean;
  javaEnabled: boolean;
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
}

export interface PlaybackMetrics {
  songId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  completionRate: number;
  skipped: boolean;
  skipTime?: number;
  volume: number;
  quality: AudioQuality;
  source: string;
  context?: string;
}

// Error and Loading Types
export interface AppError {
  id: string;
  type: 'network' | 'audio' | 'auth' | 'validation' | 'unknown';
  message: string;
  details?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  stack?: string;
  recoverable: boolean;
  retryCount?: number;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  cancelable?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// WebSocket and Real-time Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface RealTimeEvent {
  type: 'user_joined' | 'user_left' | 'song_changed' | 'playlist_updated' | 'message' | 'reaction';
  data: any;
  userId: string;
  timestamp: number;
  roomId?: string;
}

export interface CollaborativeSession {
  id: string;
  name: string;
  host: string;
  participants: string[];
  currentSong?: Song;
  queue: Song[];
  isActive: boolean;
  settings: {
    allowGuestControl: boolean;
    requireApproval: boolean;
    maxParticipants: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Offline and Sync Types
export interface OfflineData {
  songs: Song[];
  playlists: Playlist[];
  userPreferences: UserPreferences;
  lastSyncTime: number;
  version: string;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'song' | 'playlist' | 'user' | 'preference';
  data: any;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  retryCount: number;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  testId?: string;
}

export interface SongItemProps extends BaseComponentProps {
  song: Song;
  isPlaying?: boolean;
  isLiked?: boolean;
  showArtist?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  showActions?: boolean;
  onClick?: (song: Song) => void;
  onLike?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
}

export interface PlaylistItemProps extends BaseComponentProps {
  playlist: Playlist;
  showCreator?: boolean;
  showSongCount?: boolean;
  showDuration?: boolean;
  onClick?: (playlist: Playlist) => void;
  onEdit?: (playlist: Playlist) => void;
  onDelete?: (playlist: Playlist) => void;
  onShare?: (playlist: Playlist) => void;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  displayName: string;
  agreeToTerms: boolean;
  subscribeToNewsletter: boolean;
}

export interface PlaylistForm {
  name: string;
  description: string;
  isPublic: boolean;
  isCollaborative: boolean;
  coverArt?: File;
  tags: string[];
  mood?: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

// Event Handler Types
export type EventHandler<T = any> = (data: T) => void;
export type AsyncEventHandler<T = any> = (data: T) => Promise<void>;

// Redux Types
export interface RootState {
  music: any; // Will be properly typed when imported
  user: any;
  playlists: any;
  queue: any;
  ui: any;
  offline: any;
  analytics: any;
}

export type AppDispatch = any; // Will be properly typed when imported

// Constants
export const AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] as const;
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'] as const;
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'] as const;

export type AudioFormat = typeof AUDIO_FORMATS[number];
export type ImageFormat = typeof IMAGE_FORMATS[number];
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
