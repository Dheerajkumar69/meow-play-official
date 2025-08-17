import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, User } from '../types';
import { AuthService } from '../services/auth';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_STATE'; payload: { user: User | null; supabaseUser: SupabaseUser | null; session: Session | null } }
  | { type: 'LOGOUT' };

const initialState: AuthState & { loading: boolean; supabaseUser: SupabaseUser | null; session: Session | null } = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  supabaseUser: null,
  session: null
};

const authReducer = (state: typeof initialState, action: AuthAction): typeof initialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        user: action.payload.user,
        supabaseUser: action.payload.supabaseUser,
        session: action.payload.session,
        token: action.payload.session?.access_token || null,
        isAuthenticated: !!action.payload.session?.user,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        supabaseUser: null,
        session: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (session?.user) {
        // Fetch user profile from our database
        const userProfile = await AuthService.getUserProfile(session.user.id);
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            user: userProfile,
            supabaseUser: session.user,
            session
          }
        });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    // Initial session check
    const checkInitialSession = async () => {
      try {
        const session = await AuthService.getSession();
        if (session?.user) {
          const userProfile = await AuthService.getUserProfile(session.user.id);
          dispatch({
            type: 'SET_AUTH_STATE',
            payload: {
              user: userProfile,
              supabaseUser: session.user,
              session
            }
          });
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { session, user: supabaseUser } = await AuthService.signIn(email, password);
      if (session?.user) {
        const userProfile = await AuthService.getUserProfile(session.user.id);
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            user: userProfile,
            supabaseUser: session.user,
            session
          }
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { session, user: supabaseUser } = await AuthService.signUp(email, password, username);
      if (session?.user) {
        const userProfile = await AuthService.getUserProfile(session.user.id);
        dispatch({
          type: 'SET_AUTH_STATE',
          payload: {
            user: userProfile,
            supabaseUser: session.user,
            session
          }
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
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