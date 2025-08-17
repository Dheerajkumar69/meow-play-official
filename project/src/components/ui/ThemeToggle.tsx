/**
 * Theme Toggle Component
 * Interactive component for switching between light/dark themes
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import Button from './Button';

export interface ThemeToggleProps {
  /** Show system option */
  showSystem?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display as dropdown or toggle buttons */
  variant?: 'dropdown' | 'toggle' | 'icon';
  /** Custom className */
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showSystem = true,
  size = 'md',
  variant = 'icon',
  className = ''
}) => {
  const { mode, setMode, isDark, toggleTheme } = useTheme();

  interface ThemeOption {
    mode: ThemeMode;
    label: string;
    icon: React.ComponentType<any>;
  }

  const themeOptions: ThemeOption[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    ...(showSystem ? [{ mode: 'system' as ThemeMode, label: 'System', icon: Monitor }] : [])
  ];

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
        onClick={toggleTheme}
        className={`transition-all duration-300 ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-purple-600" />
        )}
      </Button>
    );
  }

  if (variant === 'toggle') {
    return (
      <div className={`flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
        {themeOptions.map(({ mode: themeMode, label, icon: Icon }) => (
          <button
            key={themeMode}
            onClick={() => setMode(themeMode)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${mode === themeMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            aria-label={`Switch to ${label.toLowerCase()} theme`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="group">
        <Button
          variant="ghost"
          size={size}
          className="flex items-center space-x-2"
        >
          {mode === 'light' && <Sun className="w-4 h-4" />}
          {mode === 'dark' && <Moon className="w-4 h-4" />}
          {mode === 'system' && <Monitor className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {themeOptions.find(opt => opt.mode === mode)?.label}
          </span>
        </Button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {themeOptions.map(({ mode: themeMode, label, icon: Icon }) => (
            <button
              key={themeMode}
              onClick={() => setMode(themeMode)}
              className={`
                w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors
                ${mode === themeMode
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {mode === themeMode && (
                <div className="ml-auto w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
