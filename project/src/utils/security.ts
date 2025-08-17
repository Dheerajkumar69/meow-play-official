import DOMPurify from 'dompurify';

/**
 * Comprehensive security utilities for XSS prevention and input sanitization
 */

/**
 * XSS Protection Configuration
 */
const XSS_CONFIG = {
  // Allowed HTML tags for rich content
  ALLOWED_TAGS: [
    'b', 'i', 'u', 'em', 'strong', 'br', 'p', 'span',
    'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
  ],
  
  // Allowed attributes
  ALLOWED_ATTRIBUTES: ['class', 'id', 'style'],
  
  // Forbidden protocols
  FORBIDDEN_PROTOCOLS: ['javascript:', 'data:', 'vbscript:', 'onload'],
  
  // Content Security Policy directives
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'media-src': ["'self'", 'blob:', 'https:'],
    'connect-src': ["'self'", 'https:'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
  }
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHTML = (html: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: string[];
  removeScript?: boolean;
}): string => {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const config = {
      ALLOWED_TAGS: options?.allowedTags || XSS_CONFIG.ALLOWED_TAGS,
      ALLOWED_ATTR: options?.allowedAttributes || XSS_CONFIG.ALLOWED_ATTRIBUTES,
      FORBID_TAGS: options?.removeScript !== false ? ['script', 'object', 'embed', 'form', 'input'] : [],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      WHOLE_DOCUMENT: false,
    };

    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return '';
  }
};

/**
 * Sanitizes text content by removing potentially dangerous characters
 */
export const sanitizeText = (text: string, options?: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowSpecialChars?: boolean;
}): string => {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let sanitized = text;

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove potentially dangerous Unicode characters
    sanitized = sanitized.replace(/[\u2028\u2029]/g, '');

    // Handle newlines
    if (!options?.allowNewlines) {
      sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }

    // Handle special characters
    if (!options?.allowSpecialChars) {
      // Keep only alphanumeric, spaces, and basic punctuation
      sanitized = sanitized.replace(/[^\w\s.,!?'"()\-_@#]/g, '');
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Apply length limit
    if (options?.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    return sanitized;
  } catch (error) {
    console.error('Text sanitization failed:', error);
    return '';
  }
};

/**
 * Escapes HTML entities to prevent XSS
 */
export const escapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=/]/g, (char) => entityMap[char as keyof typeof entityMap]);
};

/**
 * Validates and sanitizes URLs to prevent malicious redirects
 */
export const sanitizeURL = (url: string, options?: {
  allowedProtocols?: string[];
  allowedDomains?: string[];
  maxLength?: number;
}): string | null => {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Remove dangerous protocols
    const sanitized = url.trim().toLowerCase();
    
    for (const protocol of XSS_CONFIG.FORBIDDEN_PROTOCOLS) {
      if (sanitized.startsWith(protocol)) {
        return null;
      }
    }

    // Check allowed protocols
    const allowedProtocols = options?.allowedProtocols || ['http:', 'https:', 'mailto:'];
    let hasValidProtocol = false;
    
    for (const protocol of allowedProtocols) {
      if (sanitized.startsWith(protocol)) {
        hasValidProtocol = true;
        break;
      }
    }

    if (!hasValidProtocol && !sanitized.startsWith('/')) {
      return null;
    }

    // Validate URL structure for full URLs
    if (sanitized.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        
        // Check allowed domains
        if (options?.allowedDomains) {
          const isAllowedDomain = options.allowedDomains.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
          );
          if (!isAllowedDomain) {
            return null;
          }
        }

        // Reconstruct clean URL
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      } catch {
        return null;
      }
    }

    // Handle relative URLs
    if (sanitized.startsWith('/')) {
      // Basic validation for relative URLs
      if (sanitized.includes('..') || sanitized.includes('//')) {
        return null;
      }
      return url;
    }

    return null;
  } catch (error) {
    console.error('URL sanitization failed:', error);
    return null;
  }
};

/**
 * Rate limiting utility to prevent abuse
 */
class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Checks if the key is rate limited
   */
  isLimited(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > attempt.resetTime) {
      // Reset the window
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (attempt.count >= this.maxAttempts) {
      return true;
    }

    attempt.count++;
    return false;
  }

  /**
   * Gets remaining attempts for a key
   */
  getRemainingAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return this.maxAttempts;

    const now = Date.now();
    if (now > attempt.resetTime) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - attempt.count);
  }

  /**
   * Clears attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Cleans up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global rate limiters for different operations
export const rateLimiters = {
  login: new RateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  register: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  upload: new RateLimiter(10, 60 * 60 * 1000), // 10 uploads per hour
  search: new RateLimiter(100, 60 * 60 * 1000), // 100 searches per hour
  api: new RateLimiter(1000, 60 * 60 * 1000), // 1000 API calls per hour
};

/**
 * Content Security Policy generator
 */
export const generateCSP = (additionalDirectives?: Record<string, string[]>): string => {
  const directives = { ...XSS_CONFIG.CSP_DIRECTIVES, ...additionalDirectives };
  
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Validates file uploads for security
 */
export const validateFileUpload = (file: File, options?: {
  allowedTypes?: string[];
  maxSize?: number;
  allowedExtensions?: string[];
}): { isValid: boolean; error?: string } => {
  try {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // Check file type
    const allowedTypes = options?.allowedTypes || ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Invalid file type' };
    }

    // Check file size (default 100MB)
    const maxSize = options?.maxSize || 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: 'File too large' };
    }

    // Check file extension
    const allowedExtensions = options?.allowedExtensions || ['.mp3', '.wav', '.flac', '.aac'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return { isValid: false, error: 'Invalid file extension' };
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.pif$/i,
      /\.js$/i, /\.vbs$/i, /\.jar$/i, /\.com$/i, /\.html$/i
    ];

    const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(fileName));
    if (hasDangerousPattern) {
      return { isValid: false, error: 'Potentially dangerous file name' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('File validation failed:', error);
    return { isValid: false, error: 'File validation error' };
  }
};

/**
 * Generates secure random tokens
 */
export const generateSecureToken = (length: number = 32): string => {
  try {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Token generation failed:', error);
    // Fallback to less secure but working method
    return Array.from({ length }, () => Math.random().toString(36)[2]).join('');
  }
};

/**
 * Validates JWT token format (basic validation)
 */
export const validateJWTFormat = (token: string): boolean => {
  try {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Each part should be base64 encoded
    for (const part of parts) {
      if (!part || part.length === 0) {
        return false;
      }
      
      // Check if it's valid base64
      try {
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('JWT validation failed:', error);
    return false;
  }
};

/**
 * Security headers for API requests
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

/**
 * Cleanup function to run periodically
 */
export const runSecurityCleanup = (): void => {
  try {
    // Clean up rate limiters
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
    
    // Clear expired secure storage items (handled by secureStorage itself)
    
    console.log('Security cleanup completed');
  } catch (error) {
    console.error('Security cleanup failed:', error);
  }
};

// Run cleanup every 10 minutes
setInterval(runSecurityCleanup, 10 * 60 * 1000);

export default {
  sanitizeHTML,
  sanitizeText,
  escapeHTML,
  sanitizeURL,
  validateFileUpload,
  generateSecureToken,
  validateJWTFormat,
  getSecurityHeaders,
  rateLimiters,
  generateCSP,
};
