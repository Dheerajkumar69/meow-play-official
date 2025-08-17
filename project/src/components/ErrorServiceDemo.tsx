import React from 'react';
import { AlertTriangle, Bug, Database, Network, Shield, Zap } from 'lucide-react';
import { errorService } from '../services/ErrorService';

const ErrorServiceDemo: React.FC = () => {
  const handleNetworkError = async () => {
    try {
      // Simulate a network error
      throw new Error('Failed to fetch data from server');
    } catch (error) {
      await errorService.logNetworkError(error as Error, 'https://api.example.com/data', 'GET');
      errorService.showError('Unable to connect to the server. Please check your connection.');
    }
  };

  const handleDatabaseError = async () => {
    try {
      // Simulate a database error
      throw new Error('Connection timeout');
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'query', 'songs');
      errorService.showError('Database is temporarily unavailable. Retrying automatically...');
    }
  };

  const handleAuthError = async () => {
    try {
      // Simulate an auth error
      throw new Error('Invalid credentials');
    } catch (error) {
      await errorService.logAuthError(error as Error, 'login');
      errorService.showError('Login failed. Please check your credentials.', {
        action: { label: 'Try Again', onClick: () => console.log('Retry login') }
      });
    }
  };

  const handleUIError = async () => {
    try {
      // Simulate a UI component error
      throw new Error('Failed to render component');
    } catch (error) {
      await errorService.logUIError(error as Error, 'MusicPlayer');
      errorService.showWarning('Music player encountered an issue. Refreshing...');
    }
  };

  const showSuccessMessage = () => {
    errorService.showSuccess('Operation completed successfully!');
  };

  const showInfoMessage = () => {
    errorService.showInfo('This is an informational message.', {
      duration: 3000
    });
  };

  const showPersistentWarning = () => {
    errorService.showWarning('This is a persistent warning that requires user action.', {
      persistent: true,
      action: {
        label: 'Dismiss',
        onClick: () => errorService.clearAllToasts()
      }
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-indigo-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Bug className="w-8 h-8 mr-3 text-purple-400" />
            Error Service Demo
          </h2>
          <p className="text-gray-300 mb-8">
            Test the centralized error handling and notification system.
          </p>

          {/* Error Type Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button
              onClick={handleNetworkError}
              className="flex items-center space-x-3 p-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/50 transition-all"
            >
              <Network className="w-5 h-5" />
              <span>Network Error</span>
            </button>

            <button
              onClick={handleDatabaseError}
              className="flex items-center space-x-3 p-4 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg border border-orange-500/50 transition-all"
            >
              <Database className="w-5 h-5" />
              <span>Database Error</span>
            </button>

            <button
              onClick={handleAuthError}
              className="flex items-center space-x-3 p-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg border border-yellow-500/50 transition-all"
            >
              <Shield className="w-5 h-5" />
              <span>Auth Error</span>
            </button>

            <button
              onClick={handleUIError}
              className="flex items-center space-x-3 p-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/50 transition-all"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>UI Error</span>
            </button>

            <button
              onClick={showSuccessMessage}
              className="flex items-center space-x-3 p-4 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/50 transition-all"
            >
              <Zap className="w-5 h-5" />
              <span>Success Message</span>
            </button>

            <button
              onClick={showInfoMessage}
              className="flex items-center space-x-3 p-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/50 transition-all"
            >
              <Zap className="w-5 h-5" />
              <span>Info Message</span>
            </button>
          </div>

          {/* Additional Controls */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-xl font-semibold text-white mb-4">Advanced Controls</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={showPersistentWarning}
                className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 rounded border border-yellow-600/50 transition-all"
              >
                Persistent Warning
              </button>
              
              <button
                onClick={() => errorService.clearAllToasts()}
                className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded border border-gray-600/50 transition-all"
              >
                Clear All Toasts
              </button>

              <button
                onClick={() => {
                  const toasts = errorService.getActiveToasts();
                  console.log('Active toasts:', toasts);
                  errorService.showInfo(`Found ${toasts.length} active toasts`);
                }}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded border border-indigo-600/50 transition-all"
              >
                Show Active Count
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-medium text-blue-300 mb-2">Instructions:</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Click buttons to trigger different types of errors and notifications</li>
              <li>• Errors are automatically logged with context and severity</li>
              <li>• User-friendly toasts appear in the top-right corner</li>
              <li>• Check the browser console to see detailed error logs</li>
              <li>• Network and database operations include automatic retry logic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorServiceDemo;
