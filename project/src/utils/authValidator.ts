import { AuthError } from '@supabase/supabase-js';
import { rateLimiter } from './rateLimiter';
import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
}

export class AuthValidator {
  private static instance: AuthValidator;
  
  static getInstance(): AuthValidator {
    if (!AuthValidator.instance) {
      AuthValidator.instance = new AuthValidator();
    }
    return AuthValidator.instance;
  }

  checkPasswordStrength(password: string): PasswordStrengthResult {
    const result = zxcvbn(password);
    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || []
      }
    };
  }

  validatePasswordRequirements(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    const strength = this.checkPasswordStrength(password);
    if (strength.score < 3) {
      errors.push(...strength.feedback.suggestions);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  @rateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }) // 5 attempts per 15 minutes
  async validateLoginAttempt(email: string): Promise<void> {
    // Rate limiting is handled by the decorator
  }
}
