// 🐱 Supabase Connection Test for MeowPlay Cat Colony
// Test all database connections and Phase 5 features

import { supabase } from '../lib/supabase';

interface ConnectionTestResult {
  test: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

export class SupabaseConnectionTester {
  private results: ConnectionTestResult[] = [];

  async runAllTests(): Promise<ConnectionTestResult[]> {
    this.results = [];
    
    console.log('🐱 Starting MeowPlay Supabase Connection Tests...');
    
    await this.testBasicConnection();
    await this.testAuthentication();
    await this.testUserProfiles();
    await this.testSongsTable();
    await this.testPlaylistsTable();
    await this.testPhase5Tables();
    await this.testRealTimeFeatures();
    await this.testStorageAccess();
    
    this.printResults();
    return this.results;
  }

  private async testBasicConnection() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      this.addResult('Basic Connection', 'success', 'Successfully connected to Supabase database');
    } catch (error) {
      this.addResult('Basic Connection', 'error', `Failed to connect: ${error}`);
    }
  }

  private async testAuthentication() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        this.addResult('Authentication', 'success', `User authenticated: ${session.user.email}`);
      } else {
        this.addResult('Authentication', 'success', 'No active session (expected for fresh setup)');
      }
    } catch (error) {
      this.addResult('Authentication', 'error', `Auth test failed: ${error}`);
    }
  }

  private async testUserProfiles() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, favorite_cat_breed, purr_level, cat_coins')
        .limit(5);
      
      if (error) throw error;
      
      this.addResult('User Profiles', 'success', `Cat profiles table accessible. Found ${data?.length || 0} cats in colony`, data);
    } catch (error) {
      this.addResult('User Profiles', 'error', `Failed to access user profiles: ${error}`);
    }
  }

  private async testSongsTable() {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist, cat_rating, is_cat_approved, purr_factor')
        .limit(5);
      
      if (error) throw error;
      
      this.addResult('Songs Table', 'success', `Purrfect songs table accessible. Found ${data?.length || 0} songs`, data);
    } catch (error) {
      this.addResult('Songs Table', 'error', `Failed to access songs: ${error}`);
    }
  }

  private async testPlaylistsTable() {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, playlist_mood, cat_theme')
        .limit(5);
      
      if (error) throw error;
      
      this.addResult('Playlists Table', 'success', `Cat playlists accessible. Found ${data?.length || 0} playlists`, data);
    } catch (error) {
      this.addResult('Playlists Table', 'error', `Failed to access playlists: ${error}`);
    }
  }

  private async testPhase5Tables() {
    const phase5Tables = [
      'user_follows',
      'activity_feed', 
      'listening_parties',
      'party_participants',
      'party_messages',
      'chat_rooms',
      'chat_messages',
      'chat_room_members',
      'user_presence'
    ];

    for (const table of phase5Tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        this.addResult(`Phase 5: ${table}`, 'success', `Table ${table} accessible and ready for cat social features`);
      } catch (error) {
        this.addResult(`Phase 5: ${table}`, 'error', `Failed to access ${table}: ${error}`);
      }
    }
  }

  private async testRealTimeFeatures() {
    try {
      // Test realtime subscription setup
      const channel = supabase
        .channel('test-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'activity_feed'
        }, (payload) => {
          console.log('Realtime test received:', payload);
        });

      await channel.subscribe();
      
      this.addResult('Realtime Features', 'success', 'Realtime subscriptions working for cat social features');
      
      // Clean up
      await channel.unsubscribe();
    } catch (error) {
      this.addResult('Realtime Features', 'error', `Realtime test failed: ${error}`);
    }
  }

  private async testStorageAccess() {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      const bucketNames = data.map(bucket => bucket.name);
      const expectedBuckets = ['audio-files', 'cover-art', 'avatars'];
      const missingBuckets = expectedBuckets.filter(bucket => !bucketNames.includes(bucket));
      
      if (missingBuckets.length > 0) {
        this.addResult('Storage Access', 'error', `Missing storage buckets: ${missingBuckets.join(', ')}. Please create them in Supabase dashboard.`);
      } else {
        this.addResult('Storage Access', 'success', 'All required storage buckets are available');
      }
    } catch (error) {
      this.addResult('Storage Access', 'error', `Storage test failed: ${error}`);
    }
  }

  private addResult(test: string, status: 'success' | 'error', message: string, details?: any) {
    this.results.push({ test, status, message, details });
  }

  private printResults() {
    console.log('\n🐱 ===== MEOWPLAY SUPABASE TEST RESULTS =====');
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details && result.status === 'success') {
        console.log(`   📊 Sample data:`, result.details);
      }
    });
    
    console.log(`\n🎯 Test Summary: ${successCount} passed, ${errorCount} failed`);
    
    if (errorCount === 0) {
      console.log('🎉 All tests passed! Your MeowPlay cat colony is ready to purr! 🐾');
    } else {
      console.log('⚠️  Some tests failed. Please check the Supabase setup and run the SQL script.');
    }
  }

  // Quick connection test for development
  static async quickTest(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('🐱 Quick Supabase connection test: SUCCESS');
      return true;
    } catch (error) {
      console.error('🐱 Quick Supabase connection test: FAILED', error);
      return false;
    }
  }

  // Test specific Phase 5 feature
  static async testPhase5Feature(feature: 'social' | 'parties' | 'chat' | 'ai'): Promise<boolean> {
    try {
      switch (feature) {
        case 'social':
          const { data: followData, error: followError } = await supabase
            .from('user_follows')
            .select('*')
            .limit(1);
          if (followError) throw followError;
          break;
          
        case 'parties':
          const { data: partyData, error: partyError } = await supabase
            .from('listening_parties')
            .select('*')
            .limit(1);
          if (partyError) throw partyError;
          break;
          
        case 'chat':
          const { data: chatData, error: chatError } = await supabase
            .from('chat_rooms')
            .select('*')
            .limit(1);
          if (chatError) throw chatError;
          break;
          
        case 'ai':
          const { data: historyData, error: historyError } = await supabase
            .from('listening_history')
            .select('*')
            .limit(1);
          if (historyError) throw historyError;
          break;
      }
      
      console.log(`🐱 Phase 5 ${feature} feature test: SUCCESS`);
      return true;
    } catch (error) {
      console.error(`🐱 Phase 5 ${feature} feature test: FAILED`, error);
      return false;
    }
  }
}

// Auto-run quick test on import in development
if (import.meta.env.DEV) {
  SupabaseConnectionTester.quickTest();
}

export default SupabaseConnectionTester;
