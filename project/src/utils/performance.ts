import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Performance optimization utilities and React performance hooks
 */

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for performance optimization
 */
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Memoized callback factory for better performance
 */
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

/**
 * Memoized value factory with deep comparison
 */
export const useDeepMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
};

/**
 * Deep equality comparison for arrays and objects
 */
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  return false;
};

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScroll = <T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, scrollTop, containerHeight, itemHeight, overscan]);

  const onScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return { visibleItems, onScroll };
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [element, options]);

  return [ref, isIntersecting];
};

/**
 * Image loading optimization hook
 */
export const useImageLoader = (src: string, placeholder?: string) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { currentSrc, isLoading, hasError };
};

/**
 * Memory usage monitor hook
 */
export const useMemoryMonitor = (threshold: number = 50): {
  memoryUsage: number | null;
  isHighUsage: boolean;
  cleanup: () => void;
} => {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [isHighUsage, setIsHighUsage] = useState(false);

  const cleanup = useCallback(() => {
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, []);

  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
        
        setMemoryUsage(usedPercent);
        setIsHighUsage(usedPercent > threshold);

        // Auto cleanup if memory usage is high
        if (usedPercent > 80) {
          cleanup();
        }
      }
    };

    const interval = setInterval(checkMemoryUsage, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [threshold, cleanup]);

  return { memoryUsage, isHighUsage, cleanup };
};

/**
 * Performance timing hook
 */
export const usePerformanceTiming = (name: string) => {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    console.log(`Performance timing [${name}]: ${duration.toFixed(2)}ms`);
    
    // Send to analytics if available
    if ('gtag' in window) {
      (window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
      });
    }

    return duration;
  }, [name]);

  return { start, end };
};

/**
 * Bundle size analyzer (development only)
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const modules = new Map<string, number>();
  
  // Analyze webpack module sizes
  if ('webpackChunkName' in window) {
    const chunks = (window as any).__webpack_require__.cache || {};
    
    Object.entries(chunks).forEach(([id, module]: [string, any]) => {
      if (module?.exports) {
        const size = JSON.stringify(module.exports).length;
        modules.set(id, size);
      }
    });

    const sortedModules = Array.from(modules.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.group('🔍 Bundle Analysis - Top 10 Modules');
    sortedModules.forEach(([id, size]) => {
      console.log(`${id}: ${(size / 1024).toFixed(2)} KB`);
    });
    console.groupEnd();
  }
};

/**
 * Network performance monitor
 */
export const useNetworkPerformance = () => {
  const [connection, setConnection] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null>(null);

  useEffect(() => {
    const updateConnection = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        setConnection({
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
        });
      }
    };

    updateConnection();

    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      conn.addEventListener('change', updateConnection);
      
      return () => {
        conn.removeEventListener('change', updateConnection);
      };
    }
  }, []);

  return connection;
};

/**
 * Preload critical resources
 */
export const preloadResources = (resources: Array<{
  href: string;
  as: 'script' | 'style' | 'image' | 'audio' | 'video' | 'font';
  crossorigin?: 'anonymous' | 'use-credentials';
}>) => {
  resources.forEach(({ href, as, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    document.head.appendChild(link);
  });
};

/**
 * Web Worker utility for offloading heavy computations
 */
export const createWorker = (fn: Function): Worker => {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

/**
 * Service Worker registration for caching
 */
export const registerServiceWorker = async (swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath);
    console.log('Service Worker registered:', registration);
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available, prompt user to refresh
            if (confirm('New version available! Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Lazy component loading utility
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ComponentType = () => <div>Loading...</div>
) => {
  const LazyComponent = React.lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={<fallback />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

/**
 * Performance observer for Core Web Vitals
 */
export const observeWebVitals = (onVital: (metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}) => void) => {
  // Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    const value = lastEntry.startTime;
    
    onVital({
      name: 'LCP',
      value,
      rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      const value = entry.processingStart - entry.startTime;
      
      onVital({
        name: 'FID',
        value,
        rating: value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
      });
    });
  }).observe({ entryTypes: ['first-input'], buffered: true });

  // Cumulative Layout Shift
  let cumulativeScore = 0;
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        cumulativeScore += entry.value;
      }
    });

    onVital({
      name: 'CLS',
      value: cumulativeScore,
      rating: cumulativeScore <= 0.1 ? 'good' : cumulativeScore <= 0.25 ? 'needs-improvement' : 'poor'
    });
  }).observe({ entryTypes: ['layout-shift'], buffered: true });
};

/**
 * Critical resource hints injection
 */
export const injectResourceHints = () => {
  // DNS prefetch for external domains
  const dnsPrefetch = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });

  // Preconnect to critical origins
  const preconnect = [
    'https://api.spotify.com',
  ];

  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

export default {
  useDebounce,
  useThrottle,
  useStableCallback,
  useDeepMemo,
  useVirtualScroll,
  useIntersectionObserver,
  useImageLoader,
  useMemoryMonitor,
  usePerformanceTiming,
  useNetworkPerformance,
  analyzeBundleSize,
  preloadResources,
  createWorker,
  registerServiceWorker,
  createLazyComponent,
  observeWebVitals,
  injectResourceHints,
};
