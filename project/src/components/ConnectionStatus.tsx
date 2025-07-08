import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ConnectionStatus: React.FC = () => {
  const { isOnline, syncStatus, forceSync } = useAuth();

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'pending':
        return 'Syncing...';
      case 'failed':
        return 'Sync failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-4 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-sm ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Sync Status */}
      <div className="flex items-center space-x-2">
        {getSyncIcon()}
        <span className="text-sm text-gray-300">{getSyncText()}</span>
      </div>

      {/* Manual Sync Button */}
      {isOnline && (
        <button
          onClick={forceSync}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Force sync"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;