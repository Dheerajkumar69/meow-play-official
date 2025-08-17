import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Song, Repeat } from '../types';
import { errorService } from '../services/ErrorService';

// Focused playback state interface
interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  repeat: Repeat;
  isShuffled: boolean;
  loading: boolean;
  error: string | null;
}

interface PlaybackContextType extends PlaybackState {
  audioRef: React.RefObject<HTMLAudioElement>;
  play: (song?: Song) => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  updateCurrentTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  setCurrentSong: (song: Song | null) => void;
  clearError: () => void;
}

type PlaybackAction = 
  | { type: 'SET_CURRENT_SONG'; payload: Song | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: PlaybackState = {
  currentSong: null,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  repeat: 'none',
  isShuffled: false,
  loading: false,
  error: null
};

const playbackReducer = (state: PlaybackState, action: PlaybackAction): PlaybackState => {
  switch (action.type) {
    case 'SET_CURRENT_SONG':
      return { ...state, currentSong: action.payload, error: null };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: Math.max(0, action.payload) };
    case 'SET_DURATION':
      return { ...state, duration: Math.max(0, action.payload) };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };
    case 'TOGGLE_REPEAT': {
      const nextRepeat = (): Repeat => {
        switch (state.repeat) {
          case 'none': return 'one';
          case 'one': return 'all';
          case 'all': return 'none';
        }
      };
      return { ...state, repeat: nextRepeat() };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(playbackReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const cleanupRef = useRef<() => void>();

  // Audio error handling with proper recovery
  const handleAudioError = useCallback((event: Event) => {
    const audio = event.target as HTMLAudioElement;
    const error = audio.error;
    let errorMessage = 'Audio playback failed';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Audio playback was aborted';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error occurred';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Audio decoding failed';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Audio format not supported';
          break;
      }
    }
    
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    dispatch({ type: 'SET_PLAYING', payload: false });
    
    // Log error for monitoring
    errorService.logUIError(new Error(errorMessage), 'PlaybackContext');
    
    // Show user-friendly error
    errorService.showError('Failed to play audio. Please try again.', {
      action: {
        label: 'Retry',
        onClick: () => {
          dispatch({ type: 'CLEAR_ERROR' });
          if (state.currentSong) {
            play(state.currentSong);
          }
        }
      }
    });
  }, [state.currentSong]);

  // Core playback functions with proper error handling
  const play = useCallback(async (song?: Song): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) {
      const error = new Error('Audio element not available');
      errorService.logUIError(error, 'PlaybackContext.play');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Cancel previous play promise
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore cancellation errors
        }
      }

      if (song) {
        dispatch({ type: 'SET_CURRENT_SONG', payload: song });
        audio.src = song.filePath;
      }

      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      dispatch({ type: 'SET_PLAYING', payload: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error : new Error('Unknown playback error');
      errorService.logUIError(errorMsg, 'PlaybackContext.play');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' });
      dispatch({ type: 'SET_PLAYING', payload: false });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      playPromiseRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      if (state.currentSong) {
        play();
      }
    }
  }, [state.isPlaying, state.currentSong, play, pause]);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && !isNaN(time) && time >= 0 && time <= audio.duration) {
      audio.currentTime = time;
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  }, []);

  const toggleRepeat = useCallback(() => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    if (!isNaN(time) && time >= 0) {
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }
  }, []);

  const updateDuration = useCallback((duration: number) => {
    if (!isNaN(duration) && duration > 0) {
      dispatch({ type: 'SET_DURATION', payload: duration });
    }
  }, []);

  const setCurrentSong = useCallback((song: Song | null) => {
    dispatch({ type: 'SET_CURRENT_SONG', payload: song });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.currentTime)) {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.duration) && audio.duration > 0) {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
  }, []);

  const handleCanPlay = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Setup audio element and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial volume
    audio.volume = state.volume;

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleAudioError);

    // Store cleanup function
    cleanupRef.current = () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleAudioError);
    };

    return cleanupRef.current;
  }, [handleTimeUpdate, handleDurationChange, handleLoadStart, handleCanPlay, handleAudioError]);

  // Volume effect
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = state.volume;
    }
  }, [state.volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {}); // Ignore errors on cleanup
      }
    };
  }, []);

  return (
    <PlaybackContext.Provider value={{
      ...state,
      audioRef,
      play,
      pause,
      togglePlay,
      setVolume,
      seek,
      toggleShuffle,
      toggleRepeat,
      updateCurrentTime,
      updateDuration,
      setCurrentSong,
      clearError
    }}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlaybackContext.Provider>
  );
};

export const usePlayback = (): PlaybackContextType => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};

export { PlaybackContext };
