import React from 'react';
import { Loader, Music, Heart, Play, Pause } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-purple-500',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader 
      className={`animate-spin ${sizeClasses[size]} ${color} ${className}`}
    />
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular'
}) => {
  const baseClasses = 'animate-pulse bg-gray-300 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const SongLoadingSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-3 animate-pulse">
    <Skeleton variant="rectangular" className="w-12 h-12" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2 h-3" />
    </div>
    <Skeleton variant="circular" className="w-8 h-8" />
  </div>
);

export const PlaylistLoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4 animate-pulse">
      <Skeleton variant="rectangular" className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-1/3 h-3" />
      </div>
    </div>
    {[...Array(5)].map((_, i) => (
      <SongLoadingSkeleton key={i} />
    ))}
  </div>
);

interface MusicLoadingProps {
  message?: string;
  showIcon?: boolean;
}

export const MusicLoading: React.FC<MusicLoadingProps> = ({
  message = 'Loading...',
  showIcon = true
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    {showIcon && (
      <div className="relative">
        <Music className="w-12 h-12 text-purple-500 animate-pulse" />
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    )}
    <p className="text-gray-600 dark:text-gray-400 text-center">{message}</p>
  </div>
);

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  className = '',
  disabled = false,
  onClick
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`flex items-center justify-center space-x-2 ${className} ${
      isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isLoading && <LoadingSpinner size="sm" />}
    <span>{isLoading ? loadingText : children}</span>
  </button>
);

export const PlayerLoading: React.FC = () => (
  <div className="flex items-center space-x-4 p-4 bg-gray-900/50 rounded-lg">
    <Skeleton variant="rectangular" className="w-14 h-14" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/3 h-3" />
    </div>
    <div className="flex items-center space-x-2">
      <Skeleton variant="circular" className="w-10 h-10" />
      <Skeleton variant="circular" className="w-10 h-10" />
      <Skeleton variant="circular" className="w-10 h-10" />
    </div>
  </div>
);

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  backdrop?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  backdrop = true
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${
      backdrop ? 'bg-black/50 backdrop-blur-sm' : ''
    }`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <MusicLoading message={message} />
      </div>
    </div>
  );
};
