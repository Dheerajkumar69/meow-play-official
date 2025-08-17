import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export async function clearTestDb() {
  // Skip database cleanup if Supabase is not configured (offline mode)
  if (!isSupabaseConfigured()) {
    console.log('Skipping database cleanup - running in offline mode');
    return;
  }
  
  // Clear all test data
  await Promise.all([
    supabase.from('songs').delete().match({ id: 'test-song-1' }),
    supabase.from('playlists').delete().match({ id: 'test-playlist-1' })
  ]);
}
