import { supabase } from '../lib/supabase';
import { DatabaseService } from './database';
import type { User } from '../types';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, username: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create user profile in our users table
    try {
      await DatabaseService.createUser({
        id: authData.user.id,
        email: authData.user.email!,
        username,
        is_artist: false,
        is_admin: false,
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
      // Continue anyway since the auth user was created
    }

    return {
      user: authData.user,
      session: authData.session,
    };
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // Sign out
  static async signOut() {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current session
  static async getSession() {
    if (!supabase) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // Get current user
  static async getCurrentUser() {
    if (!supabase) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Reset password
  static async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  }

  // Update password
  static async updatePassword(newPassword: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  // Get user profile from our database
  static async getUserProfile(userId: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      return await DatabaseService.getUser(userId);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    return await DatabaseService.updateUser(userId, updates);
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.user;
  }
}

export default AuthService;
