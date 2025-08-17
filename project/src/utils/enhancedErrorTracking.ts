/**
 * Enhanced Error Tracking System for MeowPlay
 */
import { analytics } from './analytics';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'promise_rejection' | 'network' | 'audio' | 'upload' | 'auth';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  context?: Record<string, any>;
  resolved: boolean;
}

export class EnhancedErrorTracker {
  private static instance: EnhancedErrorTracker;
  private errors: ErrorReport[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  static getInstance(): EnhancedErrorTracker {
    if (!EnhancedErrorTracker.instance) {
      EnhancedErrorTracker.instance = new EnhancedErrorTracker();
    }
    return EnhancedErrorTracker.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeGlobalErrorHandlers();
    this.loadStoredErrors();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: this.determineSeverity(event.message),
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        type: 'promise_rejection',
        severity: 'high',
        context: {
          reason: event.reason
        }
      });
    });

    // Network error handler
    this.interceptFetch();
    this.interceptXHR();
  }

  private interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.trackError({
            message: `Network request failed: ${response.status} ${response.statusText}`,
            type: 'network',
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              url: args[0],
              status: response.status,
              statusText: response.statusText
            }
          });
        }
        
        return response;
      } catch (error) {
        this.trackError({
          message: `Network request error: ${error.message}`,
          stack: error.stack,
          type: 'network',
          severity: 'high',
          context: {
            url: args[0],
            error: error.message
          }
        });
        throw error;
      }
    };
  }

  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('error', () => {
        EnhancedErrorTracker.getInstance().trackError({
          message: `XMLHttpRequest failed: ${this._method} ${this._url}`,
          type: 'network',
          severity: 'medium',
          context: {
            method: this._method,
            url: this._url,
            status: this.status
          }
        });
      });

      this.addEventListener('load', () => {
        if (this.status >= 400) {
          EnhancedErrorTracker.getInstance().trackError({
            message: `XMLHttpRequest error: ${this.status} ${this.statusText}`,
            type: 'network',
            severity: this.status >= 500 ? 'high' : 'medium',
            context: {
              method: this._method,
              url: this._url,
              status: this.status,
              statusText: this.statusText
            }
          });
        }
      });

      return originalSend.apply(this, args);
    };
  }

  private determineSeverity(message: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalKeywords = ['security', 'auth', 'payment', 'data loss'];
    const highKeywords = ['network', 'api', 'database', 'upload', 'audio'];
    const mediumKeywords = ['ui', 'component', 'render', 'style'];

    const lowerMessage = message.toLowerCase();

    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  trackError(errorData: Partial<ErrorReport>, userId?: string) {
    const error: ErrorReport = {
      id: this.generateErrorId(),
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      type: errorData.type || 'javascript',
      severity: errorData.severity || 'medium',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId,
      sessionId: this.sessionId,
      context: errorData.context,
      resolved: false
    };

    this.errors.push(error);
    this.persistError(error);
    this.sendToAnalytics(error);
    this.sendToServer(error);

    // Auto-resolve low severity errors after 24 hours
    if (error.severity === 'low') {
      setTimeout(() => {
        this.resolveError(error.id);
      }, 24 * 60 * 60 * 1000);
    }

    return error.id;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistError(error: ErrorReport) {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('meowplay_errors') || '[]');
      storedErrors.push(error);
      
      // Keep only last 100 errors
      if (storedErrors.length > 100) {
        storedErrors.splice(0, storedErrors.length - 100);
      }
      
      localStorage.setItem('meowplay_errors', JSON.stringify(storedErrors));
    } catch (e) {
      console.warn('Failed to persist error:', e);
    }
  }

  private loadStoredErrors() {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('meowplay_errors') || '[]');
      this.errors = storedErrors;
    } catch (e) {
      console.warn('Failed to load stored errors:', e);
    }
  }

  private sendToAnalytics(error: ErrorReport) {
    analytics.trackError(error.message, error.type, error.userId);
  }

  private async sendToServer(error: ErrorReport) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silently fail to avoid infinite error loops
      console.warn('Failed to send error to server:', e);
    }
  }

  resolveError(errorId: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      this.persistError(error);
    }
  }

  getErrors(filters?: {
    type?: string;
    severity?: string;
    resolved?: boolean;
    timeRange?: { start: Date; end: Date };
  }): ErrorReport[] {
    let filteredErrors = [...this.errors];

    if (filters) {
      if (filters.type) {
        filteredErrors = filteredErrors.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
      }
      if (filters.resolved !== undefined) {
        filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved);
      }
      if (filters.timeRange) {
        filteredErrors = filteredErrors.filter(e => {
          const errorTime = new Date(e.timestamp);
          return errorTime >= filters.timeRange!.start && errorTime <= filters.timeRange!.end;
        });
      }
    }

    return filteredErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    unresolved: number;
    last24Hours: number;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
      last24Hours: 0
    };

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // Count resolved/unresolved
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
      
      // Count last 24 hours
      if (new Date(error.timestamp) >= last24Hours) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  // Specialized error tracking methods
  trackAudioError(message: string, context?: any, userId?: string) {
    return this.trackError({
      message: `Audio Error: ${message}`,
      type: 'audio',
      severity: 'high',
      context
    }, userId);
  }

  trackUploadError(message: string, context?: any, userId?: string) {
    return this.trackError({
      message: `Upload Error: ${message}`,
      type: 'upload',
      severity: 'medium',
      context
    }, userId);
  }

  trackAuthError(message: string, context?: any, userId?: string) {
    return this.trackError({
      message: `Auth Error: ${message}`,
      type: 'auth',
      severity: 'critical',
      context
    }, userId);
  }

  clearOldErrors(daysOld: number = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    this.errors = this.errors.filter(error => new Date(error.timestamp) > cutoffDate);
    
    try {
      localStorage.setItem('meowplay_errors', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to clear old errors:', e);
    }
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

export const errorTracker = EnhancedErrorTracker.getInstance();
