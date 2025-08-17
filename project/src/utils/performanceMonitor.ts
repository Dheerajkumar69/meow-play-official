/**
 * Performance monitoring utility for tracking app performance
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  static init(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor navigation timing
    this.observeNavigation();
  }

  /**
   * Start timing an operation
   */
  static startTiming(label: string): void {
    this.metrics.set(`${label}_start`, performance.now());
  }

  /**
   * End timing an operation and log the duration
   */
  static endTiming(label: string): number {
    const startTime = this.metrics.get(`${label}_start`);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.metrics.set(label, duration);
    
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Mark a custom performance metric
   */
  static mark(name: string): void {
    performance.mark(name);
  }

  /**
   * Measure between two marks
   */
  static measure(name: string, startMark: string, endMark?: string): void {
    try {
      performance.measure(name, startMark, endMark);
    } catch (error) {
      console.warn('Performance measure failed:', error);
    }
  }

  /**
   * Get all performance metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Monitor Core Web Vitals
   */
  private static observeWebVitals(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.set('LCP', lastEntry.startTime);
        console.log(`🎯 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.set('FID', fid);
          console.log(`⚡ FID: ${fid.toFixed(2)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.set('CLS', clsValue);
        console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private static observeResources(): void {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceResourceTiming) => {
          const duration = entry.responseEnd - entry.startTime;
          
          if (entry.name.includes('.js')) {
            this.metrics.set('JS_Load_Time', duration);
          } else if (entry.name.includes('.css')) {
            this.metrics.set('CSS_Load_Time', duration);
          } else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
            this.metrics.set('Image_Load_Time', duration);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }

  /**
   * Monitor navigation timing
   */
  private static observeNavigation(): void {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceNavigationTiming) => {
          this.metrics.set('DOM_Content_Loaded', entry.domContentLoadedEventEnd - entry.navigationStart);
          this.metrics.set('Page_Load_Complete', entry.loadEventEnd - entry.navigationStart);
          this.metrics.set('DNS_Lookup', entry.domainLookupEnd - entry.domainLookupStart);
          this.metrics.set('TCP_Connection', entry.connectEnd - entry.connectStart);
          this.metrics.set('Server_Response', entry.responseEnd - entry.requestStart);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation monitoring not supported:', error);
    }
  }

  /**
   * Log performance summary
   */
  static logSummary(): void {
    console.group('🚀 Performance Summary');
    
    const metrics = this.getMetrics();
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    
    // Performance recommendations
    const lcp = metrics.LCP;
    const fid = metrics.FID;
    const cls = metrics.CLS;
    
    console.group('📊 Core Web Vitals Assessment');
    if (lcp) {
      console.log(`LCP: ${lcp.toFixed(2)}ms ${lcp < 2500 ? '✅ Good' : lcp < 4000 ? '⚠️ Needs Improvement' : '❌ Poor'}`);
    }
    if (fid) {
      console.log(`FID: ${fid.toFixed(2)}ms ${fid < 100 ? '✅ Good' : fid < 300 ? '⚠️ Needs Improvement' : '❌ Poor'}`);
    }
    if (cls) {
      console.log(`CLS: ${cls.toFixed(4)} ${cls < 0.1 ? '✅ Good' : cls < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor'}`);
    }
    console.groupEnd();
    
    console.groupEnd();
  }

  /**
   * Clean up observers
   */
  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }

  /**
   * Monitor component render performance
   */
  static monitorComponent(componentName: string) {
    return {
      start: () => this.startTiming(`${componentName}_render`),
      end: () => this.endTiming(`${componentName}_render`)
    };
  }

  /**
   * Monitor API call performance
   */
  static monitorAPI(endpoint: string) {
    return {
      start: () => this.startTiming(`API_${endpoint}`),
      end: () => this.endTiming(`API_${endpoint}`)
    };
  }
}
