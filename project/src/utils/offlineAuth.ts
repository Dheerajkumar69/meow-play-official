import { User } from '../types';
import bcrypt from 'bcryptjs';

export interface OfflineUser extends User {
  passwordHash?: string; // Hashed password for security
  lastSyncedAt?: Date;
  needsSync?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

const OFFLINE_USERS_KEY = 'music_app_offline_users';
const CURRENT_USER_KEY = 'music_app_current_user';
const SYNC_STATUS_KEY = 'music_app_sync_status';

// Master Admin Account - DO NOT CHANGE THESE CREDENTIALS
export const MASTER_ADMIN = {
  email: 'admin@streamify.com',
  password: 'StreamifyAdmin2024!',
  username: 'StreamifyAdmin',
  id: 'master-admin-001',
  isAdmin: true
};

export class OfflineAuthManager {
  private static instance: OfflineAuthManager;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  static getInstance(): OfflineAuthManager {
    if (!OfflineAuthManager.instance) {
      OfflineAuthManager.instance = new OfflineAuthManager();
    }
    return OfflineAuthManager.instance;
  }

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.attemptSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Initialize with master admin if no users exist
    this.initializeMasterAdmin();
  }

  private async initializeMasterAdmin(): Promise<void> {
    const users = this.getOfflineUsers();
    const adminExists = users.some(user => user.email === MASTER_ADMIN.email);
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(MASTER_ADMIN.password, 10);
      
      const adminUser: OfflineUser = {
        id: MASTER_ADMIN.id,
        email: MASTER_ADMIN.email,
        username: MASTER_ADMIN.username,
        passwordHash,
        createdAt: new Date(),
        isAdmin: true,
        needsSync: false,
        lastSyncedAt: new Date()
      };
      
      users.push(adminUser);
      this.saveOfflineUsers(users);
    }
  }

  private getOfflineUsers(): OfflineUser[] {
    try {
      const users = localStorage.getItem(OFFLINE_USERS_KEY);
      if (!users) return [];
      
      const parsedUsers = JSON.parse(users);
      
      // Convert date strings back to Date objects
      return parsedUsers.map((user: any) => ({
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        lastSyncedAt: user.lastSyncedAt ? new Date(user.lastSyncedAt) : undefined
      }));
    } catch (error) {
      console.error('Failed to get offline users:', error);
      return [];
    }
  }

  private saveOfflineUsers(users: OfflineUser[]): void {
    try {
      localStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save offline users:', error);
      throw new Error('Failed to save user data');
    }
  }

  private getCurrentUser(): OfflineUser | null {
    try {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      if (!user) return null;
      
      const parsedUser = JSON.parse(user);
      
      // Convert date strings back to Date objects
      return {
        ...parsedUser,
        createdAt: parsedUser.createdAt ? new Date(parsedUser.createdAt) : new Date(),
        lastSyncedAt: parsedUser.lastSyncedAt ? new Date(parsedUser.lastSyncedAt) : undefined
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  private setCurrentUser(user: OfflineUser | null): void {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (error) {
      console.error('Failed to set current user:', error);
      throw new Error('Failed to save session');
    }
  }

  async register(email: string, password: string, username: string): Promise<{ user: User; token: string }> {
    if (!email || !password || !username) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const users = this.getOfflineUsers();
    
    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      
      const newUser: OfflineUser = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        username,
        passwordHash,
        createdAt: new Date(),
        needsSync: true,
        lastSyncedAt: undefined
      };

      users.push(newUser);
      this.saveOfflineUsers(users);
      this.setCurrentUser(newUser);

      // Attempt to sync if online
      if (this.isOnline) {
        this.attemptSync();
      }

      const token = this.generateLocalToken(newUser);
      return { 
        user: this.sanitizeUser(newUser), 
        token 
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed');
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const users = this.getOfflineUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    try {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      this.setCurrentUser(user);

      // Attempt to sync if online
      if (this.isOnline) {
        this.attemptSync();
      }

      const token = this.generateLocalToken(user);
      return { 
        user: this.sanitizeUser(user), 
        token 
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
    }
  }

  logout(): void {
    try {
      this.setCurrentUser(null);
      localStorage.removeItem('music_app_token');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  getCurrentSession(): { user: User; token: string } | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    const token = this.generateLocalToken(user);
    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  private generateLocalToken(user: OfflineUser): string {
    return `local-token-${user.id}-${Date.now()}`;
  }

  private sanitizeUser(user: OfflineUser): User {
    const { passwordHash, needsSync, lastSyncedAt, ...sanitized } = user;
    return sanitized;
  }

  async attemptSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    
    try {
      const users = this.getOfflineUsers();
      const usersNeedingSync = users.filter(u => u.needsSync && u.email !== MASTER_ADMIN.email);

      for (const user of usersNeedingSync) {
        try {
          // Attempt to sync with MongoDB
          await this.syncUserToMongoDB(user);
          
          // Mark as synced
          user.needsSync = false;
          user.lastSyncedAt = new Date();
        } catch (error) {
          console.warn(`Failed to sync user ${user.email}:`, error);
        }
      }

      this.saveOfflineUsers(users);
      this.setSyncStatus('synced');
    } catch (error) {
      console.error('Sync failed:', error);
      this.setSyncStatus('failed');
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncUserToMongoDB(user: OfflineUser): Promise<void> {
    // Simulate MongoDB sync - replace with actual API call
    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
          // Note: passwordHash is handled securely on server
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
    } catch (error) {
      // If API doesn't exist yet, just log the attempt
      console.log('Sync attempted for user:', user.email);
    }
  }

  private setSyncStatus(status: 'synced' | 'pending' | 'failed'): void {
    try {
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
        status,
        lastAttempt: new Date()
      }));
    } catch (error) {
      console.error('Failed to set sync status:', error);
    }
  }

  getSyncStatus(): { status: string; lastAttempt: Date } | null {
    try {
      const status = localStorage.getItem(SYNC_STATUS_KEY);
      if (!status) return null;
      
      const parsedStatus = JSON.parse(status);
      return {
        ...parsedStatus,
        lastAttempt: parsedStatus.lastAttempt ? new Date(parsedStatus.lastAttempt) : new Date()
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Admin functions
  getAllUsers(): OfflineUser[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.isAdmin) {
      throw new Error('Admin access required');
    }
    return this.getOfflineUsers().map(user => ({
      ...user,
      // For display purposes in admin panel, show original password for master admin
      password: user.id === MASTER_ADMIN.id ? MASTER_ADMIN.password : undefined
    }));
  }

  deleteUser(userId: string): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.isAdmin) {
      throw new Error('Admin access required');
    }

    if (userId === MASTER_ADMIN.id) {
      throw new Error('Cannot delete master admin account');
    }

    const users = this.getOfflineUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    this.saveOfflineUsers(filteredUsers);
  }
}

export const offlineAuth = OfflineAuthManager.getInstance();