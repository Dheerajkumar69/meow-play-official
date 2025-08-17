/**
 * Premium Loading States - Top 1% Standards
 * Sophisticated loading components with engaging animations
 */

import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

// Advanced Skeleton Loader
export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  lines = 1
}) => {
  const { isDark } = useTheme();

  const baseStyles = [
    'bg-gradient-to-r',
    isDark 
      ? 'from-gray-800 via-gray-700 to-gray-800' 
      : 'from-gray-200 via-gray-100 to-gray-200',
    animation === 'pulse' ? 'animate-pulse' : '',
    animation === 'wave' ? 'animate-shimmer bg-[length:200%_100%]' : ''
  ].join(' ');

  const variantStyles = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
    rounded: 'rounded-lg'
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : '100%'),
    height: height || (variant === 'text' ? '1rem' : '4rem')
  };

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

// Advanced Spinner
export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'bars' | 'ring' | 'pulse' | 'bounce';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  color = 'primary',
  className = ''
}) => {
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorStyles = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeStyles[size]} ${colorStyles[color]} bg-current rounded-full animate-bounce`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 ${sizeStyles[size].split(' ')[1]} ${colorStyles[color]} bg-current animate-pulse`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeStyles[size]} ${colorStyles[color]} bg-current rounded-full animate-ping ${className}`}
      />
    );
  }

  if (variant === 'bounce') {
    return (
      <div
        className={`${sizeStyles[size]} ${colorStyles[color]} bg-current rounded-full animate-bounce ${className}`}
      />
    );
  }

  // Default ring spinner
  return (
    <div
      className={`${sizeStyles[size]} animate-spin rounded-full border-2 border-gray-300 border-t-current ${colorStyles[color]} ${className}`}
    />
  );
};

// Premium Loading Overlay
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  variant?: 'default' | 'glass' | 'solid';
  spinner?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  variant = 'default',
  spinner,
  className = ''
}) => {
  const { isDark } = useTheme();

  if (!isVisible) return null;

  const variantStyles = {
    default: isDark 
      ? 'bg-gray-900/80 backdrop-blur-sm' 
      : 'bg-white/80 backdrop-blur-sm',
    glass: 'bg-white/10 backdrop-blur-xl',
    solid: isDark ? 'bg-gray-900' : 'bg-white'
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${variantStyles[variant]} ${className}`}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          {spinner || <Spinner size="lg" variant="ring" />}
        </div>
        {message && (
          <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Progress Bar
export interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'striped';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  color = 'primary',
  showLabel = false,
  animated = true,
  className = ''
}) => {
  const { isDark } = useTheme();

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorStyles = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const backgroundStyles = isDark ? 'bg-gray-700' : 'bg-gray-200';

  const progressStyles = [
    colorStyles[color],
    animated ? 'transition-all duration-300 ease-out' : '',
    variant === 'gradient' ? 'bg-gradient-to-r from-blue-400 to-purple-500' : '',
    variant === 'striped' ? 'bg-stripes animate-stripes' : ''
  ].join(' ');

  return (
    <div className={className}>
      <div className={`w-full ${backgroundStyles} rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${sizeStyles[size]} ${progressStyles} rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-gray-600 text-right">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

// Typewriter Effect
export interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
  className = ''
}) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showCursor, setShowCursor] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete?.();
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, delay, onComplete]);

  React.useEffect(() => {
    if (cursor) {
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      return () => clearInterval(cursorTimer);
    }
  }, [cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span className={`inline-block w-0.5 h-5 bg-current ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
      )}
    </span>
  );
};

// Stagger Animation Container
export interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  stagger = 0.1,
  className = ''
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * stagger}s` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default {
  Skeleton,
  Spinner,
  LoadingOverlay,
  ProgressBar,
  Typewriter,
  StaggerContainer
};
