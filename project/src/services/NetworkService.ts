import { errorService } from './ErrorService';

interface RetryOptions {
  retries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: any) => boolean;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retry?: RetryOptions;
  showUserError?: boolean;
}

class NetworkService {
  private static instance: NetworkService;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestTimeout: number = 10000; // 10 seconds
  private online: boolean = navigator.onLine;
  private statusChangeCallbacks: Array<(isOnline: boolean) => void> = [];

  private constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Initialize network status listeners
    this.initNetworkListeners();
  }
  
  private initNetworkListeners() {
    // Add event listeners for online and offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }
  
  private handleOnline = () => {
    this.online = true;
    this.notifyStatusChangeCallbacks();
  }
  
  private handleOffline = () => {
    this.online = false;
    this.notifyStatusChangeCallbacks();
  }
  
  private notifyStatusChangeCallbacks() {
    this.statusChangeCallbacks.forEach(callback => callback(this.online));
  }
  
  public isOnline(): boolean {
    return this.online;
  }
  
  public onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.statusChangeCallbacks.push(callback);
    return () => {
      this.statusChangeCallbacks = this.statusChangeCallbacks.filter(cb => cb !== callback);
    };
  }
  
  public destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.statusChangeCallbacks = [];
  }

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders.Authorization = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders.Authorization;
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.requestTimeout,
      retry = {},
      showUserError = true
    } = options;

    const {
      retries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      retryCondition = (error) => this.shouldRetry(error)
    } = retry;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await this.handleHttpError(response);
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          throw error;
        }

        // Handle different response types
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        } else if (contentType?.includes('text/')) {
          return await response.text() as T;
        } else {
          return await response.blob() as T;
        }

      } catch (error) {
        lastError = error as Error;

        // Log the error
        errorService.logNetworkError(
          lastError, 
          url, 
          method
        );

        // Don't retry on the last attempt or if retry condition fails
        if (attempt === retries || !retryCondition(lastError)) {
          break;
        }

        // Calculate delay for next retry
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;

        await this.delay(delay);
      }
    }

    // Show user-friendly error message
    if (showUserError) {
      const userMessage = this.getUserFriendlyErrorMessage(lastError!);
      errorService.showError(userMessage, {
        action: {
          label: 'Retry',
          onClick: () => this.makeRequest(endpoint, options)
        },
        duration: 5000
      });
    }

    throw lastError!;
  }

  private async handleHttpError(response: Response): Promise<Error> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Use default error message if we can't parse the response
    }

    return new Error(errorMessage);
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'AbortError') return false; // Don't retry timeouts
    if (error.message?.includes('NetworkError')) return true;
    if (error.message?.includes('fetch')) return true;
    if (error.message?.includes('500') || error.message?.includes('502') || 
        error.message?.includes('503') || error.message?.includes('504')) return true;
    
    return false;
  }

  private getUserFriendlyErrorMessage(error: Error): string {
    if (error.name === 'AbortError') {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message?.includes('500')) {
      return 'Server error. Please try again later.';
    }
    if (error.message?.includes('401')) {
      return 'Authentication failed. Please log in again.';
    }
    if (error.message?.includes('403')) {
      return 'You don\'t have permission to perform this action.';
    }
    if (error.message?.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    return 'Something went wrong. Please try again.';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  async put<T>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  async patch<T>(endpoint: string, data?: any, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload with progress tracking
  async upload<T>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(Math.round(progress));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            resolve(xhr.responseText as T);
          }
        } else {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          errorService.logNetworkError(error, endpoint, 'POST');
          errorService.showError('Failed to upload file', { duration: 5000 });
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error during upload');
        errorService.logNetworkError(error, endpoint, 'POST');
        errorService.showError('Upload failed due to network error', { duration: 5000 });
        reject(error);
      };

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth header if available
      if (this.defaultHeaders.Authorization) {
        xhr.setRequestHeader('Authorization', this.defaultHeaders.Authorization);
      }

      xhr.send(formData);
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { 
        timeout: 5000, 
        retry: { retries: 1 }, 
        showUserError: false 
      });
      return true;
    } catch {
      return false;
    }
  }

  // Connection status monitoring
  isOnline(): boolean {
    return navigator.onLine;
  }

  onConnectionChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const networkService = NetworkService.getInstance();
export { NetworkService };
