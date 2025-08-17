import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import KeyboardShortcuts from '../../components/KeyboardShortcuts';
import { MusicContext } from '../../contexts/MusicContext';

// Mock context values
const mockContextValue = {
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  toggleShuffle: vi.fn(),
  toggleRepeat: vi.fn(),
  volume: 0.5,
  setVolume: vi.fn()
};

describe('KeyboardShortcuts', () => {
  // Reset mock functions before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers and handles space key for play/pause', async () => {
    render(
      <MusicContext.Provider value={mockContextValue}>
        <KeyboardShortcuts />
      </MusicContext.Provider>
    );

    // Simulate space key press
    await userEvent.keyboard(' ');
    expect(mockContextValue.play).toHaveBeenCalled();

    // Press again to test pause
    await userEvent.keyboard(' ');
    expect(mockContextValue.pause).toHaveBeenCalled();
  });

  it('handles arrow keys for volume control', async () => {
    render(
      <MusicContext.Provider value={mockContextValue}>
        <KeyboardShortcuts />
      </MusicContext.Provider>
    );

    // Test volume up
    await userEvent.keyboard('{ArrowUp}');
    expect(mockContextValue.setVolume).toHaveBeenCalledWith(0.6);

    // Test volume down
    await userEvent.keyboard('{ArrowDown}');
    expect(mockContextValue.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('handles media keys for playback control', async () => {
    render(
      <MusicContext.Provider value={mockContextValue}>
        <KeyboardShortcuts />
      </MusicContext.Provider>
    );

    // Test next track
    await userEvent.keyboard('{MediaTrackNext}');
    expect(mockContextValue.next).toHaveBeenCalled();

    // Test previous track
    await userEvent.keyboard('{MediaTrackPrevious}');
    expect(mockContextValue.previous).toHaveBeenCalled();
  });

  it('handles modifier keys for special commands', async () => {
    render(
      <MusicContext.Provider value={mockContextValue}>
        <KeyboardShortcuts />
      </MusicContext.Provider>
    );

    // Test shuffle toggle (Ctrl+S)
    await userEvent.keyboard('{Control>}s{/Control}');
    expect(mockContextValue.toggleShuffle).toHaveBeenCalled();

    // Test repeat toggle (Ctrl+R)
    await userEvent.keyboard('{Control>}r{/Control}');
    expect(mockContextValue.toggleRepeat).toHaveBeenCalled();
  });
});
