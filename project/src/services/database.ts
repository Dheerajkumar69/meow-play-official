import { supabase } from '../lib/supabase';
import type { User, Song, Playlist } from '../types';

export class DatabaseService {
  // User operations
  static async createUser(userData: {
    id?: string;
    email: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    is_artist?: boolean;
    is_admin?: boolean;
  }) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUser(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<User>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Song operations
  static async createSong(songData: {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    duration: number;
    file_url: string;
    cover_art_url?: string;
    uploaded_by: string;
    lyrics?: string;
    mood?: string[];
    tempo?: number;
    key?: string;
    year?: number;
    is_public?: boolean;
  }) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .insert(songData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSongs(limit = 50, offset = 0) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getSong(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserSongs(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateSong(id: string, updates: Partial<Song>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSong(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async incrementPlayCount(songId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .rpc('increment_play_count', { song_id: songId });

    if (error) throw error;
    return data;
  }

  // Playlist operations
  static async createPlaylist(playlistData: {
    name: string;
    description?: string;
    cover_art_url?: string;
    user_id: string;
    is_public?: boolean;
    is_collaborative?: boolean;
  }) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert(playlistData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPlaylist(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs (
          position,
          songs (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserPlaylists(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async addSongToPlaylist(playlistId: string, songId: string, userId: string, position?: number) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get the next position if not provided
    if (position === undefined) {
      const { count } = await supabase
        .from('playlist_songs')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);
      
      position = (count || 0) + 1;
    }

    const { data, error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: songId,
        position,
        added_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeSongFromPlaylist(playlistId: string, songId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);

    if (error) throw error;
  }

  // Like operations
  static async likeSong(userId: string, songId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('user_likes')
      .insert({
        user_id: userId,
        song_id: songId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unlikeSong(userId: string, songId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);

    if (error) throw error;
  }

  static async getUserLikes(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('user_likes')
      .select(`
        *,
        songs (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Search operations
  static async searchSongs(query: string, limit = 20) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
      .eq('is_public', true)
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async searchUsers(query: string, limit = 20) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, is_artist')
      .or(`username.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Analytics operations
  static async addListeningHistory(userId: string, songId: string, playDuration: number) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('listening_history')
      .insert({
        user_id: userId,
        song_id: songId,
        play_duration: playDuration
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserListeningHistory(userId: string, limit = 50) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('listening_history')
      .select(`
        *,
        songs (*)
      `)
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

export default DatabaseService;
