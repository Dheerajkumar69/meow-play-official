import React from 'react';
import { cn } from '../../utils/cn';

// Loading Spinner Component
export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Spinner color */
  color?: 'brand' | 'white' | 'gray' | 'success' | 'error' | 'warning';
  /** Show text alongside spinner */
  text?: string;
  /** Center the spinner */
  centered?: boolean;
  /** Full screen overlay */
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'brand',
  text,
  centered = false,
  overlay = false,
}) => {
  // Size styles
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  // Color styles
  const colorStyles = {
    brand: 'text-brand-500',
    white: 'text-white',
    gray: 'text-neutral-400',
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
  };

  const textSize = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const content = (
    <div className={cn(
      "flex items-center",
      text ? "space-x-2" : "",
      centered && "justify-center"
    )}>
      <svg
        className={cn(
          "animate-spin",
          sizeStyles[size],
          colorStyles[color]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
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
      {text && (
        <span className={cn(textSize[size], colorStyles[color])}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-neutral-900 rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Number of lines for text variant */
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  lines = 1,
  ...props
}) => {
  // Base styles
  const baseStyles = 'bg-white/10 rounded';

  // Animation styles
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]',
    none: '',
  };

  // Variant styles
  const variantStyles = {
    text: 'h-4 rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              animationStyles[animation],
              variantStyles[variant],
              i === lines - 1 && "w-3/4" // Last line is shorter
            )}
            style={{ ...style, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseStyles,
        animationStyles[animation],
        variantStyles[variant],
        className
      )}
      style={style}
      {...props}
    />
  );
};

// Song Card Skeleton
export const SongCardSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-3">
      {/* Play button */}
      <Skeleton variant="circular" width={32} height={32} />
      
      {/* Album cover */}
      <Skeleton variant="rounded" width={48} height={48} />
      
      {/* Song info */}
      <div className="flex-1 min-w-0">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" />
      </div>
      
      {/* Album */}
      <div className="hidden md:block w-48">
        <Skeleton variant="text" width="70%" />
      </div>
      
      {/* Play count */}
      <div className="hidden lg:block w-20">
        <Skeleton variant="text" width="50%" />
      </div>
      
      {/* Duration */}
      <div className="w-16">
        <Skeleton variant="text" width="100%" />
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="bg-neutral-900/80 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton variant="text" width="50%" className="mb-2" />
          <Skeleton variant="text" width="30%" />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      
      <div className="space-y-2">
        <Skeleton variant="text" lines={lines} />
      </div>
      
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/10">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
};

// Grid Skeleton
export const GridSkeleton: React.FC<{ 
  items?: number; 
  columns?: number; 
  itemHeight?: number; 
}> = ({ 
  items = 6, 
  columns = 3, 
  itemHeight = 200 
}) => {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    )}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          height={itemHeight}
          animation="wave"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
};

// List Skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-1">
      {Array.from({ length: items }).map((_, i) => (
        <SongCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Loading Dots
export const LoadingDots: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}> = ({ size = 'md', color = 'brand-500' }) => {
  const sizeStyles = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            sizeStyles[size],
            `bg-${color}`,
            "rounded-full animate-bounce"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

// Progress Bar
export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Color */
  color?: 'brand' | 'success' | 'error' | 'warning';
  /** Show value text */
  showValue?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = 'md',
  color = 'brand',
  showValue = false,
  indeterminate = false,
}) => {
  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    brand: 'bg-brand-500',
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
  };

  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      <div className={cn("w-full bg-neutral-700 rounded-full overflow-hidden", sizeStyles[size])}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            colorStyles[color],
            indeterminate && "animate-pulse"
          )}
          style={indeterminate ? { width: '100%' } : { width: `${clampedValue}%` }}
        />
      </div>
      {showValue && !indeterminate && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-neutral-400">{Math.round(clampedValue)}%</span>
        </div>
      )}
    </div>
  );
};
