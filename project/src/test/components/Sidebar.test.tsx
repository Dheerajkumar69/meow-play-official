import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../../components/Sidebar';
import { BrowserRouter } from 'react-router-dom';
import { ApiService } from '../../services/api';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the ApiService
vi.mock('../../services/api', () => {
  return {
    ApiService: vi.fn().mockImplementation(() => ({
      getUserPlaylists: vi.fn().mockResolvedValue([]),
      createPlaylist: vi.fn().mockResolvedValue({
        id: 'new-playlist-id',
        name: 'New Playlist',
        userId: 'user1',
        createdAt: new Date(),
        isPublic: true
      })
    }))
  };
});

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User'
  };

  return {
    AuthProvider: ({ children }) => children,
    useAuth: () => ({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn()
    })
  };
});

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links', () => {
    renderSidebar();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders playlists section', () => {
    renderSidebar();

    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create playlist/i })).toBeInTheDocument();
  });

  it('creates a new playlist when form is submitted', async () => {
    const mockApiService = new ApiService();
    renderSidebar();

    const user = userEvent.setup();
    
    // Click the create playlist button to show the input
    const createButton = screen.getByRole('button', { name: /create playlist/i });
    await user.click(createButton);
    
    // Now the input should be visible
    const input = screen.getByPlaceholderText('Playlist name');
    
    // Type playlist name
    await user.type(input, 'My Test Playlist');
    
    // Press Enter to submit
    await user.keyboard('{Enter}');

    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(mockApiService.createPlaylist).toHaveBeenCalledWith({
        name: 'My Test Playlist',
        userId: 'user1',
        isPublic: false,
        description: ''
      });
    });

    // Verify input is cleared after submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('disables input and button during playlist creation', async () => {
    // Mock the createPlaylist to delay resolution
    const mockApiService = new ApiService();
    mockApiService.createPlaylist = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            id: 'new-playlist-id',
            name: 'New Playlist',
            userId: 'user1',
            createdAt: new Date(),
            isPublic: true
          });
        }, 100);
      });
    });

    renderSidebar();

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('New playlist name...');
    const createButton = screen.getByRole('button', { name: /create/i });

    // Type playlist name
    await user.type(input, 'My Test Playlist');
    
    // Submit form
    await user.click(createButton);

    // Verify input and button are disabled during creation
    expect(input).toBeDisabled();
    expect(createButton).toBeDisabled();

    // Wait for creation to complete
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(createButton).not.toBeDisabled();
    });
  });

  it('does not create playlist with empty name', async () => {
    const mockApiService = new ApiService();
    renderSidebar();

    const user = userEvent.setup();
    const createButton = screen.getByRole('button', { name: /create/i });

    // Submit form without typing a name
    await user.click(createButton);

    // Verify API was not called
    expect(mockApiService.createPlaylist).not.toHaveBeenCalled();
  });
});