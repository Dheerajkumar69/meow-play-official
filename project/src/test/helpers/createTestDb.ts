import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export async function createTestDb() {
  // Skip database setup if Supabase is not configured (offline mode)
  if (!isSupabaseConfigured()) {
    console.log('Skipping database setup - running in offline mode');
    return;
  }
  
  // Create test tables and seed data
  await supabase.from('songs').upsert([
    {
      id: 'test-song-1',
      title: 'Test Song 1',
      artist: 'Test Artist',
      duration: 180,
      url: 'test-url-1.mp3'
    }
  ]);
  
  await supabase.from('playlists').upsert([
    {
      id: 'test-playlist-1',
      name: 'Test Playlist',
      user_id: 'test-user-1'
    }
  ]);
}
