import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../services/database';

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string>('');
  const [dbTest, setDbTest] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!supabase) {
          setConnectionStatus('error');
          setError('Supabase client not configured');
          return;
        }

        // Test 1: Check if we can connect to Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError && sessionError.message !== 'session_not_found') {
          throw sessionError;
        }

        // Test 2: Check if our database schema exists
        const { data: usersTest, error: dbError } = await supabase
          .from('users')
          .select('id')
          .limit(1);

        if (dbError) {
          setDbTest(`Database schema not found: ${dbError.message}`);
        } else {
          setDbTest('Database schema is properly set up ✓');
        }

        setConnectionStatus('connected');
      } catch (err) {
        setConnectionStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Supabase Connection Test</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'checking' ? 'bg-yellow-500' :
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-300">
            Connection: {connectionStatus === 'checking' ? 'Checking...' : connectionStatus}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {dbTest && (
          <div className={`p-3 rounded text-sm ${
            dbTest.includes('not found') 
              ? 'bg-yellow-900/20 border border-yellow-500/30 text-yellow-400'
              : 'bg-green-900/20 border border-green-500/30 text-green-400'
          }`}>
            {dbTest}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-4">
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configured ✓' : 'Not set ✗'}</p>
          <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured ✓' : 'Not set ✗'}</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;
