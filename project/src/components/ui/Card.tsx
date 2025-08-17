/**
 * Production-Grade Card Component
 * Sophisticated card system with variants, animations, and accessibility
 */

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'outline' | 'ghost' | 'elevated' | 'glass' | 'premium';
  /** Card size/padding */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Interactive hover effects */
  interactive?: boolean;
  /** Rounded corners */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Shadow intensity */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  /** Border style */
  border?: boolean;
  /** Gradient background */
  gradient?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Glow effect */
  glow?: boolean;
  /** Blur backdrop */
  blur?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  className = '',
  variant = 'default',
  size = 'md',
  interactive = false,
  rounded = 'lg',
  shadow = 'md',
  border = false,
  gradient = false,
  loading = false,
  glow = false,
  blur = false,
  children,
  ...props
}, ref) => {
  // Base styles
  const baseStyles = [
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
    loading ? 'pointer-events-none' : '',
    blur ? 'backdrop-blur-md' : ''
  ].filter(Boolean).join(' ');

  // Variant styles
  const variantStyles = {
    default: gradient 
      ? 'bg-gradient-to-br from-white to-gray-50 border border-gray-200' 
      : 'bg-white border border-gray-200',
    outline: 'bg-transparent border-2 border-gray-200 hover:border-gray-300',
    ghost: 'bg-gray-50/50 hover:bg-gray-100/50',
    elevated: gradient
      ? 'bg-gradient-to-br from-white to-gray-50'
      : 'bg-white',
    glass: 'bg-white/80 backdrop-blur-lg border border-white/20',
    premium: 'bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-purple-200/50'
  };

  // Size styles (padding)
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Interactive styles
  const interactiveStyles = interactive ? [
    'cursor-pointer',
    'hover:scale-[1.02] hover:-translate-y-1',
    'active:scale-[0.98] active:translate-y-0',
    variant === 'default' ? 'hover:shadow-lg' : '',
    variant === 'glass' ? 'hover:bg-white/90' : '',
    variant === 'ghost' ? 'hover:bg-gray-100/70' : '',
    variant === 'elevated' ? 'hover:shadow-2xl' : '',
    variant === 'premium' ? 'hover:shadow-purple-200/50 hover:shadow-xl' : ''
  ].filter(Boolean).join(' ') : '';

  // Rounded styles
  const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  };

  // Shadow styles
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md hover:shadow-lg',
    lg: 'shadow-lg hover:shadow-xl',
    xl: 'shadow-xl hover:shadow-2xl',
    glow: glow ? 'shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30' : 'shadow-lg hover:shadow-xl'
  };

  // Border styles
  const borderStyles = (border || variant === 'outline') && variant !== 'default' ? 'border border-gray-200' : '';

  const cardClasses = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    interactiveStyles,
    roundedStyles[rounded],
    shadowStyles[shadow],
    borderStyles,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <Loader2 className="animate-spin w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  className = '',
  title,
  subtitle,
  action,
  children,
  ...props
}, ref) => {
  const headerClasses = `flex items-start justify-between mb-4 ${className}`.trim();

  return (
    <div
      ref={ref}
      className={headerClasses}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
        {children}
      </div>
      {action && (
        <div className="ml-4 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// Card Body Component
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(({
  className = '',
  children,
  ...props
}, ref) => {
  const bodyClasses = `flex-1 ${className}`.trim();

  return (
    <div
      ref={ref}
      className={bodyClasses}
      {...props}
    >
      {children}
    </div>
  );
});

CardBody.displayName = 'CardBody';

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  className = '',
  justify = 'end',
  children,
  ...props
}, ref) => {
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  const footerClasses = [
    'flex items-center gap-3 mt-6 pt-4 border-t border-gray-200',
    justifyStyles[justify],
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={footerClasses}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export default Card;
