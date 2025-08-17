/**
 * Production-Grade Input Component
 * Advanced input system with variants, validation, and accessibility
 */

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant for different states */
  variant?: 'default' | 'success' | 'error' | 'warning';
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Helper text */
  helperText?: string;
  /** Icon component */
  icon?: React.ComponentType<any>;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Rounded style */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Floating label */
  floatingLabel?: boolean;
  /** Glow effect */
  glow?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  variant = 'default',
  size = 'md',
  type = 'text',
  label,
  error,
  success,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  rounded = 'lg',
  floatingLabel = false,
  glow = false,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  // Determine actual variant based on error/success states
  const actualVariant = error ? 'error' : success ? 'success' : variant;

  // Base styles
  const baseStyles = [
    'relative w-full border transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
    'placeholder:text-gray-400'
  ].join(' ');

  // Variant styles
  const variantStyles = {
    default: [
      'bg-white border-gray-200 text-gray-900',
      'focus:border-purple-500 focus:ring-purple-500/20',
      'hover:border-gray-300'
    ].join(' '),
    success: [
      'bg-white border-emerald-200 text-gray-900',
      'focus:border-emerald-500 focus:ring-emerald-500/20',
      'hover:border-emerald-300'
    ].join(' '),
    error: [
      'bg-white border-red-200 text-gray-900',
      'focus:border-red-500 focus:ring-red-500/20',
      'hover:border-red-300'
    ].join(' '),
    warning: [
      'bg-white border-yellow-200 text-gray-900',
      'focus:border-yellow-500 focus:ring-yellow-500/20',
      'hover:border-yellow-300'
    ].join(' ')
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-sm px-3 py-2 h-9',
    md: 'text-sm px-4 py-2.5 h-10',
    lg: 'text-base px-4 py-3 h-12'
  };

  // Rounded styles
  const roundedStyles = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  };

  // Icon spacing
  const getIconSpacing = () => {
    if (!Icon) return '';
    const spacing = size === 'lg' ? 'pl-12' : 'pl-10';
    return iconPosition === 'left' ? spacing : iconPosition === 'right' ? spacing.replace('pl-', 'pr-') : '';
  };

  // Glow effect
  const glowStyles = glow ? {
    default: 'shadow-lg shadow-purple-500/25 focus:shadow-xl focus:shadow-purple-500/30',
    success: 'shadow-lg shadow-emerald-500/25 focus:shadow-xl focus:shadow-emerald-500/30',
    error: 'shadow-lg shadow-red-500/25 focus:shadow-xl focus:shadow-red-500/30',
    warning: 'shadow-lg shadow-yellow-500/25 focus:shadow-xl focus:shadow-yellow-500/30'
  }[actualVariant] : '';

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const inputClasses = [
    baseStyles,
    variantStyles[actualVariant],
    sizeStyles[size],
    roundedStyles[rounded],
    getIconSpacing(),
    type === 'password' ? 'pr-10' : '',
    glowStyles,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && !floatingLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {Icon && iconPosition === 'left' && (
          <div className={`absolute inset-y-0 left-0 flex items-center ${size === 'lg' ? 'pl-4' : 'pl-3'} pointer-events-none`}>
            <Icon className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${
              isFocused && actualVariant === 'default' ? 'text-purple-500' :
              actualVariant === 'success' ? 'text-emerald-500' :
              actualVariant === 'error' ? 'text-red-500' :
              actualVariant === 'warning' ? 'text-yellow-500' :
              'text-gray-400'
            }`} />
          </div>
        )}

        {/* Floating Label */}
        {floatingLabel && label && (
          <label className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue
              ? 'top-2 text-xs text-purple-600 transform -translate-y-1'
              : `top-1/2 transform -translate-y-1/2 text-gray-400 ${sizeStyles[size].includes('text-sm') ? 'text-sm' : 'text-base'}`
          }`}>
            {label}
          </label>
        )}

        {/* Input */}
        <input
          className={inputClasses}
          type={inputType}
          ref={ref}
          disabled={disabled || loading}
          placeholder={floatingLabel ? '' : props.placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(e.target.value.length > 0);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            props.onChange?.(e);
          }}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Right Icon (not for password) */}
        {Icon && iconPosition === 'right' && type !== 'password' && (
          <div className={`absolute inset-y-0 right-0 flex items-center ${size === 'lg' ? 'pr-4' : 'pr-3'} pointer-events-none`}>
            <Icon className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${
              isFocused && actualVariant === 'default' ? 'text-purple-500' :
              actualVariant === 'success' ? 'text-emerald-500' :
              actualVariant === 'error' ? 'text-red-500' :
              actualVariant === 'warning' ? 'text-yellow-500' :
              'text-gray-400'
            }`} />
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
          </div>
        )}

        {/* Validation Icons */}
        {!loading && !Icon && (
          <>
            {actualVariant === 'success' && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
            )}
            {actualVariant === 'error' && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Helper Text */}
      {(error || success || helperText) && (
        <div className="mt-2 flex items-start gap-1">
          {error && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </>
          )}
          {!error && success && (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-600">{success}</p>
            </>
          )}
          {!error && !success && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
