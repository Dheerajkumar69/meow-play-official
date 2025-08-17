import CryptoJS from 'crypto-js';

/**
 * Encrypted local storage utility for sensitive data
 */
export class EncryptedStorage {
  private static readonly ENCRYPTION_KEY = 'meow_play_secure_key_2024';
  private static readonly PREFIX = 'encrypted_';

  /**
   * Encrypt data using AES encryption
   */
  private static encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt data using AES decryption
   */
  private static decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store encrypted data in localStorage
   */
  static setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = this.encrypt(serializedValue);
      localStorage.setItem(this.PREFIX + key, encryptedValue);
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  static getItem<T>(key: string): T | null {
    try {
      const encryptedValue = localStorage.getItem(this.PREFIX + key);
      if (!encryptedValue) return null;

      const decryptedValue = this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  /**
   * Remove encrypted item from localStorage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Clear all encrypted items from localStorage
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if encrypted item exists
   */
  static hasItem(key: string): boolean {
    return localStorage.getItem(this.PREFIX + key) !== null;
  }

  /**
   * Store user session data securely
   */
  static setUserSession(sessionData: {
    userId: string;
    token: string;
    refreshToken?: string;
    expiresAt: number;
  }): void {
    this.setItem('user_session', sessionData);
  }

  /**
   * Get user session data
   */
  static getUserSession(): {
    userId: string;
    token: string;
    refreshToken?: string;
    expiresAt: number;
  } | null {
    return this.getItem('user_session');
  }

  /**
   * Store user preferences securely
   */
  static setUserPreferences(preferences: Record<string, any>): void {
    this.setItem('user_preferences', preferences);
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): Record<string, any> | null {
    return this.getItem('user_preferences');
  }

  /**
   * Store sensitive app settings
   */
  static setAppSettings(settings: Record<string, any>): void {
    this.setItem('app_settings', settings);
  }

  /**
   * Get app settings
   */
  static getAppSettings(): Record<string, any> | null {
    return this.getItem('app_settings');
  }
}
