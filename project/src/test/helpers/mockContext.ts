import React from 'react';
import { vi } from 'vitest';
import { MusicContextType } from '../../contexts/MusicContext';

export const createMockMusicContext = (overrides?: Partial<MusicContextType>): MusicContextType => ({
  audioRef: { current: null },
  currentSong: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  isShuffled: false,
  isRepeating: false,
  crossfadeEnabled: false,
  crossfadeDuration: 2,
  equalizer: {
    bass: 0,
    mid: 0,
    treble: 0,
    enabled: false,
  },
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  toggleShuffle: vi.fn(),
  toggleRepeat: vi.fn(),
  setVolume: vi.fn(),
  addToPlaylist: vi.fn(),
  toggleLike: vi.fn(),
  ...overrides,
});
