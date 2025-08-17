import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioPlayer } from '../../utils/AudioPlayer';

describe('AudioPlayer', () => {
  let audioPlayer: AudioPlayer;
  let mockAudio: any;

  beforeEach(() => {
    // Mock the Audio object
    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      currentTime: 0,
      volume: 1,
      src: ''
    };

    // Mock the global Audio constructor
    global.Audio = vi.fn(() => mockAudio) as any;

    // Create a new AudioPlayer instance
    audioPlayer = new AudioPlayer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default values', () => {
    expect(audioPlayer.isPlaying).toBe(false);
    expect(audioPlayer.volume).toBe(1);
    expect(audioPlayer.currentTime).toBe(0);
    expect(audioPlayer.duration).toBe(0);
  });

  it('loads a song correctly', () => {
    const songUrl = 'test-song.mp3';
    audioPlayer.loadSong(songUrl);

    expect(mockAudio.src).toBe(songUrl);
    expect(audioPlayer.isPlaying).toBe(false);
  });

  it('plays a song', async () => {
    const songUrl = 'test-song.mp3';
    audioPlayer.loadSong(songUrl);
    await audioPlayer.play();

    expect(mockAudio.play).toHaveBeenCalled();
    expect(audioPlayer.isPlaying).toBe(true);
  });

  it('pauses a song', async () => {
    const songUrl = 'test-song.mp3';
    audioPlayer.loadSong(songUrl);
    await audioPlayer.play();
    audioPlayer.pause();

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(audioPlayer.isPlaying).toBe(false);
  });

  it('sets volume correctly', () => {
    audioPlayer.setVolume(0.5);

    expect(mockAudio.volume).toBe(0.5);
    expect(audioPlayer.volume).toBe(0.5);
  });

  it('seeks to a specific time', () => {
    audioPlayer.seek(30);

    expect(mockAudio.currentTime).toBe(30);
    expect(audioPlayer.currentTime).toBe(30);
  });

  it('registers event listeners', () => {
    // Verify that event listeners are added during initialization
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
  });

  it('updates currentTime when timeupdate event fires', () => {
    // Simulate timeupdate event
    mockAudio.currentTime = 45;
    const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'timeupdate'
    )[1];
    
    timeUpdateHandler();
    
    expect(audioPlayer.currentTime).toBe(45);
  });

  it('updates duration when loadedmetadata event fires', () => {
    // Simulate loadedmetadata event
    mockAudio.duration = 180;
    const loadedMetadataHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'loadedmetadata'
    )[1];
    
    loadedMetadataHandler();
    
    expect(audioPlayer.duration).toBe(180);
  });

  it('calls onEnded callback when ended event fires', () => {
    const onEndedMock = vi.fn();
    audioPlayer.onEnded(onEndedMock);
    
    // Simulate ended event
    const endedHandler = mockAudio.addEventListener.mock.calls.find(
      call => call[0] === 'ended'
    )[1];
    
    endedHandler();
    
    expect(onEndedMock).toHaveBeenCalled();
  });

  it('cleans up event listeners when destroyed', () => {
    audioPlayer.destroy();
    
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
  });
});