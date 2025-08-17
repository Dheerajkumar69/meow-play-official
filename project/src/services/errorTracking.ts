/**
 * Error tracking service with Sentry integration
 */
import { PerformanceMonitor } from '../utils/performanceMonitor';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: number;
  additionalData?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  context: ErrorContext;
  fingerprint?: string[];
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private isInitialized = false;
  private sessionId: string;
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  /**
   * Initialize error tracking
   */
  init(config: { dsn?: string; environment?: string; userId?: string }): void {
    if (this.isInitialized) return;

    this.userId = config.userId;
    this.isInitialized = true;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Set up unhandled promise rejection handler
    this.setupUnhandledRejectionHandler();

    // Set up React error boundary integration
    this.setupReactErrorBoundaryIntegration();

    console.log('Error tracking initialized', {
      environment: config.environment || 'development',
      sessionId: this.sessionId
    });
  }

  /**
   * Capture error manually
   */
  captureError(error: Error, context?: Partial<ErrorContext>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      level: 'error',
      context: this.buildContext(context),
      fingerprint: this.generateFingerprint(error)
    };

    this.sendErrorReport(errorReport);
  }

  /**
   * Capture exception with additional context
   */
  captureException(error: Error, level: 'error' | 'warning' = 'error', extra?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      level,
      context: this.buildContext({ additionalData: extra }),
      fingerprint: this.generateFingerprint(error)
    };

    this.sendErrorReport(errorReport);
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message,
      level,
      context: this.buildContext({ additionalData: extra })
    };

    this.sendErrorReport(errorReport);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>): void {
    // Store breadcrumbs for context in future error reports
    const breadcrumb = {
      message,
      category,
      level,
      data,
      timestamp: Date.now()
    };

    // Store in session storage for persistence across page reloads
    const breadcrumbs = this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);
    
    // Keep only last 50 breadcrumbs
    if (breadcrumbs.length > 50) {
      breadcrumbs.shift();
    }

    sessionStorage.setItem('error_breadcrumbs', JSON.stringify(breadcrumbs));
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string): void {
    this.userId = userId;
    sessionStorage.setItem('error_user_context', JSON.stringify({
      userId,
      email,
      username
    }));
  }

  /**
   * Set additional context
   */
  setContext(key: string, value: any): void {
    const contexts = this.getStoredContexts();
    contexts[key] = value;
    sessionStorage.setItem('error_contexts', JSON.stringify(contexts));
  }

  /**
   * Performance monitoring integration
   */
  capturePerformanceIssue(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      this.captureMessage(
        `Performance issue detected: ${metric}`,
        'warning',
        {
          metric,
          value,
          threshold,
          performanceEntry: PerformanceMonitor.getMetrics()
        }
      );
    }
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      const errorReport: ErrorReport = {
        message: event.message,
        stack: event.error?.stack,
        level: 'error',
        context: this.buildContext({
          url: event.filename,
          additionalData: {
            lineno: event.lineno,
            colno: event.colno
          }
        })
      };

      this.sendErrorReport(errorReport);
    });
  }

  private setupUnhandledRejectionHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      const errorReport: ErrorReport = {
        message: `Unhandled Promise Rejection: ${error.message}`,
        stack: error.stack,
        level: 'error',
        context: this.buildContext({
          additionalData: {
            type: 'unhandledrejection',
            reason: event.reason
          }
        })
      };

      this.sendErrorReport(errorReport);
    });
  }

  private setupReactErrorBoundaryIntegration(): void {
    // This will be called by React Error Boundaries
    (window as any).__MEOW_PLAY_ERROR_TRACKING__ = this;
  }

  private buildContext(context?: Partial<ErrorContext>): ErrorContext {
    const userContext = this.getUserContext();
    const storedContexts = this.getStoredContexts();
    const breadcrumbs = this.getBreadcrumbs();

    return {
      userId: this.userId || userContext?.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: Date.now(),
      ...storedContexts,
      ...context,
      additionalData: {
        ...context?.additionalData,
        breadcrumbs: breadcrumbs.slice(-10), // Last 10 breadcrumbs
        userContext,
        performance: PerformanceMonitor.getMetrics()
      }
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error): string[] {
    const stack = error.stack || '';
    const firstStackLine = stack.split('\n')[1] || '';
    return [error.message, firstStackLine];
  }

  private getBreadcrumbs(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('error_breadcrumbs') || '[]');
    } catch {
      return [];
    }
  }

  private getUserContext(): any {
    try {
      return JSON.parse(sessionStorage.getItem('error_user_context') || 'null');
    } catch {
      return null;
    }
  }

  private getStoredContexts(): Record<string, any> {
    try {
      return JSON.parse(sessionStorage.getItem('error_contexts') || '{}');
    } catch {
      return {};
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, this would send to Sentry or another error tracking service
      console.error('Error Report:', errorReport);

      // For now, store locally for debugging
      const reports = this.getStoredReports();
      reports.push(errorReport);
      
      // Keep only last 100 reports
      if (reports.length > 100) {
        reports.shift();
      }

      localStorage.setItem('error_reports', JSON.stringify(reports));

      // In production, send to external service:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });

    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  private getStoredReports(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('error_reports') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Get error statistics for monitoring dashboard
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    recentErrors: ErrorReport[];
    topErrors: Array<{ message: string; count: number }>;
  } {
    const reports = this.getStoredReports();
    const errorsByLevel: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};

    reports.forEach(report => {
      errorsByLevel[report.level] = (errorsByLevel[report.level] || 0) + 1;
      errorCounts[report.message] = (errorCounts[report.message] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return {
      totalErrors: reports.length,
      errorsByLevel,
      recentErrors: reports.slice(-10),
      topErrors
    };
  }
}
