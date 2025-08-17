/**
 * Advanced Card Component - Top 1% Standards
 * Sophisticated card with premium interactions and visual effects
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { advancedTokens } from '../../theme/advanced-tokens';

export interface AdvancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  hoverable?: boolean;
  pressable?: boolean;
  magnetic?: boolean;
  glow?: boolean;
  tilt?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  overflow?: 'visible' | 'hidden';
  backdrop?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const AdvancedCard = forwardRef<HTMLDivElement, AdvancedCardProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      interactive = false,
      hoverable = true,
      pressable = false,
      magnetic = false,
      glow = false,
      tilt = false,
      elevation = 1,
      borderRadius = 'lg',
      overflow = 'hidden',
      backdrop = false,
      children,
      onMouseMove,
      onMouseLeave,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
    const [tiltOffset, setTiltOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Magnetic effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (magnetic || tilt) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        if (magnetic) {
          const deltaX = (e.clientX - centerX) * 0.1;
          const deltaY = (e.clientY - centerY) * 0.1;
          setMagneticOffset({ x: deltaX, y: deltaY });
        }

        if (tilt) {
          const deltaX = (e.clientX - centerX) / rect.width * 20;
          const deltaY = (e.clientY - centerY) / rect.height * 20;
          setTiltOffset({ x: deltaY, y: -deltaX });
        }
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      if (magnetic) {
        setMagneticOffset({ x: 0, y: 0 });
      }
      if (tilt) {
        setTiltOffset({ x: 0, y: 0 });
      }
      onMouseLeave?.(e);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (pressable) {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
      }
      onClick?.(e);
    };

    // Base styles
    const baseStyles = [
      'relative transition-all duration-300 ease-out',
      overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible',
      interactive || hoverable || pressable ? 'cursor-pointer' : '',
      backdrop ? 'backdrop-blur-sm' : ''
    ].join(' ');

    // Size styles
    const sizeStyles = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    };

    // Border radius styles
    const radiusStyles = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl'
    };

    // Variant styles
    const variantStyles = {
      default: isDark
        ? 'bg-gray-800 border border-gray-700'
        : 'bg-white border border-gray-200',
      
      elevated: isDark
        ? 'bg-gray-800 border border-gray-700/50'
        : 'bg-white border border-gray-100',
      
      outlined: isDark
        ? 'bg-transparent border-2 border-gray-600'
        : 'bg-transparent border-2 border-gray-300',
      
      glass: isDark
        ? 'bg-white/5 backdrop-blur-xl border border-white/10'
        : 'bg-black/5 backdrop-blur-xl border border-black/10',
      
      gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700',
      
      premium: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800/50'
    };

    // Elevation styles
    const elevationStyles = {
      0: '',
      1: 'shadow-sm',
      2: 'shadow-md',
      3: 'shadow-lg',
      4: 'shadow-xl',
      5: 'shadow-2xl',
      6: 'shadow-2xl shadow-black/25'
    };

    // Hover effects
    const hoverStyles = hoverable ? [
      'hover:shadow-xl',
      variant === 'elevated' ? 'hover:shadow-2xl' : '',
      variant === 'glass' ? 'hover:bg-white/10 dark:hover:bg-white/10' : '',
      variant === 'premium' ? 'hover:shadow-purple-500/25' : '',
      'hover:-translate-y-1'
    ].join(' ') : '';

    // Press effects
    const pressStyles = pressable && isPressed ? 'scale-[0.98]' : '';

    // Glow effect
    const glowStyles = glow ? [
      'shadow-2xl',
      variant === 'premium' ? 'shadow-purple-500/50' : 'shadow-blue-500/50',
      'animate-pulse'
    ].join(' ') : '';

    // Combine all styles
    const combinedStyles = [
      baseStyles,
      sizeStyles[size],
      radiusStyles[borderRadius],
      variantStyles[variant],
      elevationStyles[elevation],
      hoverStyles,
      pressStyles,
      glowStyles,
      className
    ].join(' ');

    const transformStyle = {
      transform: [
        magnetic ? `translate(${magneticOffset.x}px, ${magneticOffset.y}px)` : '',
        tilt ? `perspective(1000px) rotateX(${tiltOffset.x}deg) rotateY(${tiltOffset.y}deg)` : '',
        pressable && isPressed ? 'scale(0.98)' : ''
      ].filter(Boolean).join(' ') || undefined
    };

    return (
      <div
        ref={ref}
        className={combinedStyles}
        style={transformStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      >
        {/* Premium shine effect */}
        {variant === 'premium' && isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        )}

        {/* Glass reflection */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
        )}

        {children}
      </div>
    );
  }
);

// Card sub-components
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', size = 'md', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'pb-2',
      md: 'pb-4',
      lg: 'pb-6'
    };

    return (
      <div
        ref={ref}
        className={`${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', size = 'md', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'py-2',
      md: 'py-2',
      lg: 'py-4'
    };

    return (
      <div
        ref={ref}
        className={`${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', size = 'md', children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'pt-2',
      md: 'pt-4',
      lg: 'pt-6'
    };

    return (
      <div
        ref={ref}
        className={`${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AdvancedCard.displayName = 'AdvancedCard';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export default AdvancedCard;
