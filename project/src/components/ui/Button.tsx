/**
 * Production-Grade Button Component
 * Sophisticated button system with variants, sizes, states, and accessibility
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      glow = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Base styles
    const baseStyles = [
      'relative inline-flex items-center justify-center gap-2',
      'font-medium leading-none border border-transparent',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'active:scale-[0.98]',
      '[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0'
    ].join(' ');

    // Variant styles
    const variantStyles = {
      primary: [
        'bg-gradient-to-r from-purple-600 to-purple-700',
        'text-white shadow-lg shadow-purple-500/25',
        'hover:from-purple-500 hover:to-purple-600',
        'hover:shadow-xl hover:shadow-purple-500/30',
        'hover:-translate-y-0.5',
        'focus-visible:ring-purple-500',
        'active:from-purple-700 active:to-purple-800'
      ].join(' '),
      secondary: [
        'bg-white border-gray-200 text-gray-900',
        'shadow-sm hover:bg-gray-50',
        'hover:border-gray-300 hover:shadow-md',
        'hover:-translate-y-0.5',
        'focus-visible:ring-gray-500'
      ].join(' '),
      outline: [
        'border-2 border-purple-200 text-purple-700',
        'bg-purple-50/50 hover:bg-purple-100',
        'hover:border-purple-300 hover:text-purple-800',
        'hover:-translate-y-0.5',
        'focus-visible:ring-purple-500'
      ].join(' '),
      ghost: [
        'text-gray-600 hover:text-gray-900',
        'hover:bg-gray-100',
        'focus-visible:ring-gray-500'
      ].join(' '),
      destructive: [
        'bg-gradient-to-r from-red-500 to-red-600',
        'text-white shadow-lg shadow-red-500/25',
        'hover:from-red-400 hover:to-red-500',
        'hover:shadow-xl hover:shadow-red-500/30',
        'hover:-translate-y-0.5',
        'focus-visible:ring-red-500'
      ].join(' '),
      success: [
        'bg-gradient-to-r from-emerald-500 to-emerald-600',
        'text-white shadow-lg shadow-emerald-500/25',
        'hover:from-emerald-400 hover:to-emerald-500',
        'hover:shadow-xl hover:shadow-emerald-500/30',
        'hover:-translate-y-0.5',
        'focus-visible:ring-emerald-500'
      ].join(' '),
      premium: [
        'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600',
        'text-white shadow-lg shadow-purple-500/25',
        'hover:shadow-xl hover:shadow-purple-500/30',
        'hover:-translate-y-0.5',
        'focus-visible:ring-purple-500',
        'relative overflow-hidden',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-white/20 before:to-transparent',
        'before:translate-x-[-100%] hover:before:translate-x-[100%]',
        'before:transition-transform before:duration-700'
      ].join(' ')
    };

    // Size styles
    const sizeStyles = {
      xs: 'h-7 px-2 text-xs rounded-md',
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-4 text-sm rounded-xl',
      lg: 'h-12 px-6 text-base rounded-xl',
      xl: 'h-14 px-8 text-lg rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl'
    };

    // Glow effect
    const glowStyles = glow ? {
      primary: 'shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]',
      secondary: 'hover:shadow-[0_0_20px_rgba(107,114,128,0.3)]',
      outline: 'hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]',
      ghost: 'hover:shadow-[0_0_20px_rgba(107,114,128,0.2)]',
      destructive: 'shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]',
      success: 'shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]',
      premium: 'shadow-[0_0_25px_rgba(147,51,234,0.5)] hover:shadow-[0_0_35px_rgba(147,51,234,0.6)]'
    }[variant] : '';

    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      glowStyles,
      fullWidth ? 'w-full' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        className={classes}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Specialized button components
export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> & {
    icon: React.ReactNode;
    'aria-label': string;
  }
>(({ icon, className = '', ...props }, ref) => (
  <Button
    ref={ref}
    size="icon"
    className={`shrink-0 ${className}`}
    {...props}
  >
    {icon}
  </Button>
));

IconButton.displayName = 'IconButton';

export const LinkButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    href?: string;
    external?: boolean;
  }
>(({ href, external, rightIcon, children, ...props }, ref) => (
  <Button
    ref={ref}
    rightIcon={rightIcon || <ChevronRight />}
    {...props}
  >
    {children}
  </Button>
));

LinkButton.displayName = 'LinkButton';

export const FloatingActionButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'variant' | 'size'> & {
    icon: React.ReactNode;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  }
>(({ icon, position = 'bottom-right', className = '', ...props }, ref) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <Button
      ref={ref}
      variant="primary"
      size="icon"
      className={`h-14 w-14 rounded-full shadow-2xl z-50 hover:scale-110 active:scale-95 ${positionClasses[position]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

export default Button;
