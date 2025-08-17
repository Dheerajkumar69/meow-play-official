import DOMPurify from 'dompurify';

// Configure DOMPurify for different contexts
const createPurifyConfig = (allowedTags: string[] = [], allowedAttributes: string[] = []) => ({
  ALLOWED_TAGS: allowedTags,
  ALLOWED_ATTR: allowedAttributes,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: false
});

export class SanitizationService {
  // Sanitize HTML content for display (comments, descriptions)
  static sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, createPurifyConfig(
      ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ['href', 'title']
    ));
  }

  // Sanitize rich text content (lyrics, descriptions)
  static sanitizeRichText(dirty: string): string {
    return DOMPurify.sanitize(dirty, createPurifyConfig(
      ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4'],
      []
    ));
  }

  // Sanitize text content (remove all HTML)
  static sanitizeText(dirty: string): string {
    return DOMPurify.sanitize(dirty, createPurifyConfig([], []));
  }

  // Sanitize and validate user input for storage
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 1000); // Limit length
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
      .substring(0, 255); // Email length limit
  }

  // Sanitize username
  static sanitizeUsername(username: string): string {
    if (typeof username !== 'string') return '';
    
    return username
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
      .substring(0, 30); // Username length limit
  }

  // Sanitize filename for uploads
  static sanitizeFilename(filename: string): string {
    if (typeof filename !== 'string') return 'untitled';
    
    const parts = filename.split('.');
    const name = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0] || 'untitled';
    const ext = parts.length > 1 ? parts[parts.length - 1] : '';
    
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
      .toLowerCase()
      .substring(0, 100); // Limit name length
    
    const sanitizedExt = (ext || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 10); // Limit extension length
    
    return sanitizedName && sanitizedExt ? `${sanitizedName}.${sanitizedExt}` : 'untitled';
  }

  // Sanitize search query
  static sanitizeSearchQuery(query: string): string {
    if (typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit search query length
  }

  /**
   * Sanitize playlist/song names and descriptions
   */
  static sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    
    return this.sanitizeText(name).slice(0, 255); // Limit length for names
  }

  /**
   * Sanitize user profile data
   */
  static sanitizeUserInput(input: {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
  }): {
    username?: string;
    email?: string;
    displayName?: string;
    bio?: string;
  } {
    const sanitized: any = {};
    
    if (input.username) {
      sanitized.username = this.sanitizeText(input.username).slice(0, 50);
    }
    
    if (input.email) {
      // Basic email sanitization - let validation handle format
      sanitized.email = this.sanitizeText(input.email).slice(0, 255);
    }
    
    if (input.displayName) {
      sanitized.displayName = this.sanitizeText(input.displayName).slice(0, 100);
    }
    
    if (input.bio) {
      sanitized.bio = this.sanitizeHTML(input.bio).slice(0, 500);
    }
    
    return sanitized;
  }

  /**
   * Sanitize API payload data
   */
  static sanitizeApiPayload(payload: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = this.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeApiPayload(value);
      } else if (Array.isArray(value)) {
        // Sanitize array elements
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeText(item) : item
        );
      } else {
        // Keep non-string values as is (numbers, booleans, etc.)
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}
