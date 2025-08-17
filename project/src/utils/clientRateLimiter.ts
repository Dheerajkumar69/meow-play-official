interface RateLimitAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

class ClientRateLimiter {
  private static instance: ClientRateLimiter;
  private attempts: Map<string, RateLimitAttempt> = new Map();
  private readonly storageKey = 'meow_play_rate_limits';

  static getInstance(): ClientRateLimiter {
    if (!ClientRateLimiter.instance) {
      ClientRateLimiter.instance = new ClientRateLimiter();
    }
    return ClientRateLimiter.instance;
  }

  constructor() {
    this.loadFromStorage();
    // Clean up old attempts every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.attempts = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load rate limit data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.attempts);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save rate limit data:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, attempt] of this.attempts) {
      // Remove attempts older than 1 hour
      if (now - attempt.lastAttempt > 60 * 60 * 1000) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.attempts.delete(key));
    if (toDelete.length > 0) {
      this.saveToStorage();
    }
  }

  isBlocked(identifier: string, config: RateLimitConfig): boolean {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return false;

    const now = Date.now();

    // Check if still in block period
    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      return true;
    }

    // Check if window has expired
    if (now - attempt.lastAttempt > config.windowMs) {
      this.attempts.delete(identifier);
      this.saveToStorage();
      return false;
    }

    return attempt.count >= config.maxAttempts;
  }

  recordAttempt(identifier: string, config: RateLimitConfig, success: boolean = false): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };

    // Reset if window expired
    if (now - attempt.lastAttempt > config.windowMs) {
      attempt.count = 0;
    }

    if (success) {
      // Reset on successful attempt
      this.attempts.delete(identifier);
    } else {
      attempt.count += 1;
      attempt.lastAttempt = now;

      // Block if exceeded max attempts
      if (attempt.count >= config.maxAttempts) {
        attempt.blockedUntil = now + config.blockDurationMs;
      }

      this.attempts.set(identifier, attempt);
    }

    this.saveToStorage();
  }

  getRemainingAttempts(identifier: string, config: RateLimitConfig): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt) return config.maxAttempts;

    const now = Date.now();
    
    // Reset if window expired
    if (now - attempt.lastAttempt > config.windowMs) {
      return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - attempt.count);
  }

  getBlockTimeRemaining(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt?.blockedUntil) return 0;

    return Math.max(0, attempt.blockedUntil - Date.now());
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
    this.saveToStorage();
  }
}

// Pre-configured rate limiters for common use cases
export const loginRateLimiter = {
  config: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 15 * 60 * 1000 // 15 minutes
  },
  limiter: ClientRateLimiter.getInstance()
};

export const registrationRateLimiter = {
  config: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  limiter: ClientRateLimiter.getInstance()
};

export const uploadRateLimiter = {
  config: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  limiter: ClientRateLimiter.getInstance()
};

export const searchRateLimiter = {
  config: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  limiter: ClientRateLimiter.getInstance()
};

export { ClientRateLimiter };
