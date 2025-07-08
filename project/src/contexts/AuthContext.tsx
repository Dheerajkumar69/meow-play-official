import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User } from '../types';
import { offlineAuth, MASTER_ADMIN } from '../utils/offlineAuth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isOnline: boolean;
  syncStatus: string;
  forceSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_SYNC_STATUS'; payload: string };

const initialState: AuthState & { loading: boolean; isOnline: boolean; syncStatus: string } = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  isOnline: navigator.onLine,
  syncStatus: 'unknown'
};

const authReducer = (state: typeof initialState, action: AuthAction): typeof initialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Restore session from offline storage
    const session = offlineAuth.getCurrentSession();
    if (session) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: session });
    }

    // Set up online/offline listeners
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
      offlineAuth.attemptSync().then(() => {
        updateSyncStatus();
      });
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync status
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateSyncStatus = () => {
    const status = offlineAuth.getSyncStatus();
    dispatch({ type: 'SET_SYNC_STATUS', payload: status?.status || 'unknown' });
  };

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await offlineAuth.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
      updateSyncStatus();
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await offlineAuth.register(email, password, username);
      dispatch({ type: 'LOGIN_SUCCESS', payload: result });
      updateSyncStatus();
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = (): void => {
    offlineAuth.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const forceSync = async (): Promise<void> => {
    if (state.isOnline) {
      await offlineAuth.attemptSync();
      updateSyncStatus();
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      forceSync
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};