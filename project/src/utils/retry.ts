import { errorService } from '../services/ErrorService';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  context?: string;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryCondition' | 'context'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
};

/**
 * Default retry condition - retries on network and temporary errors
 */
export const defaultRetryCondition = (error: Error): boolean => {
  // Network errors
  if (error.message.includes('NetworkError') || 
      error.message.includes('fetch')) {
    return true;
  }

  // HTTP status codes that should be retried
  if ('status' in error) {
    const status = (error as any).status;
    return status >= 500 || status === 408 || status === 429;
  }

  // Database connection errors
  if (error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNREFUSED')) {
    return true;
  }

  return false;
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number, 
  initialDelay: number, 
  maxDelay: number, 
  multiplier: number, 
  jitter: boolean
): number {
  let delay = initialDelay * Math.pow(multiplier, attempt - 1);
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    // Add random jitter between 0% and 25% of the delay
    const jitterAmount = delay * 0.25 * Math.random();
    delay += jitterAmount;
  }
  
  return Math.floor(delay);
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const retryCondition = options.retryCondition || defaultRetryCondition;
  const startTime = Date.now();
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if we've reached max attempts
      if (attempt >= opts.maxAttempts) {
        break;
      }
      
      // Don't retry if the condition says not to
      if (!retryCondition(lastError)) {
        break;
      }
      
      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(lastError, attempt);
      }
      
      // Log the retry attempt
      errorService.log(lastError, {
        severity: 'low',
        tags: ['retry'],
        context: {
          attempt,
          maxAttempts: opts.maxAttempts,
          context: options.context,
          willRetry: attempt < opts.maxAttempts
        }
      });
      
      // Wait before retrying
      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(
          attempt,
          opts.initialDelay,
          opts.maxDelay,
          opts.backoffMultiplier,
          opts.jitter
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed, throw the last error
  throw lastError!;
}

/**
 * Decorator for network operations with retry
 */
export function withNetworkRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const result = await withRetry(() => fn(...args), {
      maxAttempts: 3,
      initialDelay: 1000,
      context: 'network',
      ...options
    });
    return result.result;
  };
}

/**
 * Decorator for database operations with retry
 */
export function withDatabaseRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const result = await withRetry(() => fn(...args), {
      maxAttempts: 2,
      initialDelay: 500,
      maxDelay: 5000,
      context: 'database',
      retryCondition: (error) => {
        // Database-specific retry conditions
        return error.message.includes('connection') ||
               error.message.includes('timeout') ||
               error.message.includes('lock') ||
               error.message.includes('deadlock') ||
               defaultRetryCondition(error);
      },
      ...options
    });
    return result.result;
  };
}

/**
 * Simple retry wrapper for one-off operations
 */
export const retry = {
  network: withNetworkRetry,
  database: withDatabaseRetry,
  
  /**
   * Create a custom retry wrapper with specific options
   */
  custom: <T extends any[], R>(options: RetryOptions) => 
    (fn: (...args: T) => Promise<R>) => 
      withNetworkRetry(fn, options)
};

/**
 * Utility for creating retryable versions of service methods
 */
export function makeRetryable<T extends Record<string, (...args: any[]) => Promise<any>>>(
  service: T,
  methodOptions: Partial<Record<keyof T, RetryOptions>> = {}
): T {
  const retryableService = {} as T;
  
  for (const [methodName, method] of Object.entries(service)) {
    if (typeof method === 'function') {
      const options = methodOptions[methodName as keyof T] || {};
      retryableService[methodName as keyof T] = withNetworkRetry(method.bind(service), options) as any;
    } else {
      retryableService[methodName as keyof T] = method;
    }
  }
  
  return retryableService;
}
