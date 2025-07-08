import { User } from '../types';

export const TOKEN_KEY = 'music_app_token';
export const USER_KEY = 'music_app_user';

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user);
};

// Mock API functions (replace with actual API calls)
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user: User = {
    id: '1',
    email,
    username: email.split('@')[0],
    createdAt: new Date()
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  return { user, token };
};

export const register = async (email: string, password: string, username: string): Promise<{ user: User; token: string }> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user: User = {
    id: Date.now().toString(),
    email,
    username,
    createdAt: new Date()
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  return { user, token };
};