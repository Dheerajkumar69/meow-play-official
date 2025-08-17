/**
 * CSRF Protection utility for API requests
 */
export class CSRFService {
  private static readonly CSRF_TOKEN_KEY = 'csrf_token';
  private static readonly CSRF_HEADER = 'X-CSRF-Token';

  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current CSRF token from session storage
   */
  static getToken(): string {
    let token = sessionStorage.getItem(this.CSRF_TOKEN_KEY);
    if (!token) {
      token = this.generateToken();
      sessionStorage.setItem(this.CSRF_TOKEN_KEY, token);
    }
    return token;
  }

  /**
   * Get CSRF headers for API requests
   */
  static getHeaders(): Record<string, string> {
    return {
      [this.CSRF_HEADER]: this.getToken(),
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Add CSRF protection to fetch options
   */
  static secureRequest(options: RequestInit = {}): RequestInit {
    const headers = {
      ...this.getHeaders(),
      ...options.headers
    };

    return {
      ...options,
      headers,
      credentials: 'same-origin' // Include cookies for same-origin requests
    };
  }

  /**
   * Refresh CSRF token (call after login/logout)
   */
  static refreshToken(): string {
    const newToken = this.generateToken();
    sessionStorage.setItem(this.CSRF_TOKEN_KEY, newToken);
    return newToken;
  }

  /**
   * Clear CSRF token (call on logout)
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.CSRF_TOKEN_KEY);
  }
}
