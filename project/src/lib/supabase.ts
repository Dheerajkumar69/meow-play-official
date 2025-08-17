import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using offline mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);

// Initialize Supabase client
if (supabase) {
  console.log('Supabase client initialized successfully');
} else {
  console.warn('Supabase client not initialized - running in offline mode');
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url?: string;
          bio?: string;
          is_artist: boolean;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          avatar_url?: string;
          bio?: string;
          is_artist?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          avatar_url?: string;
          bio?: string;
          is_artist?: boolean;
          is_admin?: boolean;
          updated_at?: string;
        };
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string;
          album?: string;
          genre?: string;
          duration: number;
          file_url: string;
          cover_art_url?: string;
          uploaded_by: string;
          play_count: number;
          likes_count: number;
          average_rating?: number;
          total_ratings: number;
          lyrics?: string;
          mood?: string[];
          tempo?: number;
          key?: string;
          year?: number;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist: string;
          album?: string;
          genre?: string;
          duration: number;
          file_url: string;
          cover_art_url?: string;
          uploaded_by: string;
          play_count?: number;
          likes_count?: number;
          average_rating?: number;
          total_ratings?: number;
          lyrics?: string;
          mood?: string[];
          tempo?: number;
          key?: string;
          year?: number;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          album?: string;
          genre?: string;
          duration?: number;
          file_url?: string;
          cover_art_url?: string;
          play_count?: number;
          likes_count?: number;
          average_rating?: number;
          total_ratings?: number;
          lyrics?: string;
          mood?: string[];
          tempo?: number;
          key?: string;
          year?: number;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          name: string;
          description?: string;
          cover_art_url?: string;
          user_id: string;
          is_public: boolean;
          is_collaborative: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          cover_art_url?: string;
          user_id: string;
          is_public?: boolean;
          is_collaborative?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          cover_art_url?: string;
          is_public?: boolean;
          is_collaborative?: boolean;
          updated_at?: string;
        };
      };
      playlist_songs: {
        Row: {
          id: string;
          playlist_id: string;
          song_id: string;
          position: number;
          added_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          song_id: string;
          position: number;
          added_by: string;
          created_at?: string;
        };
        Update: {
          position?: number;
        };
      };
      user_likes: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          created_at?: string;
        };
        Update: never;
      };
      user_follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: never;
      };
      listening_history: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          played_at: string;
          play_duration: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          played_at?: string;
          play_duration: number;
        };
        Update: never;
      };
    };
  };
}