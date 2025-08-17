/**
 * Accessibility Provider & Utilities
 * WCAG 2.1 AA compliant accessibility system
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AccessibilityState {
  /** High contrast mode */
  highContrast: boolean;
  /** Reduced motion preference */
  reducedMotion: boolean;
  /** Font size multiplier */
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  /** Screen reader announcements */
  announcements: string[];
  /** Focus management */
  focusVisible: boolean;
  /** Keyboard navigation mode */
  keyboardNavigation: boolean;
}

export interface AccessibilityActions {
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSize: (size: AccessibilityState['fontSize']) => void;
  announce: (message: string) => void;
  clearAnnouncements: () => void;
  setFocusVisible: (visible: boolean) => void;
  setKeyboardNavigation: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityState & AccessibilityActions | null>(null);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccessibilityState>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'md',
    announcements: [],
    focusVisible: false,
    keyboardNavigation: false
  });

  // Detect system preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    };

    const updatePreferences = () => {
      setState(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    updatePreferences();

    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, keyboardNavigation: true, focusVisible: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, keyboardNavigation: false, focusVisible: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (state.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (state.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl');
    root.classList.add(`font-${state.fontSize}`);

    // Focus visible
    if (state.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }, [state.highContrast, state.reducedMotion, state.fontSize, state.focusVisible]);

  const actions: AccessibilityActions = {
    setHighContrast: (enabled) => setState(prev => ({ ...prev, highContrast: enabled })),
    setReducedMotion: (enabled) => setState(prev => ({ ...prev, reducedMotion: enabled })),
    setFontSize: (size) => setState(prev => ({ ...prev, fontSize: size })),
    announce: (message) => setState(prev => ({ 
      ...prev, 
      announcements: [...prev.announcements, message]
    })),
    clearAnnouncements: () => setState(prev => ({ ...prev, announcements: [] })),
    setFocusVisible: (visible) => setState(prev => ({ ...prev, focusVisible: visible })),
    setKeyboardNavigation: (enabled) => setState(prev => ({ ...prev, keyboardNavigation: enabled }))
  };

  return (
    <AccessibilityContext.Provider value={{ ...state, ...actions }}>
      {children}
      <ScreenReaderAnnouncements announcements={state.announcements} />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Screen Reader Announcements Component
const ScreenReaderAnnouncements: React.FC<{ announcements: string[] }> = ({ announcements }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  );
};

// Accessibility Control Panel Component
export const AccessibilityControls: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    highContrast,
    reducedMotion,
    fontSize,
    setHighContrast,
    setReducedMotion,
    setFontSize
  } = useAccessibility();

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg border ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Accessibility Settings</h3>
      
      <div className="space-y-4">
        {/* High Contrast */}
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>High Contrast Mode</span>
        </label>

        {/* Reduced Motion */}
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span>Reduce Motion</span>
        </label>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value as AccessibilityState['fontSize'])}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ 
  href, 
  children 
}) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
};

// Focus Trap Component
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active: boolean;
  className?: string;
}> = ({ children, active, className = '' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// ARIA Live Region Hook
export const useAriaLive = () => {
  const { announce } = useAccessibility();
  
  const announceToScreenReader = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announce(message);
    
    // Clear after a delay to prevent accumulation
    setTimeout(() => {
      // This would need to be implemented in the context
    }, 1000);
  }, [announce]);

  return { announceToScreenReader };
};

// Keyboard Navigation Hook
export const useKeyboardNavigation = (onEscape?: () => void, onEnter?: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter]);
};

export default {
  AccessibilityProvider,
  useAccessibility,
  AccessibilityControls,
  SkipLink,
  FocusTrap,
  useAriaLive,
  useKeyboardNavigation
};
