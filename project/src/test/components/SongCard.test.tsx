import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SongCard from '../../components/SongCard';
import { Song } from '../../types';
import { MockMusicProvider } from '../utils/mockMusicContext';

const mockSong: Song = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  genre: 'Pop',
  duration: 180,
  filePath: 'test.mp3',
  uploadedBy: '1',
  createdAt: new Date(),
  playCount: 100,
  liked: false
};

const mockLikedSong: Song = {
  ...mockSong,
  liked: true
};

describe('SongCard', () => {
  const mockFns = {
    playSong: vi.fn(),
    toggleLike: vi.fn(),
    addToPlaylist: vi.fn(),
    isPlaying: false,
    currentSong: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders song information correctly', () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument(); // 180 seconds formatted
  });

  it('plays song when clicked', async () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const songCard = screen.getByTestId('song-card');
    await user.click(songCard);

    expect(mockFns.playSong).toHaveBeenCalledWith(mockSong.id);
  });

  it('displays pause button when song is currently playing', () => {
    render(
      <MockMusicProvider mockValues={{
        ...mockFns,
        isPlaying: true,
        currentSong: mockSong
      }}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    expect(screen.getByLabelText(/pause/i)).toBeInTheDocument();
  });

  it('displays song index when song is not playing', () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={5} />
      </MockMusicProvider>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles like when heart icon is clicked', async () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const likeButton = screen.getByLabelText(/like/i);
    await user.click(likeButton);

    expect(mockFns.toggleLike).toHaveBeenCalledWith(mockSong.id);
  });

  it('displays filled heart icon when song is liked', () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockLikedSong} index={1} />
      </MockMusicProvider>
    );

    const likeButton = screen.getByLabelText(/like/i);
    expect(likeButton).toHaveClass('text-red-400');
  });

  it('displays empty heart icon when song is not liked', () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    const likeButton = screen.getByLabelText(/like/i);
    expect(likeButton).toHaveClass('text-gray-400');
  });

  it('opens playlist menu when add to playlist button is clicked', async () => {
    render(
      <MockMusicProvider mockValues={mockFns}>
        <SongCard song={mockSong} index={1} />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const addToPlaylistButton = screen.getByLabelText(/add to playlist/i);
    await user.click(addToPlaylistButton);

    // Verify dropdown menu is opened
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});