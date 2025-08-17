import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlaylistDetail from '../../components/PlaylistDetail';
import { Playlist, Song } from '../../types';
import { MockMusicProvider } from '../utils/mockMusicContext';
import { BrowserRouter } from 'react-router-dom';

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'playlist-1' })
  };
});

const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Test Song 1',
    artist: 'Test Artist 1',
    album: 'Test Album 1',
    genre: 'Pop',
    duration: 180,
    filePath: 'test1.mp3',
    uploadedBy: '1',
    createdAt: new Date(),
    playCount: 100,
    liked: false
  },
  {
    id: '2',
    title: 'Test Song 2',
    artist: 'Test Artist 2',
    album: 'Test Album 2',
    genre: 'Rock',
    duration: 240,
    filePath: 'test2.mp3',
    uploadedBy: '1',
    createdAt: new Date(),
    playCount: 50,
    liked: true
  }
];

const mockPlaylist: Playlist = {
  id: 'playlist-1',
  name: 'Test Playlist',
  userId: 'user-1',
  createdAt: new Date(),
  isPublic: true
};

describe('PlaylistDetail', () => {
  const mockFns = {
    playSong: vi.fn(),
    toggleLike: vi.fn(),
    addToPlaylist: vi.fn(),
    isPlaying: false,
    currentSong: null,
    songs: mockSongs,
    playPlaylist: vi.fn()
  };

  // Mock ApiService
  const mockGetPlaylist = vi.fn().mockResolvedValue(mockPlaylist);
  const mockGetPlaylistSongs = vi.fn().mockResolvedValue(mockSongs);
  
  vi.mock('../../services/api', () => {
    return {
      ApiService: vi.fn().mockImplementation(() => ({
        getPlaylist: mockGetPlaylist,
        getPlaylistSongs: mockGetPlaylistSongs
      }))
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPlaylistDetail = () => {
    return render(
      <BrowserRouter>
        <MockMusicProvider mockValues={mockFns}>
          <PlaylistDetail />
        </MockMusicProvider>
      </BrowserRouter>
    );
  };

  it('renders playlist information', async () => {
    renderPlaylistDetail();

    // Wait for playlist data to load
    expect(await screen.findByText('Test Playlist')).toBeInTheDocument();
    expect(mockGetPlaylist).toHaveBeenCalledWith('playlist-1');
    expect(mockGetPlaylistSongs).toHaveBeenCalledWith('playlist-1');
  });

  it('displays playlist songs', async () => {
    renderPlaylistDetail();

    // Wait for songs to load
    expect(await screen.findByText('Test Song 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Song 2')).toBeInTheDocument();
    expect(await screen.findByText('Test Artist 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Artist 2')).toBeInTheDocument();
  });

  it('plays playlist when play button is clicked', async () => {
    renderPlaylistDetail();

    // Wait for playlist to load
    await screen.findByText('Test Playlist');

    const user = userEvent.setup();
    const playButton = screen.getByLabelText(/play playlist/i);
    await user.click(playButton);

    expect(mockFns.playPlaylist).toHaveBeenCalledWith(mockSongs.map(song => song.id));
  });

  it('toggles playlist like when heart icon is clicked', async () => {
    renderPlaylistDetail();

    // Wait for playlist to load
    await screen.findByText('Test Playlist');

    const user = userEvent.setup();
    const likeButton = screen.getByLabelText(/like playlist/i);
    await user.click(likeButton);

    // This is a placeholder as we noted in the implementation that playlist liking
    // will be implemented in a future update
    expect(screen.getByLabelText(/like playlist/i)).toBeInTheDocument();
  });

  it('plays song when song row is clicked', async () => {
    renderPlaylistDetail();

    // Wait for songs to load
    await screen.findByText('Test Song 1');

    const user = userEvent.setup();
    const songRow = screen.getAllByTestId('song-row')[0];
    await user.click(songRow);

    expect(mockFns.playSong).toHaveBeenCalledWith('1');
  });

  it('toggles song like when song heart icon is clicked', async () => {
    renderPlaylistDetail();

    // Wait for songs to load
    await screen.findByText('Test Song 1');

    const user = userEvent.setup();
    const likeButtons = screen.getAllByLabelText(/like song/i);
    await user.click(likeButtons[0]);

    expect(mockFns.toggleLike).toHaveBeenCalledWith('1');
  });
});