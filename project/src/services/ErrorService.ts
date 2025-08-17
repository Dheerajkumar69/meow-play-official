export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  user?: {
    id?: string;
    email?: string;
  };
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  timestamp?: Date;
}

export interface ToastOptions {
  type?: 'error' | 'warning' | 'info' | 'success';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  duration: number;
  persistent: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

// Toast event system
type ToastEventHandler = (toast: Toast) => void;

class ToastManager {
  private listeners: ToastEventHandler[] = [];
  private toasts = new Map<string, Toast>();

  subscribe(handler: ToastEventHandler) {
    this.listeners.push(handler);
    return () => {
      const index = this.listeners.indexOf(handler);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(toast: Toast) {
    this.toasts.set(toast.id, toast);
    this.listeners.forEach(handler => handler(toast));

    // Auto-remove non-persistent toasts
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }
  }

  show(message: string, options: ToastOptions = {}): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action,
      timestamp: new Date()
    };

    this.notify(toast);
    return id;
  }

  remove(id: string) {
    if (this.toasts.has(id)) {
      this.toasts.delete(id);
      // Notify listeners about removal
      this.listeners.forEach(handler => handler({
        ...this.toasts.get(id)!,
        id: `remove-${id}`
      }));
    }
  }

  clear() {
    const ids = Array.from(this.toasts.keys());
    this.toasts.clear();
    ids.forEach(id => this.remove(id));
  }

  getToasts(): Toast[] {
    return Array.from(this.toasts.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
}

// Integration hooks for third-party services
export interface ErrorIntegration {
  name: string;
  log(error: Error, info?: ErrorInfo): Promise<void> | void;
}

class ErrorService {
  private static instance: ErrorService;
  private toastManager = new ToastManager();
  private integrations: ErrorIntegration[] = [];
  private isEnabled = true;

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // Configuration methods
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  addIntegration(integration: ErrorIntegration) {
    this.integrations.push(integration);
  }

  removeIntegration(name: string) {
    const index = this.integrations.findIndex(i => i.name === name);
    if (index > -1) {
      this.integrations.splice(index, 1);
    }
  }

  // Core error logging method
  async log(error: Error | string, info?: ErrorInfo): Promise<void> {
    if (!this.isEnabled) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const enhancedInfo: ErrorInfo = {
      timestamp: new Date(),
      severity: 'medium',
      ...info
    };

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorService.log');
      console.error('Error:', errorObj);
      console.log('Info:', enhancedInfo);
      console.trace('Stack trace');
      console.groupEnd();
    } else {
      // In production, use a more concise log
      console.error('[ErrorService]', errorObj.message, {
        name: errorObj.name,
        severity: enhancedInfo.severity,
        context: enhancedInfo.context
      });
    }

    // Send to integrations (Sentry, LogRocket, etc.)
    await Promise.allSettled(
      this.integrations.map(integration => {
        try {
          return Promise.resolve(integration.log(errorObj, enhancedInfo));
        } catch (integrationError) {
          console.warn(`Integration ${integration.name} failed:`, integrationError);
          return Promise.resolve();
        }
      })
    );
  }

  // User-facing notification method
  notifyUser(message: string, options: ToastOptions = {}): string {
    if (!this.isEnabled) return '';

    // If it's an error, also log it
    if (options.type === 'error') {
      this.log(new Error(message), {
        severity: 'low',
        context: { userNotification: true }
      });
    }

    return this.toastManager.show(message, options);
  }

  // Toast management methods
  subscribeToToasts(handler: ToastEventHandler) {
    return this.toastManager.subscribe(handler);
  }

  dismissToast(id: string) {
    this.toastManager.remove(id);
  }

  clearAllToasts() {
    this.toastManager.clear();
  }

  getActiveToasts(): Toast[] {
    return this.toastManager.getToasts();
  }

  // Convenience methods for different error types
  logNetworkError(error: Error | string, url?: string, method?: string) {
    return this.log(error, {
      severity: 'medium',
      tags: ['network'],
      context: { url, method }
    });
  }

  logDatabaseError(error: Error | string, operation?: string, table?: string) {
    return this.log(error, {
      severity: 'high',
      tags: ['database'],
      context: { operation, table }
    });
  }

  logAuthError(error: Error | string, action?: string) {
    return this.log(error, {
      severity: 'medium',
      tags: ['auth'],
      context: { action }
    });
  }

  logUIError(error: Error | string, component?: string) {
    return this.log(error, {
      severity: 'low',
      tags: ['ui'],
      context: { component }
    });
  }

  // Quick notification methods
  showError(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.notifyUser(message, { ...options, type: 'error' });
  }

  showWarning(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.notifyUser(message, { ...options, type: 'warning' });
  }

  showInfo(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.notifyUser(message, { ...options, type: 'info' });
  }

  showSuccess(message: string, options?: Omit<ToastOptions, 'type'>) {
    return this.notifyUser(message, { ...options, type: 'success' });
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();

// Export class for testing
export { ErrorService };

// Example Sentry integration
export const SentryIntegration: ErrorIntegration = {
  name: 'sentry',
  log: async (error: Error, info?: ErrorInfo) => {
    // This would integrate with @sentry/browser
    // if (window.Sentry) {
    //   window.Sentry.withScope((scope) => {
    //     if (info?.user) scope.setUser(info.user);
    //     if (info?.tags) info.tags.forEach(tag => scope.setTag('custom', tag));
    //     if (info?.context) scope.setContext('additional', info.context);
    //     if (info?.severity) scope.setLevel(info.severity);
    //     window.Sentry.captureException(error);
    //   });
    // }
    console.log('[Sentry Integration] Would send:', error.message);
  }
};
