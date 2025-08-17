import { RateLimiterMemory } from 'rate-limiter-flexible';

interface RateLimiterOptions {
  maxAttempts: number;
  windowMs: number;
}

// Rate limiter instance for auth attempts
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of attempts
  duration: 15 * 60, // Per 15 minutes
});

export function rateLimiter(options: RateLimiterOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = args[0]; // Usually email or IP address
      try {
        await authLimiter.consume(key);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error.name === 'RateLimiterError') {
          const waitMs = error.msBeforeNext;
          const waitMinutes = Math.ceil(waitMs / 1000 / 60);
          throw new Error(
            `Too many attempts. Please try again in ${waitMinutes} minutes.`
          );
        }
        throw error;
      }
    };

    return descriptor;
  };
}
