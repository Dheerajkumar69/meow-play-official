/**
 * Comprehensive Error Handling & Loading States System
 * Production-grade error boundaries and loading components
 */

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Wifi, WifiOff } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useTheme } from '../../theme/ThemeContext';
import { FadeIn, Scale } from './AnimationSystem';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  context?: string;
}

// Error Boundary Class Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { contexts: { errorInfo } });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          showDetails={this.props.showErrorDetails}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  onRetry: () => void;
  showDetails?: boolean;
  context?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  showDetails = false,
  context = 'Application'
}) => {
  const { isDark } = useTheme();
  const [showFullError, setShowFullError] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <FadeIn>
        <Card className="max-w-lg w-full text-center">
          <div className="p-8">
            <Scale trigger="visible">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDark ? 'bg-red-900/20' : 'bg-red-100'
              }`}>
                <AlertTriangle className={`w-8 h-8 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`} />
              </div>
            </Scale>

            <h1 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Something went wrong
            </h1>

            <p className={`mb-6 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {context} encountered an unexpected error. Don't worry, we're working to fix it.
            </p>

            <div className="space-y-4 mb-6">
              <Button
                onClick={onRetry}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <div className="flex space-x-4">
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>

            {showDetails && (
              <div className="text-left">
                <Button
                  onClick={() => setShowFullError(!showFullError)}
                  variant="ghost"
                  size="sm"
                  className="mb-4"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  {showFullError ? 'Hide' : 'Show'} Error Details
                </Button>

                {showFullError && (
                  <div className={`p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <div className="mb-2">
                      <strong>Error ID:</strong> {errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Error:</strong> {error?.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {error?.stack}
                      </pre>
                    </div>
                    {errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </FadeIn>
    </div>
  );
};

// Loading States
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    white: 'text-white',
    gray: isDark ? 'text-gray-400' : 'text-gray-600'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  className?: string;
}> = ({ isLoading, children, message = 'Loading...', className = '' }) => {
  const { isDark } = useTheme();

  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center z-50 ${
          isDark ? 'bg-black/50' : 'bg-white/80'
        } backdrop-blur-sm`}>
          <FadeIn>
            <div className="text-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <p className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {message}
              </p>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
};

// Network Status Component
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <FadeIn>
      <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center ${
        isDark ? 'bg-red-900 text-red-100' : 'bg-red-600 text-white'
      }`}>
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            You're offline. Some features may not work properly.
          </span>
        </div>
      </div>
    </FadeIn>
  );
};

// Retry Component
export const RetryComponent: React.FC<{
  onRetry: () => void;
  error?: string;
  className?: string;
}> = ({ onRetry, error = 'Something went wrong', className = '' }) => {
  const { isDark } = useTheme();

  return (
    <div className={`text-center p-8 ${className}`}>
      <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${
        isDark ? 'text-yellow-400' : 'text-yellow-600'
      }`} />
      <h3 className={`text-lg font-semibold mb-2 ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}>
        {error}
      </h3>
      <p className={`mb-4 ${
        isDark ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Please try again or contact support if the problem persists.
      </p>
      <Button onClick={onRetry} variant="primary">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
};

// Empty State Component
export const EmptyState: React.FC<{
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className = '' }) => {
  const { isDark } = useTheme();

  return (
    <div className={`text-center p-8 ${className}`}>
      <FadeIn>
        {icon && (
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            {icon}
          </div>
        )}
        <h3 className={`text-lg font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        {description && (
          <p className={`mb-4 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {description}
          </p>
        )}
        {action}
      </FadeIn>
    </div>
  );
};

// Error Hook for functional components
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = (error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  };

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

export default {
  ErrorBoundary,
  LoadingSpinner,
  LoadingOverlay,
  NetworkStatus,
  RetryComponent,
  EmptyState,
  useErrorHandler
};
