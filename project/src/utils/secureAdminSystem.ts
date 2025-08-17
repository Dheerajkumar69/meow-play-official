import { supabase } from '../lib/supabase';
import { loginRateLimiter } from './clientRateLimiter';
import { SanitizationService } from './sanitization';
import { validateAndSanitize, loginSchema } from './validationSchemas';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AdminLoginResult {
  success: boolean;
  user?: AdminUser;
  session?: any;
  error?: string;
  remainingAttempts?: number;
  blockedUntil?: number;
}

class SecureAdminSystem {
  private static instance: SecureAdminSystem;

  static getInstance(): SecureAdminSystem {
    if (!SecureAdminSystem.instance) {
      SecureAdminSystem.instance = new SecureAdminSystem();
    }
    return SecureAdminSystem.instance;
  }

  private getAdminEmail(): string {
    return import.meta.env['VITE_ADMIN_EMAIL'] || 'admin@meowplay.com';
  }

  async authenticateAdmin(email: string, password: string): Promise<AdminLoginResult> {
    try {
      // Sanitize inputs
      const sanitizedEmail = SanitizationService.sanitizeEmail(email);
      const sanitizedPassword = password.trim();

      // Validate inputs
      const validatedData = validateAndSanitize(loginSchema, {
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      // Check rate limiting
      const rateLimitId = `admin_login_${sanitizedEmail}`;
      if (loginRateLimiter.limiter.isBlocked(rateLimitId, loginRateLimiter.config)) {
        const blockTime = loginRateLimiter.limiter.getBlockTimeRemaining(rateLimitId);
        return {
          success: false,
          error: `Too many failed attempts. Try again in ${Math.ceil(blockTime / 60000)} minutes.`,
          blockedUntil: Date.now() + blockTime
        };
      }

      // Verify this is the configured admin email
      const adminEmail = this.getAdminEmail();
      if (validatedData.email !== adminEmail) {
        // Record failed attempt for rate limiting
        loginRateLimiter.limiter.recordAttempt(rateLimitId, loginRateLimiter.config, false);
        
        return {
          success: false,
          error: 'Invalid admin credentials',
          remainingAttempts: loginRateLimiter.limiter.getRemainingAttempts(rateLimitId, loginRateLimiter.config)
        };
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      });

      if (error) {
        // Record failed attempt
        loginRateLimiter.limiter.recordAttempt(rateLimitId, loginRateLimiter.config, false);
        
        return {
          success: false,
          error: 'Invalid admin credentials',
          remainingAttempts: loginRateLimiter.limiter.getRemainingAttempts(rateLimitId, loginRateLimiter.config)
        };
      }

      if (!data.user) {
        loginRateLimiter.limiter.recordAttempt(rateLimitId, loginRateLimiter.config, false);
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      // Verify admin status in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, username, is_admin, created_at, last_login_at')
        .eq('id', data.user.id)
        .eq('is_admin', true)
        .single();

      if (profileError || !profile || !profile.is_admin) {
        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
        loginRateLimiter.limiter.recordAttempt(rateLimitId, loginRateLimiter.config, false);
        
        return {
          success: false,
          error: 'Admin access denied',
          remainingAttempts: loginRateLimiter.limiter.getRemainingAttempts(rateLimitId, loginRateLimiter.config)
        };
      }

      // Update last login time
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Record successful attempt (resets rate limiting)
      loginRateLimiter.limiter.recordAttempt(rateLimitId, loginRateLimiter.config, true);

      return {
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          isAdmin: profile.is_admin,
          createdAt: profile.created_at,
          lastLoginAt: profile.last_login_at
        },
        session: data.session
      };

    } catch (error) {
      console.error('Admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication system error'
      };
    }
  }

  async createAdminUser(email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Only allow creation of the configured admin email
      const adminEmail = this.getAdminEmail();
      const sanitizedEmail = SanitizationService.sanitizeEmail(email);
      
      if (sanitizedEmail !== adminEmail) {
        return {
          success: false,
          error: 'Only the configured admin email can be created'
        };
      }

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
        options: {
          data: {
            username: SanitizationService.sanitizeUsername(username),
            is_admin: true
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Failed to create admin user'
        };
      }

      // Insert admin profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: sanitizedEmail,
          username: SanitizationService.sanitizeUsername(username),
          is_admin: true,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Failed to create admin profile:', profileError);
        return {
          success: false,
          error: 'Failed to create admin profile'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Admin creation error:', error);
      return {
        success: false,
        error: 'System error during admin creation'
      };
    }
  }

  async verifyAdminSession(): Promise<{ isValid: boolean; user?: AdminUser }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.user) {
        return { isValid: false };
      }

      // Verify admin status in database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, username, is_admin, created_at, last_login_at')
        .eq('id', session.user.id)
        .eq('is_admin', true)
        .single();

      if (profileError || !profile || !profile.is_admin) {
        // Invalid admin session, sign out
        await supabase.auth.signOut();
        return { isValid: false };
      }

      return {
        isValid: true,
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          isAdmin: profile.is_admin,
          createdAt: profile.created_at,
          lastLoginAt: profile.last_login_at
        }
      };

    } catch (error) {
      console.error('Session verification error:', error);
      return { isValid: false };
    }
  }

  async signOutAdmin(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  }

  async getAllUsers(adminUserId: string): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      // Verify admin status
      const { isValid } = await this.verifyAdminSession();
      if (!isValid) {
        return {
          success: false,
          error: 'Admin authentication required'
        };
      }

      // Fetch all users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username, is_admin, created_at, last_login_at')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch users'
        };
      }

      return {
        success: true,
        users: users || []
      };

    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: 'System error'
      };
    }
  }

  async deleteUser(adminUserId: string, targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify admin status
      const { isValid, user } = await this.verifyAdminSession();
      if (!isValid || !user) {
        return {
          success: false,
          error: 'Admin authentication required'
        };
      }

      // Prevent admin from deleting themselves
      if (targetUserId === user.id) {
        return {
          success: false,
          error: 'Cannot delete your own admin account'
        };
      }

      // Delete user profile
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', targetUserId);

      if (error) {
        return {
          success: false,
          error: 'Failed to delete user'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: 'System error'
      };
    }
  }
}

export { SecureAdminSystem, type AdminUser, type AdminLoginResult };
