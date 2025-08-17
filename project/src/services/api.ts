import { supabase } from '../lib/supabase';
import { User, Song, Playlist } from '../types';
import { makeRetryable } from '../utils/retry';
import { errorService } from './ErrorService';
import { offlineAuth } from '../utils/offlineAuth';

class ApiService {
  private static instance: ApiService;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private isSupabaseConfigured(): boolean {
    return Boolean(supabase);
  }

  // User Management
  async createUser(userData: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ user: User; session: any }> {
    if (!this.isSupabaseConfigured()) {
      return offlineAuth.register(userData.email, userData.password, userData.username);
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase!.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username
          }
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { data: profileData, error: profileError } = await supabase!
        .from('users')
        .insert({
          id: authData.user!.id,
          email: userData.email,
          username: userData.username,
          is_artist: false,
          is_admin: false
        })
        .select()
        .single();

      if (profileError) throw profileError;

      return {
        user: this.transformSupabaseUser(profileData),
        session: authData.session
      };
    } catch (error) {
      await errorService.logAuthError(error as Error, 'registration');
      return offlineAuth.register(userData.email, userData.password, userData.username);
    }
  }

  async signIn(email: string, password: string): Promise<{ user: User; session: any }> {
    if (!this.isSupabaseConfigured()) {
      return offlineAuth.login(email, password);
    }

    try {
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Get user profile
      const { data: profileData, error: profileError } = await supabase!
        .from('users')
        .select('*')
        .eq('id', authData.user!.id)
        .single();

      if (profileError) throw profileError;

      return {
        user: this.transformSupabaseUser(profileData),
        session: authData.session
      };
    } catch (error) {
      await errorService.logAuthError(error as Error, 'login');
      return offlineAuth.login(email, password);
    }
  }

  async signOut(): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase!.auth.signOut();
    }
    offlineAuth.logout();
  }

  // Song Management
  async uploadSong(songData: {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    duration: number;
    file: File;
    coverArt?: File;
    userId: string;
  }): Promise<Song> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to local storage
      throw new Error('Backend not configured. Using local storage.');
    }

    try {
      // Upload audio file
      const audioFileName = `${Date.now()}-${songData.file.name}`;
      const { data: audioUpload, error: audioError } = await supabase!.storage
        .from('audio-files')
        .upload(audioFileName, songData.file);

      if (audioError) throw audioError;

      // Upload cover art if provided
      let coverArtUrl = null;
      if (songData.coverArt) {
        const coverFileName = `${Date.now()}-cover-${songData.coverArt.name}`;
        const { data: coverUpload, error: coverError } = await supabase!.storage
          .from('cover-art')
          .upload(coverFileName, songData.coverArt);

        if (!coverError) {
          const { data: coverUrlData } = supabase!.storage
            .from('cover-art')
            .getPublicUrl(coverUpload.path);
          coverArtUrl = coverUrlData.publicUrl;
        }
      }

      // Get public URL for audio
      const { data: audioUrlData } = supabase!.storage
        .from('audio-files')
        .getPublicUrl(audioUpload.path);

      // Create song record
      const { data: songRecord, error: songError } = await supabase!
        .from('songs')
        .insert({
          title: songData.title,
          artist: songData.artist,
          album: songData.album,
          genre: songData.genre,
          duration: songData.duration,
          file_url: audioUrlData.publicUrl,
          cover_art_url: coverArtUrl,
          uploaded_by: songData.userId,
          is_public: true
        })
        .select()
        .single();

      if (songError) throw songError;

      return this.transformSupabaseSong(songRecord);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/songs', 'POST');
      throw error;
    }
  }

  async getAllSongs(): Promise<Song[]> {
    if (!this.isSupabaseConfigured()) {
      // Return mock data for offline mode
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('songs')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.transformSupabaseSong);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/songs', 'GET');
      return [];
    }
  }

  async searchSongs(query: string): Promise<Song[]> {
    if (!this.isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('songs')
        .select('*')
        .eq('is_public', true)
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
        .order('play_count', { ascending: false });

      if (error) throw error;

      return data.map(this.transformSupabaseSong);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/songs/search', 'GET');
      return [];
    }
  }

  async likeSong(userId: string, songId: string): Promise<void> {
    if (!this.isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('user_likes')
        .insert({ user_id: userId, song_id: songId });

      if (error) throw error;

      // Update song likes count
      await supabase!.rpc('increment_song_likes', { song_id: songId });
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/user_likes', 'POST');
    }
  }

  async unlikeSong(userId: string, songId: string): Promise<void> {
    if (!this.isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('user_likes')
        .delete()
        .eq('user_id', userId)
        .eq('song_id', songId);

      if (error) throw error;

      // Update song likes count
      await supabase!.rpc('decrement_song_likes', { song_id: songId });
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/user_likes', 'DELETE');
    }
  }

  async trackPlay(userId: string, songId: string, duration: number): Promise<void> {
    if (!this.isSupabaseConfigured()) return;

    try {
      // Add to listening history
      await supabase!
        .from('listening_history')
        .insert({
          user_id: userId,
          song_id: songId,
          play_duration: duration
        });

      // Update play count
      await supabase!.rpc('increment_play_count', { song_id: songId });
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/listening_history', 'POST');
    }
  }

  // Playlist Management
  async createPlaylist(playlistData: {
    name: string;
    description?: string;
    userId: string;
    isPublic: boolean;
  }): Promise<Playlist> {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Backend not configured');
    }

    try {
      const { data, error } = await supabase!
        .from('playlists')
        .insert({
          name: playlistData.name,
          description: playlistData.description,
          user_id: playlistData.userId,
          is_public: playlistData.isPublic,
          is_collaborative: false
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformSupabasePlaylist(data);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/playlists', 'POST');
      throw error;
    }
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    if (!this.isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase!
        .from('playlists')
        .select(`
          *,
          playlist_songs (
            song_id,
            position,
            songs (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(this.transformSupabasePlaylist);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/playlists', 'GET');
      return [];
    }
  }

  // Analytics
  async getUserStats(userId: string): Promise<any> {
    if (!this.isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase!.rpc('get_user_stats', {
        user_id: userId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/rpc/get_user_stats', 'POST');
      return null;
    }
  }

  // Social Features
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (!this.isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        });

      if (error) throw error;
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/user_follows', 'POST');
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    if (!this.isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/user_follows', 'DELETE');
    }
  }

  // User Profile Management
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Backend not configured');
    }

    try {
      const user = await supabase!.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Upload avatar file
      const fileName = `${user.data.user.id}-${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase!.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      const avatarUrl = urlData.publicUrl;

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase!
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.data.user.id);

      if (updateError) throw updateError;

      return { avatarUrl };
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/avatar', 'POST');
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: {
    username?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<User> {
    if (!this.isSupabaseConfigured()) {
      throw new Error('Backend not configured');
    }

    try {
      const { data, error } = await supabase!
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.transformSupabaseUser(data);
    } catch (error) {
      await errorService.logNetworkError(error as Error, '/users', 'PUT');
      throw error;
    }
  }

  // Transform functions
  private transformSupabaseUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatar_url,
      bio: userData.bio,
      isArtist: userData.is_artist,
      isAdmin: userData.is_admin,
      createdAt: new Date(userData.created_at)
    };
  }

  private transformSupabaseSong(songData: any): Song {
    return {
      id: songData.id,
      title: songData.title,
      artist: songData.artist,
      album: songData.album,
      genre: songData.genre,
      duration: songData.duration,
      filePath: songData.file_url,
      coverArt: songData.cover_art_url,
      uploadedBy: songData.uploaded_by,
      playCount: songData.play_count,
      liked: false, // Will be determined by user_likes query
      averageRating: songData.average_rating,
      totalRatings: songData.total_ratings,
      lyrics: songData.lyrics,
      mood: songData.mood,
      tempo: songData.tempo,
      key: songData.key,
      year: songData.year,
      createdAt: new Date(songData.created_at)
    };
  }

  private transformSupabasePlaylist(playlistData: any): Playlist {
    const songs = playlistData.playlist_songs
      ?.sort((a: any, b: any) => a.position - b.position)
      ?.map((ps: any) => this.transformSupabaseSong(ps.songs)) || [];

    return {
      id: playlistData.id,
      name: playlistData.name,
      description: playlistData.description,
      songs,
      userId: playlistData.user_id,
      isPublic: playlistData.is_public,
      isCollaborative: playlistData.is_collaborative,
      createdAt: new Date(playlistData.created_at),
      coverArt: playlistData.cover_art_url
    };
  }
}

export const apiService = ApiService.getInstance();
export { ApiService };

// Create a retryable version of the API service
export const retryableApiService = makeRetryable(apiService, {
  createUser: { maxAttempts: 2, context: 'auth' },
  signIn: { maxAttempts: 2, context: 'auth' },
  uploadSong: { maxAttempts: 3, context: 'upload' },
  getAllSongs: { maxAttempts: 2, context: 'songs' },
  searchSongs: { maxAttempts: 2, context: 'search' },
  createPlaylist: { maxAttempts: 2, context: 'playlists' },
  getUserPlaylists: { maxAttempts: 2, context: 'playlists' },
  getUserStats: { maxAttempts: 2, context: 'stats' }
});
