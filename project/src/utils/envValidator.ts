/**
 * Production Environment Validator
 * Validates all required environment variables and provides secure defaults
 */

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_ADMIN_EMAIL: string;
  VITE_APP_NAME: string;
  VITE_APP_URL: string;
  VITE_GOOGLE_ANALYTICS_ID?: string;
  VITE_UPTIMEROBOT_API_KEY?: string;
  NODE_ENV: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvConfig;
  private isValid: boolean = false;

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  constructor() {
    this.config = this.validateAndLoad();
  }

  private validateAndLoad(): EnvConfig {
    const errors: string[] = [];
    
    // Required variables
    const requiredVars = {
      VITE_SUPABASE_URL: import.meta.env['VITE_SUPABASE_URL'],
      VITE_SUPABASE_ANON_KEY: import.meta.env['VITE_SUPABASE_ANON_KEY'],
      VITE_ADMIN_EMAIL: import.meta.env['VITE_ADMIN_EMAIL'],
      VITE_APP_NAME: import.meta.env['VITE_APP_NAME'] || 'MeowPlay',
      VITE_APP_URL: import.meta.env['VITE_APP_URL'] || 'https://meowplay.vercel.app',
      NODE_ENV: import.meta.env['NODE_ENV'] || 'development'
    };

    // Optional variables
    const optionalVars = {
      VITE_GOOGLE_ANALYTICS_ID: import.meta.env['VITE_GOOGLE_ANALYTICS_ID'],
      VITE_UPTIMEROBOT_API_KEY: import.meta.env['VITE_UPTIMEROBOT_API_KEY']
    };

    // Validate required variables
    Object.entries(requiredVars).forEach(([key, value]) => {
      if (!value || value === 'your_value_here' || value === 'undefined') {
        errors.push(`Missing required environment variable: ${key}`);
      }
    });

    // Validate URL formats
    if (requiredVars.VITE_SUPABASE_URL && !this.isValidUrl(requiredVars.VITE_SUPABASE_URL)) {
      errors.push('VITE_SUPABASE_URL must be a valid URL');
    }

    if (requiredVars.VITE_APP_URL && !this.isValidUrl(requiredVars.VITE_APP_URL)) {
      errors.push('VITE_APP_URL must be a valid URL');
    }

    // Validate email format
    if (requiredVars.VITE_ADMIN_EMAIL && !this.isValidEmail(requiredVars.VITE_ADMIN_EMAIL)) {
      errors.push('VITE_ADMIN_EMAIL must be a valid email address');
    }

    // Production-specific validations
    if (requiredVars.NODE_ENV === 'production') {
      if (!optionalVars.VITE_GOOGLE_ANALYTICS_ID) {
        errors.push('VITE_GOOGLE_ANALYTICS_ID recommended for production');
      }
      
      if (!requiredVars.VITE_APP_URL.startsWith('https://')) {
        errors.push('VITE_APP_URL must use HTTPS in production');
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
      if (requiredVars.NODE_ENV === 'production') {
        throw new Error(errorMessage);
      } else {
        // In development, warn but don't fail
        if (typeof window !== 'undefined') {
          alert(`Development Warning:\n${errorMessage}`);
        }
      }
    } else {
      this.isValid = true;
    }

    return {
      ...requiredVars,
      ...optionalVars
    } as EnvConfig;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getConfig(): EnvConfig {
    return this.config;
  }

  isEnvironmentValid(): boolean {
    return this.isValid;
  }

  getSupabaseConfig() {
    return {
      url: this.config.VITE_SUPABASE_URL,
      anonKey: this.config.VITE_SUPABASE_ANON_KEY
    };
  }

  getAppConfig() {
    return {
      name: this.config.VITE_APP_NAME,
      url: this.config.VITE_APP_URL,
      adminEmail: this.config.VITE_ADMIN_EMAIL,
      isProduction: this.config.NODE_ENV === 'production'
    };
  }

  getAnalyticsConfig() {
    return {
      googleAnalyticsId: this.config.VITE_GOOGLE_ANALYTICS_ID,
      uptimeRobotApiKey: this.config.VITE_UPTIMEROBOT_API_KEY
    };
  }
}

export const envValidator = EnvironmentValidator.getInstance();
export default envValidator;
