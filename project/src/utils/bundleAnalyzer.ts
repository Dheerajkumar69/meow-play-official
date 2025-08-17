/**
 * Bundle size analysis utility for performance optimization
 */
export class BundleAnalyzer {
  private static performanceEntries: PerformanceEntry[] = [];
  private static resourceTimings: PerformanceResourceTiming[] = [];

  /**
   * Initialize bundle analysis
   */
  static init(): void {
    this.collectResourceTimings();
    this.analyzeChunkSizes();
    this.identifyLargeAssets();
  }

  /**
   * Collect resource timing data
   */
  private static collectResourceTimings(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.resourceTimings = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
  }

  /**
   * Analyze JavaScript chunk sizes
   */
  private static analyzeChunkSizes(): void {
    const jsResources = this.resourceTimings.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );

    const chunkSizes = jsResources.map(resource => ({
      name: this.extractChunkName(resource.name),
      size: resource.transferSize || 0,
      loadTime: resource.responseEnd - resource.requestStart,
      url: resource.name
    }));

    // Log large chunks (>100KB)
    const largeChunks = chunkSizes.filter(chunk => chunk.size > 100000);
    if (largeChunks.length > 0) {
      console.warn('Large JavaScript chunks detected:', largeChunks);
    }

    // Log slow loading chunks (>1s)
    const slowChunks = chunkSizes.filter(chunk => chunk.loadTime > 1000);
    if (slowChunks.length > 0) {
      console.warn('Slow loading chunks detected:', slowChunks);
    }
  }

  /**
   * Identify large assets that could be optimized
   */
  private static identifyLargeAssets(): void {
    const imageResources = this.resourceTimings.filter(resource => 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.name)
    );

    const largeImages = imageResources
      .filter(resource => (resource.transferSize || 0) > 500000) // >500KB
      .map(resource => ({
        name: resource.name.split('/').pop() || 'unknown',
        size: resource.transferSize || 0,
        url: resource.name
      }));

    if (largeImages.length > 0) {
      console.warn('Large images detected (consider optimization):', largeImages);
    }
  }

  /**
   * Extract chunk name from URL
   */
  private static extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0] || 'unknown';
  }

  /**
   * Get bundle analysis report
   */
  static getReport(): {
    totalJSSize: number;
    totalImageSize: number;
    chunkCount: number;
    recommendations: string[];
  } {
    const jsResources = this.resourceTimings.filter(resource => resource.name.includes('.js'));
    const imageResources = this.resourceTimings.filter(resource => 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(resource.name)
    );

    const totalJSSize = jsResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
    const totalImageSize = imageResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);

    const recommendations: string[] = [];

    if (totalJSSize > 1000000) { // >1MB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }

    if (totalImageSize > 2000000) { // >2MB
      recommendations.push('Optimize images with compression and modern formats (WebP/AVIF)');
    }

    if (jsResources.length > 10) {
      recommendations.push('Consider bundling smaller chunks together');
    }

    return {
      totalJSSize,
      totalImageSize,
      chunkCount: jsResources.length,
      recommendations
    };
  }

  /**
   * Monitor bundle performance over time
   */
  static startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor new resources as they load
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];
      this.resourceTimings.push(...entries);
      
      // Check for performance issues
      entries.forEach(entry => {
        if (entry.transferSize && entry.transferSize > 1000000) { // >1MB
          console.warn(`Large resource loaded: ${entry.name} (${Math.round(entry.transferSize / 1024)}KB)`);
        }
        
        if (entry.responseEnd - entry.requestStart > 3000) { // >3s
          console.warn(`Slow resource: ${entry.name} (${Math.round(entry.responseEnd - entry.requestStart)}ms)`);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Get performance metrics for specific resource types
   */
  static getResourceMetrics(type: 'js' | 'css' | 'image' | 'font'): {
    count: number;
    totalSize: number;
    averageLoadTime: number;
    largest: { name: string; size: number } | null;
  } {
    let filter: (resource: PerformanceResourceTiming) => boolean;

    switch (type) {
      case 'js':
        filter = (r) => r.name.includes('.js');
        break;
      case 'css':
        filter = (r) => r.name.includes('.css');
        break;
      case 'image':
        filter = (r) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(r.name);
        break;
      case 'font':
        filter = (r) => /\.(woff|woff2|ttf|otf|eot)$/i.test(r.name);
        break;
      default:
        filter = () => true;
    }

    const resources = this.resourceTimings.filter(filter);
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalLoadTime = resources.reduce((sum, r) => sum + (r.responseEnd - r.requestStart), 0);
    
    const largest = resources.reduce((max, r) => {
      const size = r.transferSize || 0;
      if (!max || size > max.size) {
        return { name: r.name.split('/').pop() || 'unknown', size };
      }
      return max;
    }, null as { name: string; size: number } | null);

    return {
      count: resources.length,
      totalSize,
      averageLoadTime: resources.length > 0 ? totalLoadTime / resources.length : 0,
      largest
    };
  }
}
