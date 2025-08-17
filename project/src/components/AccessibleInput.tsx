import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    success,
    hint,
    required = false,
    showPasswordToggle = false,
    type = 'text',
    className = '',
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const successId = `${inputId}-success`;
    
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type;

    const baseInputClasses = 'w-full px-4 py-3 text-base border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px]';
    
    const stateClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
      : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-900/20'
      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-gray-800 dark:border-gray-600';

    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`${baseInputClasses} ${stateClasses} ${showPasswordToggle ? 'pr-12' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[
              hint ? hintId : '',
              error ? errorId : '',
              success ? successId : ''
            ].filter(Boolean).join(' ') || undefined}
            aria-required={required}
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 min-h-[44px] min-w-[44px]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        
        {hint && (
          <p 
            id={hintId}
            className="text-sm text-gray-600 dark:text-gray-400"
            role="note"
          >
            {hint}
          </p>
        )}
        
        {error && (
          <div 
            id={errorId}
            className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div 
            id={successId}
            className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400"
            role="status"
            aria-live="polite"
          >
            <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
