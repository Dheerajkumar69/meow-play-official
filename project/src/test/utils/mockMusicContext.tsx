import React, { ReactNode } from 'react';
import { MusicContext, MusicContextType } from '../../contexts/MusicContext';
import { vi } from 'vitest';

const defaultMockContext: MusicContextType = {
  currentSong: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  repeat: 'none',
  songs: [],
  loading: false,
  error: null,
  equalizer: {
    bass: 0,
    mid: 0,
    treble: 0,
    enabled: false
  },
  crossfadeEnabled: false,
  crossfadeDuration: 0,
  audioRef: { current: null },
  play: vi.fn(),
  pause: vi.fn(),
  togglePlay: vi.fn(),
  setVolume: vi.fn(),
  seek: vi.fn(),
  nextSong: vi.fn(),
  prevSong: vi.fn(),
  addToQueue: vi.fn(),
  removeFromQueue: vi.fn(),
  setQueue: vi.fn(),
  toggleShuffle: vi.fn(),
  toggleRepeat: vi.fn(),
  updateCurrentTime: vi.fn(),
  updateDuration: vi.fn(),
  setSongs: vi.fn(),
  setEqualizer: vi.fn(),
  setCrossfade: vi.fn(),
  refreshSongs: vi.fn(),
  toggleLike: vi.fn(),
  addToPlaylist: vi.fn(),
};

export const MockMusicProvider = ({ children, mockValues = {} }: { children: ReactNode; mockValues?: Partial<MusicContextType> }) => {
  const contextValue = {
    ...defaultMockContext,
    ...mockValues,
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
    </MusicContext.Provider>
  );
};
