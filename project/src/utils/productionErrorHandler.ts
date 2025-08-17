/**
 * Production-ready error handling system
 * Replaces console statements with proper error tracking
 */

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isProduction = import.meta.env['NODE_ENV'] === 'production';

  static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'high'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        severity: 'high'
      });
    });
  }

  captureError(error: ErrorReport) {
    if (!this.isProduction) {
      // In development, still log to console
      console.error('Error captured:', error);
      return;
    }

    this.errorQueue.push(error);
    
    // Send to analytics if available
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: error.severity === 'critical'
      });
    }

    // Batch send errors to prevent overwhelming the server
    if (this.errorQueue.length >= 10) {
      this.flushErrors();
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to your error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      });
    } catch (err) {
      // If error reporting fails, store locally
      localStorage.setItem('pending_errors', JSON.stringify(errors));
    }
  }

  // Replace console.log calls with this in production
  log(message: string, data?: any) {
    if (!this.isProduction) {
      console.log(message, data);
    }
    // In production, optionally send to analytics
  }

  // Replace console.warn calls with this
  warn(message: string, data?: any) {
    if (!this.isProduction) {
      console.warn(message, data);
    }
    
    this.captureError({
      message: `Warning: ${message}`,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'medium'
    });
  }

  // Replace console.error calls with this
  error(message: string, error?: Error) {
    if (!this.isProduction) {
      console.error(message, error);
    }

    this.captureError({
      message,
      stack: error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'high'
    });
  }
}

export const errorHandler = ProductionErrorHandler.getInstance();
export default errorHandler;
