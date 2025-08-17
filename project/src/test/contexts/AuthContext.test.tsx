import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock AuthService
vi.mock('../../services/auth', () => {
  return {
    AuthService: {
      signIn: vi.fn().mockResolvedValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { user: { id: 'test-user-id', email: 'test@example.com' } }
      }),
      signUp: vi.fn().mockResolvedValue({
        user: { id: 'new-user-id', email: 'new@example.com' },
        session: { user: { id: 'new-user-id', email: 'new@example.com' } }
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
      getUserProfile: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser'
      }),
      getCurrentUser: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser'
      })
    }
  };
});

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({}))
  };
});

// Test component that uses the AuthContext
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('new@example.com', 'password', 'New User')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides authentication context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially not authenticated until session is checked
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

    // After session check completes, should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    // User information should be available
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('handles login correctly', async () => {
    const { AuthService } = await import('../../services/auth');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Login'));

    // Verify AuthService was called correctly
    await waitFor(() => {
      expect(AuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('handles registration correctly', async () => {
    const { AuthService } = await import('../../services/auth');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Register'));

    // Verify AuthService was called correctly
    await waitFor(() => {
      expect(AuthService.signUp).toHaveBeenCalledWith('new@example.com', 'password', 'New User');
    });
  });

  it('handles logout correctly', async () => {
    const { AuthService } = await import('../../services/auth');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial authentication
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Logout'));

    // Verify AuthService was called correctly
    await waitFor(() => {
      expect(AuthService.signOut).toHaveBeenCalled();
    });
  });
});