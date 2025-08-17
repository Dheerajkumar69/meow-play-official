/**
 * Authentication Flow Validator
 * Validates complete user registration and login flows
 */

import { supabase } from '../lib/supabase';
import { errorHandler } from './productionErrorHandler';

interface AuthTestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export class AuthFlowValidator {
  private static instance: AuthFlowValidator;
  
  static getInstance(): AuthFlowValidator {
    if (!AuthFlowValidator.instance) {
      AuthFlowValidator.instance = new AuthFlowValidator();
    }
    return AuthFlowValidator.instance;
  }

  async validateCompleteAuthFlow(): Promise<AuthTestResult[]> {
    const results: AuthTestResult[] = [];
    
    // Test 1: Supabase Connection
    results.push(await this.testSupabaseConnection());
    
    // Test 2: User Registration
    results.push(await this.testUserRegistration());
    
    // Test 3: User Login
    results.push(await this.testUserLogin());
    
    // Test 4: Password Reset
    results.push(await this.testPasswordReset());
    
    // Test 5: Session Management
    results.push(await this.testSessionManagement());
    
    return results;
  }

  private async testSupabaseConnection(): Promise<AuthTestResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      return {
        test: 'Supabase Connection',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      errorHandler.error('Supabase connection test failed', error as Error);
      return {
        test: 'Supabase Connection',
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  private async testUserRegistration(): Promise<AuthTestResult> {
    const startTime = Date.now();
    const testEmail = `test-${Date.now()}@meowplay.test`;
    const testPassword = 'TestPassword123!';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: `testuser${Date.now()}`,
            full_name: 'Test User'
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Clean up test user
      if (data.user) {
        await supabase.auth.admin.deleteUser(data.user.id);
      }
      
      return {
        test: 'User Registration',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        test: 'User Registration',
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  private async testUserLogin(): Promise<AuthTestResult> {
    const startTime = Date.now();
    
    try {
      // Create a test user first
      const testEmail = `login-test-${Date.now()}@meowplay.test`;
      const testPassword = 'TestPassword123!';
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      // Test login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        throw signInError;
      }
      
      // Clean up
      if (signUpData.user) {
        await supabase.auth.admin.deleteUser(signUpData.user.id);
      }
      
      return {
        test: 'User Login',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        test: 'User Login',
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  private async testPasswordReset(): Promise<AuthTestResult> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        'test@meowplay.test',
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );
      
      if (error) {
        throw error;
      }
      
      return {
        test: 'Password Reset',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        test: 'Password Reset',
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  private async testSessionManagement(): Promise<AuthTestResult> {
    const startTime = Date.now();
    
    try {
      // Test session retrieval
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      // Test user retrieval
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      return {
        test: 'Session Management',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        test: 'Session Management',
        passed: false,
        error: (error as Error).message,
        duration: Date.now() - startTime
      };
    }
  }

  async runQuickAuthTest(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }
}

export const authValidator = AuthFlowValidator.getInstance();
