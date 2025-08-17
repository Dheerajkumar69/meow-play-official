import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicProvider, useMusic } from '../../contexts/MusicContext';
import { Song } from '../../types';
import { ApiService } from '../../services/api';

// Mock the ApiService
vi.mock('../../services/api', () => {
  return {
    ApiService: vi.fn().mockImplementation(() => ({
      likeSong: vi.fn().mockResolvedValue(undefined),
      unlikeSong: vi.fn().mockResolvedValue(undefined),
      getAllSongs: vi.fn().mockResolvedValue([]),
    }))
  };
});

// Test component that uses the MusicContext
const TestComponent = () => {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    toggleLike,
    songs,
    setSongs
  } = useMusic();

  return (
    <div>
      <div data-testid="current-song">{currentSong?.title || 'No song'}</div>
      <div data-testid="playing-status">{isPlaying ? 'Playing' : 'Paused'}</div>
      <button onClick={() => togglePlay()}>Toggle Play</button>
      {songs.map(song => (
        <div key={song.id} data-testid={`song-${song.id}`}>
          <span>{song.title}</span>
          <button 
            onClick={() => toggleLike(song.id)}
            data-testid={`like-button-${song.id}`}
          >
            {song.liked ? 'Unlike' : 'Like'}
          </button>
        </div>
      ))}
      <button 
        onClick={() => setSongs([
          {
            id: '1',
            title: 'Test Song 1',
            artist: 'Test Artist',
            album: 'Test Album',
            duration: 180,
            filePath: '/test/song1.mp3',
            liked: false,
            playCount: 0,
            createdAt: new Date(),
            uploadedBy: 'user1',
            genre: 'Pop'
          },
          {
            id: '2',
            title: 'Test Song 2',
            artist: 'Test Artist 2',
            album: 'Test Album 2',
            duration: 240,
            filePath: '/test/song2.mp3',
            liked: true,
            playCount: 5,
            createdAt: new Date(),
            uploadedBy: 'user1',
            genre: 'Rock'
          }
        ])}
      >
        Load Songs
      </button>
    </div>
  );
};

describe('MusicContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides music context to children components', async () => {
    render(
      <MusicProvider>
        <TestComponent />
      </MusicProvider>
    );

    expect(screen.getByTestId('current-song')).toHaveTextContent('No song');
    expect(screen.getByTestId('playing-status')).toHaveTextContent('Paused');
  });

  it('toggles play state correctly', async () => {
    render(
      <MusicProvider>
        <TestComponent />
      </MusicProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText('Toggle Play'));
    
    // Since there's no song loaded, play state should remain paused
    expect(screen.getByTestId('playing-status')).toHaveTextContent('Paused');
  });

  it('loads songs and toggles like status', async () => {
    const mockApiService = new ApiService();
    
    render(
      <MusicProvider>
        <TestComponent />
      </MusicProvider>
    );

    const user = userEvent.setup();
    
    // Load songs
    await user.click(screen.getByText('Load Songs'));
    
    // Verify songs are loaded
    expect(screen.getByTestId('song-1')).toBeInTheDocument();
    expect(screen.getByTestId('song-2')).toBeInTheDocument();
    
    // Verify like buttons show correct initial state
    expect(screen.getByTestId('like-button-1')).toHaveTextContent('Like');
    expect(screen.getByTestId('like-button-2')).toHaveTextContent('Unlike');
    
    // Toggle like for song 1
    await user.click(screen.getByTestId('like-button-1'));
    
    // Verify API was called
    await waitFor(() => {
      expect(mockApiService.likeSong).toHaveBeenCalledTimes(1);
    });
    
    // Verify UI updated
    expect(screen.getByTestId('like-button-1')).toHaveTextContent('Unlike');
    
    // Toggle like for song 2 (unlike)
    await user.click(screen.getByTestId('like-button-2'));
    
    // Verify API was called
    await waitFor(() => {
      expect(mockApiService.unlikeSong).toHaveBeenCalledTimes(1);
    });
    
    // Verify UI updated
    expect(screen.getByTestId('like-button-2')).toHaveTextContent('Like');
  });
});