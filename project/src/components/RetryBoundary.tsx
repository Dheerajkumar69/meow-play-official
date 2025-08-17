import React, { useState, useCallback, ReactNode } from 'react';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface RetryBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: () => Promise<void>;
  fallback?: ReactNode;
}

export const RetryBoundary: React.FC<RetryBoundaryProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  onRetry,
  fallback
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) return;

    setIsRetrying(true);
    
    try {
      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      
      // Execute custom retry logic if provided
      if (onRetry) {
        await onRetry();
      }
      
      setRetryCount(prev => prev + 1);
      setLastError(null);
    } catch (error) {
      setLastError(error as Error);
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, isRetrying, retryDelay, onRetry]);

  const resetRetries = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
    setIsRetrying(false);
  }, []);

  if (lastError && retryCount >= maxRetries) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
          Operation Failed
        </h3>
        <p className="text-red-600 dark:text-red-400 text-center mb-4">
          {lastError.message || 'An unexpected error occurred'}
        </p>
        <div className="flex items-center space-x-2 text-sm text-red-500 mb-4">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
        </div>
        <button
          onClick={resetRetries}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset and Try Again
        </button>
      </div>
    );
  }

  if (isRetrying) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-600 dark:text-gray-400">
          Retrying... ({retryCount + 1}/{maxRetries})
        </p>
      </div>
    );
  }

  return (
    <div>
      {children}
      {lastError && retryCount < maxRetries && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-700 dark:text-yellow-300">
                Something went wrong. Retry available.
              </span>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
