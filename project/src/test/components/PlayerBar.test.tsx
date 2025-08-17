import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerBar from '../../components/PlayerBar';
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

describe('PlayerBar', () => {
  const mockFns = {
    togglePlay: vi.fn(),
    nextSong: vi.fn(),
    prevSong: vi.fn(),
    toggleLike: vi.fn(),
    toggleShuffle: vi.fn(),
    toggleRepeat: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when no song is playing', () => {
    const { container } = render(
      <MockMusicProvider mockValues={mockFns}>
        <PlayerBar />
      </MockMusicProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders song information when a song is playing', () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('toggles play/pause when play button is clicked', async () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const playButton = screen.getByLabelText(/play/i);
    await user.click(playButton);

    expect(mockFns.togglePlay).toHaveBeenCalled();
  });

  it('shows pause button when song is playing', () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong, isPlaying: true }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    expect(screen.getByLabelText(/pause/i)).toBeInTheDocument();
  });

  it('calls nextSong when next button is clicked', async () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const nextButton = screen.getByLabelText(/next song/i);
    await user.click(nextButton);

    expect(mockFns.nextSong).toHaveBeenCalled();
  });

  it('calls prevSong when previous button is clicked', async () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const prevButton = screen.getByLabelText(/previous song/i);
    await user.click(prevButton);

    expect(mockFns.prevSong).toHaveBeenCalled();
  });

  it('toggles like when like button is clicked', async () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const user = userEvent.setup();
    const likeButton = screen.getByLabelText(/like song/i);
    await user.click(likeButton);

    expect(mockFns.toggleLike).toHaveBeenCalledWith(mockSong.id);
  });

  it('displays filled heart icon when song is liked', () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockLikedSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const likeButton = screen.getByLabelText(/like song/i);
    expect(likeButton).toHaveClass('text-red-400');
  });

  it('displays empty heart icon when song is not liked', () => {
    render(
      <MockMusicProvider mockValues={{ ...mockFns, currentSong: mockSong }}>
        <PlayerBar />
      </MockMusicProvider>
    );

    const likeButton = screen.getByLabelText(/like song/i);
    expect(likeButton).toHaveClass('text-gray-400');
  });
});