interface CSRFConfig {
  tokenName: string;
  headerName: string;
  cookieName: string;
  tokenLength: number;
  maxAge: number; // in milliseconds
}

class CSRFProtection {
  private static instance: CSRFProtection;
  private config: CSRFConfig;
  private currentToken: string | null = null;

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  constructor() {
    this.config = {
      tokenName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      cookieName: 'csrf_token',
      tokenLength: 32,
      maxAge: 60 * 60 * 1000 // 1 hour
    };
    
    this.initializeToken();
  }

  private generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Use crypto.getRandomValues for secure random generation
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }

  private initializeToken(): void {
    // Check if we have a valid token in storage
    const storedToken = this.getStoredToken();
    
    if (storedToken && this.isTokenValid(storedToken)) {
      this.currentToken = storedToken.token;
    } else {
      this.generateNewToken();
    }
  }

  private getStoredToken(): { token: string; timestamp: number } | null {
    try {
      const stored = localStorage.getItem(this.config.tokenName);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to retrieve CSRF token:', error);
    }
    return null;
  }

  private isTokenValid(storedToken: { token: string; timestamp: number }): boolean {
    const now = Date.now();
    return (now - storedToken.timestamp) < this.config.maxAge;
  }

  private generateNewToken(): void {
    this.currentToken = this.generateSecureToken(this.config.tokenLength);
    
    // Store token with timestamp
    const tokenData = {
      token: this.currentToken,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(this.config.tokenName, JSON.stringify(tokenData));
    } catch (error) {
      console.warn('Failed to store CSRF token:', error);
    }
  }

  getToken(): string {
    if (!this.currentToken) {
      this.generateNewToken();
    }
    return this.currentToken!;
  }

  getHeaders(): Record<string, string> {
    return {
      [this.config.headerName]: this.getToken()
    };
  }

  validateToken(token: string): boolean {
    return token === this.currentToken && this.currentToken !== null;
  }

  refreshToken(): void {
    this.generateNewToken();
  }

  // Add CSRF protection to fetch requests
  protectedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getHeaders()
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  // Add CSRF token to form data
  addTokenToFormData(formData: FormData): void {
    formData.append(this.config.tokenName, this.getToken());
  }

  // Add CSRF token to URL parameters
  addTokenToUrl(url: string): string {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set(this.config.tokenName, this.getToken());
    return urlObj.toString();
  }

  // Middleware for API calls
  withCSRFProtection<T extends (...args: any[]) => Promise<any>>(
    apiCall: T
  ): T {
    return ((...args: any[]) => {
      // Ensure we have a fresh token
      if (!this.currentToken) {
        this.generateNewToken();
      }
      
      return apiCall(...args);
    }) as T;
  }

  // Clean up expired tokens
  cleanup(): void {
    const storedToken = this.getStoredToken();
    if (storedToken && !this.isTokenValid(storedToken)) {
      localStorage.removeItem(this.config.tokenName);
      this.currentToken = null;
    }
  }
}

// Enhanced fetch wrapper with CSRF protection
export const securedFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const csrf = CSRFProtection.getInstance();
  return csrf.protectedFetch(url, options);
};

// Form helper to add CSRF token
export const addCSRFToForm = (form: HTMLFormElement): void => {
  const csrf = CSRFProtection.getInstance();
  
  // Remove existing CSRF input if present
  const existingInput = form.querySelector(`input[name="${csrf['config'].tokenName}"]`);
  if (existingInput) {
    existingInput.remove();
  }
  
  // Add new CSRF input
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = csrf['config'].tokenName;
  input.value = csrf.getToken();
  form.appendChild(input);
};

// React hook for CSRF protection
export const useCSRFProtection = () => {
  const csrf = CSRFProtection.getInstance();
  
  return {
    token: csrf.getToken(),
    headers: csrf.getHeaders(),
    refreshToken: () => csrf.refreshToken(),
    protectedFetch: csrf.protectedFetch.bind(csrf),
    addTokenToFormData: csrf.addTokenToFormData.bind(csrf)
  };
};

export { CSRFProtection };
