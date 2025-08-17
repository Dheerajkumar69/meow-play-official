import CryptoJS from 'crypto-js';

/**
 * Secure storage utilities with encryption for sensitive data
 */

// Environment-based encryption key (should be from env in production)
const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'meow-play-default-key-2024';

/**
 * Encrypts data using AES encryption
 */
const encrypt = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts data using AES decryption
 */
const decrypt = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed - invalid data');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Secure storage interface
 */
interface SecureStorageInterface {
  setItem(key: string, value: unknown): void;
  getItem<T = unknown>(key: string): T | null;
  removeItem(key: string): void;
  clear(): void;
  hasItem(key: string): boolean;
  getAllKeys(): string[];
}

/**
 * Secure localStorage implementation with encryption
 */
class SecureStorage implements SecureStorageInterface {
  private readonly prefix: string = 'meow_secure_';
  private readonly sensitiveKeys = new Set([
    'auth_tokens',
    'user_credentials',
    'payment_info',
    'personal_data',
    'api_keys',
  ]);

  /**
   * Determines if a key contains sensitive data
   */
  private isSensitive(key: string): boolean {
    return this.sensitiveKeys.has(key) || key.includes('password') || key.includes('token');
  }

  /**
   * Gets the prefixed storage key
   */
  private getStorageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Safely stringifies data
   */
  private serialize(data: unknown): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Serialization failed:', error);
      throw new Error('Failed to serialize data');
    }
  }

  /**
   * Safely parses data
   */
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Deserialization failed:', error);
      throw new Error('Failed to deserialize data');
    }
  }

  /**
   * Sets an item in secure storage
   */
  setItem(key: string, value: unknown): void {
    try {
      if (!key) {
        throw new Error('Storage key cannot be empty');
      }

      const serializedValue = this.serialize(value);
      const storageKey = this.getStorageKey(key);

      if (this.isSensitive(key)) {
        // Encrypt sensitive data
        const encryptedValue = encrypt(serializedValue);
        localStorage.setItem(storageKey, `encrypted:${encryptedValue}`);
      } else {
        // Store non-sensitive data as-is
        localStorage.setItem(storageKey, serializedValue);
      }

      // Set expiration for auth tokens (24 hours)
      if (key === 'auth_tokens') {
        const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(`${storageKey}_expires`, expirationTime.toString());
      }
    } catch (error) {
      console.error('Failed to set item in secure storage:', error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Gets an item from secure storage
   */
  getItem<T = unknown>(key: string): T | null {
    try {
      if (!key) {
        return null;
      }

      const storageKey = this.getStorageKey(key);
      const storedValue = localStorage.getItem(storageKey);

      if (!storedValue) {
        return null;
      }

      // Check expiration for auth tokens
      if (key === 'auth_tokens') {
        const expirationTime = localStorage.getItem(`${storageKey}_expires`);
        if (expirationTime && Date.now() > parseInt(expirationTime, 10)) {
          this.removeItem(key);
          return null;
        }
      }

      // Handle encrypted data
      if (storedValue.startsWith('encrypted:')) {
        const encryptedValue = storedValue.replace('encrypted:', '');
        const decryptedValue = decrypt(encryptedValue);
        return this.deserialize<T>(decryptedValue);
      }

      // Handle regular data
      return this.deserialize<T>(storedValue);
    } catch (error) {
      console.error('Failed to get item from secure storage:', error);
      // Don't throw error for getItem, just return null
      return null;
    }
  }

  /**
   * Removes an item from secure storage
   */
  removeItem(key: string): void {
    try {
      if (!key) {
        return;
      }

      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_expires`);
    } catch (error) {
      console.error('Failed to remove item from secure storage:', error);
    }
  }

  /**
   * Clears all items from secure storage
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  /**
   * Checks if an item exists in secure storage
   */
  hasItem(key: string): boolean {
    if (!key) {
      return false;
    }

    const storageKey = this.getStorageKey(key);
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Gets all keys from secure storage
   */
  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix) && !key.endsWith('_expires')) {
          keys.push(key.replace(this.prefix, ''));
        }
      }

      return keys;
    } catch (error) {
      console.error('Failed to get all keys from secure storage:', error);
      return [];
    }
  }

  /**
   * Gets storage size information
   */
  getStorageInfo(): { used: number; total: number; available: number } {
    try {
      let used = 0;
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          const value = localStorage.getItem(key) || '';
          used += key.length + value.length;
        }
      }

      return {
        used,
        total,
        available: Math.max(0, total - used),
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, total: 0, available: 0 };
    }
  }
}

/**
 * Memory-based storage fallback (when localStorage is not available)
 */
class MemoryStorage implements SecureStorageInterface {
  private storage = new Map<string, string>();

  setItem(key: string, value: unknown): void {
    this.storage.set(key, JSON.stringify(value));
  }

  getItem<T = unknown>(key: string): T | null {
    const value = this.storage.get(key);
    return value ? JSON.parse(value) : null;
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  hasItem(key: string): boolean {
    return this.storage.has(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }
}

/**
 * Storage factory that returns appropriate storage implementation
 */
const createStorage = (): SecureStorageInterface => {
  try {
    // Test localStorage availability
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return new SecureStorage();
  } catch {
    // Fallback to memory storage
    console.warn('localStorage not available, using memory storage');
    return new MemoryStorage();
  }
};

// Export singleton instance
export const secureStorage = createStorage();

/**
 * Utility functions for common storage operations
 */
export const storageUtils = {
  /**
   * Stores authentication tokens securely
   */
  setAuthTokens: (tokens: { accessToken: string; refreshToken: string; expiresAt: string }) => {
    secureStorage.setItem('auth_tokens', tokens);
  },

  /**
   * Retrieves authentication tokens
   */
  getAuthTokens: (): { accessToken: string; refreshToken: string; expiresAt: string } | null => {
    return secureStorage.getItem('auth_tokens');
  },

  /**
   * Clears authentication tokens
   */
  clearAuthTokens: () => {
    secureStorage.removeItem('auth_tokens');
  },

  /**
   * Stores user preferences
   */
  setUserPreferences: (preferences: Record<string, unknown>) => {
    secureStorage.setItem('user_preferences', preferences);
  },

  /**
   * Retrieves user preferences
   */
  getUserPreferences: <T = Record<string, unknown>>(): T | null => {
    return secureStorage.getItem('user_preferences');
  },

  /**
   * Stores temporary session data
   */
  setSessionData: (key: string, data: unknown) => {
    const sessionKey = `session_${key}`;
    secureStorage.setItem(sessionKey, data);
    
    // Auto-expire session data after 1 hour
    setTimeout(() => {
      secureStorage.removeItem(sessionKey);
    }, 60 * 60 * 1000);
  },

  /**
   * Retrieves temporary session data
   */
  getSessionData: <T = unknown>(key: string): T | null => {
    return secureStorage.getItem(`session_${key}`);
  },

  /**
   * Clears all user data (for logout)
   */
  clearAllUserData: () => {
    secureStorage.clear();
  },

  /**
   * Validates storage health
   */
  validateStorage: (): boolean => {
    try {
      const testKey = '__validation_test__';
      const testData = { timestamp: Date.now(), random: Math.random() };
      
      secureStorage.setItem(testKey, testData);
      const retrieved = secureStorage.getItem(testKey);
      secureStorage.removeItem(testKey);
      
      return JSON.stringify(testData) === JSON.stringify(retrieved);
    } catch {
      return false;
    }
  },
};

export default secureStorage;
