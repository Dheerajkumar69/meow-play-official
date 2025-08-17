/**
 * Premium Button Component - Top 1% Standards
 * Sophisticated button with advanced micro-interactions and states
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { advancedTokens } from '../../theme/advanced-tokens';

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'premium' | 'gradient' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  successText?: string;
  glow?: boolean;
  magnetic?: boolean;
  ripple?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      success = false,
      leftIcon,
      rightIcon,
      loadingText,
      successText,
      disabled,
      glow = false,
      magnetic = false,
      ripple = true,
      elevation = 2,
      children,
      onClick,
      onMouseMove,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isPressed, setIsPressed] = useState(false);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleId = useRef(0);

    const isDisabled = disabled || loading;

    // Magnetic effect
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (magnetic && !isDisabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.15;
        const deltaY = (e.clientY - centerY) * 0.15;
        setMagneticOffset({ x: deltaX, y: deltaY });
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = () => {
      if (magnetic) {
        setMagneticOffset({ x: 0, y: 0 });
      }
    };

    // Ripple effect
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !isDisabled) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { id: rippleId.current++, x, y };
        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
      }
      onClick?.(e);
    };

    // Base styles with advanced design tokens
    const baseStyles = [
      'relative inline-flex items-center justify-center gap-2',
      'font-medium leading-none border border-transparent',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'overflow-hidden',
      '[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
      fullWidth ? 'w-full' : 'w-auto'
    ].join(' ');

    // Size variants with perfect proportions
    const sizeStyles = {
      xs: 'h-7 px-2.5 text-xs rounded-md gap-1.5 [&>svg]:size-3',
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5 [&>svg]:size-3.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2 [&>svg]:size-4',
      lg: 'h-11 px-6 text-base rounded-lg gap-2 [&>svg]:size-4',
      xl: 'h-12 px-8 text-lg rounded-xl gap-2.5 [&>svg]:size-5',
      icon: 'h-10 w-10 rounded-lg [&>svg]:size-4'
    };

    // Advanced variant styles
    const variantStyles = {
      primary: isDark
        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus-visible:ring-blue-500'
        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus-visible:ring-blue-500',
      
      secondary: isDark
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40 focus-visible:ring-gray-500'
        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40 focus-visible:ring-gray-500',
      
      outline: isDark
        ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800 text-gray-300 hover:text-gray-100 focus-visible:ring-gray-500'
        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus-visible:ring-gray-500',
      
      ghost: isDark
        ? 'hover:bg-gray-800 text-gray-300 hover:text-gray-100 focus-visible:ring-gray-500'
        : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:ring-gray-500',
      
      destructive: isDark
        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus-visible:ring-red-500'
        : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus-visible:ring-red-500',
      
      success: isDark
        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 focus-visible:ring-green-500'
        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 focus-visible:ring-green-500',
      
      premium: 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 focus-visible:ring-purple-500 bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500',
      
      gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-purple-500/40 focus-visible:ring-blue-500',
      
      glass: isDark
        ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/20 text-white shadow-lg shadow-black/25 hover:shadow-black/40 focus-visible:ring-white/50'
        : 'bg-black/10 hover:bg-black/20 backdrop-blur-md border-black/20 text-black shadow-lg shadow-black/25 hover:shadow-black/40 focus-visible:ring-black/50'
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

    // Glow effect
    const glowStyles = glow ? 'animate-pulse shadow-2xl' : '';

    // Press animation
    const pressStyles = isPressed ? 'scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]';

    // Combine all styles
    const combinedStyles = [
      baseStyles,
      sizeStyles[size],
      variantStyles[variant],
      elevationStyles[elevation],
      glowStyles,
      pressStyles,
      className
    ].join(' ');

    // Content with state management
    const getContent = () => {
      if (success) {
        return (
          <>
            <Check className="animate-in zoom-in-75 duration-200" />
            {successText || 'Success!'}
          </>
        );
      }

      if (loading) {
        return (
          <>
            <Loader2 className="animate-spin" />
            {loadingText || children}
          </>
        );
      }

      return (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      );
    };

    return (
      <button
        ref={buttonRef}
        className={combinedStyles}
        disabled={isDisabled}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`,
        }}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            <span
              className="absolute bg-white/30 rounded-full animate-ping"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
                animationDuration: '600ms',
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </span>
        ))}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {getContent()}
        </span>

        {/* Premium sparkle effect */}
        {variant === 'premium' && !loading && !success && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <Sparkles className="absolute top-1 right-1 w-3 h-3 text-white/60 animate-pulse" />
            <Sparkles className="absolute bottom-1 left-1 w-2 h-2 text-white/40 animate-pulse delay-150" />
          </div>
        )}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;
