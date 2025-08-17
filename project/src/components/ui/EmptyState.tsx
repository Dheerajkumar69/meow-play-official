import React from 'react';
import { LucideIcon, Music, Search, Heart, Upload, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon | React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
  /** Empty state variant for pre-defined styles */
  variant?: 'default' | 'search' | 'music' | 'favorites' | 'upload' | 'offline' | 'error';
  /** Size of the empty state */
  size?: 'sm' | 'md' | 'lg';
  /** Custom illustration or image */
  illustration?: React.ReactNode;
  /** Full height container */
  fullHeight?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  illustration,
  fullHeight = false,
}) => {
  // Pre-defined variants
  const variants = {
    default: {
      icon: Music,
      iconColor: 'text-neutral-400',
      bgColor: 'bg-neutral-500/20',
    },
    search: {
      icon: Search,
      iconColor: 'text-neutral-400',
      bgColor: 'bg-neutral-500/20',
    },
    music: {
      icon: Music,
      iconColor: 'text-brand-400',
      bgColor: 'bg-brand-500/20',
    },
    favorites: {
      icon: Heart,
      iconColor: 'text-accent-400',
      bgColor: 'bg-accent-500/20',
    },
    upload: {
      icon: Upload,
      iconColor: 'text-success-400',
      bgColor: 'bg-success-500/20',
    },
    offline: {
      icon: WifiOff,
      iconColor: 'text-warning-400',
      bgColor: 'bg-warning-500/20',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-error-400',
      bgColor: 'bg-error-500/20',
    },
  };

  const variantConfig = variants[variant];
  const IconComponent = icon || variantConfig.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'py-8 px-4',
      iconSize: 'w-12 h-12',
      iconContainer: 'w-16 h-16 mb-4',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2',
    },
    md: {
      container: 'py-12 px-6',
      iconSize: 'w-16 h-16',
      iconContainer: 'w-20 h-20 mb-6',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4',
    },
    lg: {
      container: 'py-16 px-8',
      iconSize: 'w-20 h-20',
      iconContainer: 'w-24 h-24 mb-8',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6',
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        fullHeight && 'min-h-[400px]'
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center mb-6',
            config.iconContainer,
            variantConfig.bgColor
          )}
        >
          {typeof IconComponent === 'function' ? (
            <IconComponent className={cn(config.iconSize, variantConfig.iconColor)} />
          ) : (
            IconComponent
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn('max-w-md', config.spacing)}>
        {/* Title */}
        <h3 className={cn('font-semibold text-white', config.title)}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className={cn('text-neutral-400 leading-relaxed', config.description)}>
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            {action && (
              <Button
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                loading={action.loading}
                size={size}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'ghost'}
                onClick={secondaryAction.onClick}
                size={size}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Pre-built empty state components
export const NoSearchResults: React.FC<{
  query?: string;
  onReset?: () => void;
}> = ({ query, onReset }) => (
  <EmptyState
    variant="search"
    title={query ? `No results for "${query}"` : 'No search results'}
    description="Try adjusting your search terms or browse our collection"
    action={onReset ? {
      label: 'Clear search',
      onClick: onReset,
      variant: 'ghost'
    } : undefined}
  />
);

export const NoMusic: React.FC<{
  onUpload?: () => void;
  onBrowse?: () => void;
}> = ({ onUpload, onBrowse }) => (
  <EmptyState
    variant="music"
    title="No music found"
    description="Start building your music library by uploading songs or browsing our collection"
    action={onUpload ? {
      label: 'Upload music',
      onClick: onUpload,
      variant: 'primary'
    } : undefined}
    secondaryAction={onBrowse ? {
      label: 'Browse music',
      onClick: onBrowse,
      variant: 'ghost'
    } : undefined}
  />
);

export const NoFavorites: React.FC<{
  onDiscover?: () => void;
}> = ({ onDiscover }) => (
  <EmptyState
    variant="favorites"
    title="No favorites yet"
    description="Start discovering music and add songs to your favorites collection"
    action={onDiscover ? {
      label: 'Discover music',
      onClick: onDiscover,
      variant: 'primary'
    } : undefined}
  />
);

export const OfflineState: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <EmptyState
    variant="offline"
    title="You're offline"
    description="Check your internet connection and try again"
    action={onRetry ? {
      label: 'Try again',
      onClick: onRetry,
      variant: 'primary'
    } : undefined}
  />
);

export const ErrorState: React.FC<{
  error?: string;
  onRetry?: () => void;
  onReport?: () => void;
}> = ({ error, onRetry, onReport }) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={error || "We're having trouble loading this content"}
    action={onRetry ? {
      label: 'Try again',
      onClick: onRetry,
      variant: 'primary'
    } : undefined}
    secondaryAction={onReport ? {
      label: 'Report issue',
      onClick: onReport,
      variant: 'ghost'
    } : undefined}
  />
);

export const EmptyPlaylist: React.FC<{
  onAddSongs?: () => void;
  onBrowse?: () => void;
}> = ({ onAddSongs, onBrowse }) => (
  <EmptyState
    variant="music"
    title="This playlist is empty"
    description="Add some songs to get started"
    action={onAddSongs ? {
      label: 'Add songs',
      onClick: onAddSongs,
      variant: 'primary'
    } : undefined}
    secondaryAction={onBrowse ? {
      label: 'Browse music',
      onClick: onBrowse,
      variant: 'ghost'
    } : undefined}
  />
);

export const EmptyQueue: React.FC<{
  onAddToQueue?: () => void;
  onShuffle?: () => void;
}> = ({ onAddToQueue, onShuffle }) => (
  <EmptyState
    variant="music"
    title="Queue is empty"
    description="Add songs to your queue to start playing"
    size="sm"
    action={onAddToQueue ? {
      label: 'Add to queue',
      onClick: onAddToQueue,
      variant: 'primary'
    } : undefined}
    secondaryAction={onShuffle ? {
      label: 'Shuffle all',
      onClick: onShuffle,
      variant: 'ghost'
    } : undefined}
  />
);

export default EmptyState;
