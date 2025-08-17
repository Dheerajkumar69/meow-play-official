/**
 * Premium Input Component - Top 1% Standards
 * Sophisticated input with advanced states and micro-interactions
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Search, X } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';

export interface PremiumInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost' | 'glass';
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  loading?: boolean;
  showPasswordToggle?: boolean;
  floating?: boolean;
  animated?: boolean;
  glow?: boolean;
  prefix?: string;
  suffix?: string;
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  (
    {
      className = '',
      label,
      description,
      error,
      success,
      hint,
      size = 'md',
      variant = 'default',
      icon: Icon,
      iconPosition = 'left',
      clearable = false,
      loading = false,
      showPasswordToggle = false,
      floating = false,
      animated = true,
      glow = false,
      prefix,
      suffix,
      type = 'text',
      value,
      onChange,
      onFocus,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) => {
    const { isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value));
    const inputRef = useRef<HTMLInputElement>(null);

    // Update hasValue when value changes
    useEffect(() => {
      setHasValue(Boolean(value));
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      onChange?.(e);
    };

    const handleClear = () => {
      if (inputRef.current) {
        const event = new Event('input', { bubbles: true });
        inputRef.current.value = '';
        inputRef.current.dispatchEvent(event);
        setHasValue(false);
        inputRef.current.focus();
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Determine input type
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Size styles
    const sizeStyles = {
      sm: {
        input: 'h-8 px-3 text-sm',
        icon: 'w-4 h-4',
        label: 'text-xs',
        description: 'text-xs'
      },
      md: {
        input: 'h-10 px-4 text-sm',
        icon: 'w-4 h-4',
        label: 'text-sm',
        description: 'text-sm'
      },
      lg: {
        input: 'h-12 px-4 text-base',
        icon: 'w-5 h-5',
        label: 'text-sm',
        description: 'text-sm'
      },
      xl: {
        input: 'h-14 px-6 text-lg',
        icon: 'w-6 h-6',
        label: 'text-base',
        description: 'text-base'
      }
    };

    // Variant styles
    const variantStyles = {
      default: isDark
        ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20',
      
      filled: isDark
        ? 'bg-gray-700 border-transparent text-gray-100 placeholder-gray-400 focus:bg-gray-600 focus:ring-blue-500/20'
        : 'bg-gray-100 border-transparent text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:ring-blue-500/20',
      
      outlined: isDark
        ? 'bg-transparent border-2 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
        : 'bg-transparent border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500',
      
      ghost: isDark
        ? 'bg-transparent border-transparent text-gray-100 placeholder-gray-400 hover:bg-gray-800 focus:bg-gray-800 focus:ring-blue-500/20'
        : 'bg-transparent border-transparent text-gray-900 placeholder-gray-500 hover:bg-gray-50 focus:bg-gray-50 focus:ring-blue-500/20',
      
      glass: isDark
        ? 'bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-gray-300 focus:bg-white/10 focus:border-white/20'
        : 'bg-black/5 backdrop-blur-xl border border-black/10 text-black placeholder-gray-600 focus:bg-black/10 focus:border-black/20'
    };

    // State styles
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
      : '';

    // Base input styles
    const inputStyles = [
      'w-full border rounded-lg transition-all duration-200 ease-out',
      'focus:outline-none focus:ring-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      sizeStyles[size].input,
      variantStyles[variant],
      stateStyles,
      glow && isFocused ? 'shadow-lg shadow-blue-500/25' : '',
      animated ? 'transition-all duration-200' : '',
      Icon && iconPosition === 'left' ? 'pl-10' : '',
      Icon && iconPosition === 'right' ? 'pr-10' : '',
      clearable && hasValue ? 'pr-10' : '',
      type === 'password' && showPasswordToggle ? 'pr-10' : '',
      prefix ? 'pl-12' : '',
      suffix ? 'pr-12' : '',
      className
    ].join(' ');

    // Label styles for floating variant
    const labelStyles = floating ? [
      'absolute left-4 transition-all duration-200 pointer-events-none',
      isFocused || hasValue
        ? `top-2 ${sizeStyles[size].label} text-blue-500`
        : `top-1/2 -translate-y-1/2 ${sizeStyles[size].description} text-gray-500`,
      error ? 'text-red-500' : success ? 'text-green-500' : ''
    ].join(' ') : [
      'block font-medium mb-2',
      sizeStyles[size].label,
      isDark ? 'text-gray-200' : 'text-gray-700',
      error ? 'text-red-500' : success ? 'text-green-500' : ''
    ].join(' ');

    return (
      <div className="w-full">
        {/* Label */}
        {label && !floating && (
          <label className={labelStyles}>
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Floating Label */}
          {label && floating && (
            <label className={labelStyles}>
              {label}
            </label>
          )}

          {/* Prefix */}
          {prefix && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${sizeStyles[size].description} text-gray-500 pointer-events-none`}>
              {prefix}
            </div>
          )}

          {/* Left Icon */}
          {Icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className={sizeStyles[size].icon} />
            </div>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={inputStyles}
            {...props}
          />

          {/* Right Icon */}
          {Icon && iconPosition === 'right' && !clearable && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon className={sizeStyles[size].icon} />
            </div>
          )}

          {/* Clear Button */}
          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className={sizeStyles[size].icon} />
            </button>
          )}

          {/* Password Toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className={sizeStyles[size].icon} />
              ) : (
                <Eye className={sizeStyles[size].icon} />
              )}
            </button>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeStyles[size].icon}`} />
            </div>
          )}

          {/* Success Icon */}
          {success && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <Check className={sizeStyles[size].icon} />
            </div>
          )}

          {/* Error Icon */}
          {error && !loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className={sizeStyles[size].icon} />
            </div>
          )}

          {/* Suffix */}
          {suffix && (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${sizeStyles[size].description} text-gray-500 pointer-events-none`}>
              {suffix}
            </div>
          )}
        </div>

        {/* Description */}
        {description && !error && !success && (
          <p className={`mt-2 ${sizeStyles[size].description} text-gray-500`}>
            {description}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className={`mt-2 ${sizeStyles[size].description} text-red-500 flex items-center gap-1`}>
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className={`mt-2 ${sizeStyles[size].description} text-green-500 flex items-center gap-1`}>
            <Check className="w-4 h-4" />
            {success}
          </p>
        )}

        {/* Hint */}
        {hint && !error && !success && (
          <p className={`mt-1 ${sizeStyles[size].description} text-gray-400`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

export default PremiumInput;
