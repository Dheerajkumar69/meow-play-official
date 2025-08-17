import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../../services/api';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'new-id' } })
    })
  });

  const mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null })
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        returns: vi.fn().mockResolvedValue({ data: [] })
      })
    })
  });

  const mockUpsert = vi.fn().mockResolvedValue({ error: null });

  return {
    createClient: vi.fn(() => ({
      from: vi.fn((table) => ({
        insert: mockInsert,
        delete: mockDelete,
        select: mockSelect,
        upsert: mockUpsert
      })),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } })
      }
    }))
  };
});

// Mock IndexedDB
vi.mock('idb', () => {
  return {
    openDB: vi.fn().mockResolvedValue({
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn(),
          delete: vi.fn()
        })
      }),
      close: vi.fn()
    })
  };
});

describe('ApiService', () => {
  let apiService: ApiService;
  
  beforeEach(() => {
    apiService = new ApiService();
    vi.clearAllMocks();
  });

  describe('likeSong', () => {
    it('should like a song in Supabase and IndexedDB', async () => {
      const songId = 'song1';
      const result = await apiService.likeSong(songId);
      
      // Verify Supabase client was called correctly
      const client = createClient('', '');
      expect(client.from).toHaveBeenCalledWith('liked_songs');
      expect(client.from('').insert).toHaveBeenCalledWith({
        song_id: songId,
        user_id: 'user1'
      });
      
      // Verify function completed successfully
      expect(result).toBeUndefined();
    });
  });

  describe('unlikeSong', () => {
    it('should unlike a song in Supabase and IndexedDB', async () => {
      const songId = 'song1';
      const result = await apiService.unlikeSong(songId);
      
      // Verify Supabase client was called correctly
      const client = createClient('', '');
      expect(client.from).toHaveBeenCalledWith('liked_songs');
      expect(client.from('').delete).toHaveBeenCalled();
      
      // Verify function completed successfully
      expect(result).toBeUndefined();
    });
  });

  describe('createPlaylist', () => {
    it('should create a playlist in Supabase', async () => {
      const playlistData = {
        name: 'Test Playlist',
        isPublic: true
      };
      
      const result = await apiService.createPlaylist(playlistData);
      
      // Verify Supabase client was called correctly
      const client = createClient('', '');
      expect(client.from).toHaveBeenCalledWith('playlists');
      expect(client.from('').insert).toHaveBeenCalledWith({
        name: playlistData.name,
        user_id: 'user1',
        is_public: playlistData.isPublic
      });
      
      // Verify function returns the created playlist
      expect(result).toEqual({
        id: 'new-id',
        name: playlistData.name,
        userId: 'user1',
        isPublic: playlistData.isPublic
      });
    });
  });

  describe('getUserPlaylists', () => {
    it('should fetch user playlists from Supabase', async () => {
      const mockPlaylists = [
        { id: 'playlist1', name: 'My Playlist', user_id: 'user1', is_public: true },
        { id: 'playlist2', name: 'Another Playlist', user_id: 'user1', is_public: false }
      ];
      
      // Override the mock for this specific test
      const client = createClient('', '');
      client.from('').select = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            returns: vi.fn().mockResolvedValue({ data: mockPlaylists })
          })
        })
      });
      
      const result = await apiService.getUserPlaylists();
      
      // Verify Supabase client was called correctly
      expect(client.from).toHaveBeenCalledWith('playlists');
      expect(client.from('').select).toHaveBeenCalled();
      
      // Verify function transforms the data correctly
      expect(result).toEqual([
        { id: 'playlist1', name: 'My Playlist', userId: 'user1', isPublic: true },
        { id: 'playlist2', name: 'Another Playlist', userId: 'user1', isPublic: false }
      ]);
    });
  });
});