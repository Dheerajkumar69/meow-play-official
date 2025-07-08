import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback, ReactNode } from 'react';
import { PlaybackState, Song } from '../types';
import { db } from '../utils/indexedDB';
import { mockSongs } from '../utils/mockData';

interface MusicContextType extends PlaybackState {
  audioRef: React.RefObject<HTMLAudioElement>;
  play: (song?: Song) => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  updateCurrentTime: (time: number) => void;
  updateDuration: (duration: number) => void;
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  loading: boolean;
  error: string | null;
  setEqualizer: (eq: PlaybackState['equalizer']) => void;
  setCrossfade: (enabled: boolean, duration: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

type MusicAction = 
  | { type: 'SET_CURRENT_SONG'; payload: Song }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_QUEUE'; payload: { songs: Song[]; startIndex?: number } }
  | { type: 'ADD_TO_QUEUE'; payload: Song }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'SET_SONGS'; payload: Song[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EQUALIZER'; payload: PlaybackState['equalizer'] }
  | { type: 'SET_CROSSFADE'; payload: { enabled: boolean; duration: number } };

const initialState: PlaybackState & { songs: Song[]; loading: boolean; error: string | null } = {
  currentSong: null,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  isRepeating: false,
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  equalizer: {
    bass: 0,
    mid: 0,
    treble: 0,
    enabled: true
  },
  songs: mockSongs, // Initialize with all mock songs including new ones
  loading: false,
  error: null
};

const musicReducer = (state: typeof initialState, action: MusicAction): typeof initialState => {
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
    case 'SET_QUEUE':
      return { 
        ...state, 
        queue: action.payload.songs,
        currentIndex: Math.max(0, Math.min(action.payload.songs.length - 1, action.payload.startIndex || 0))
      };
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.payload] };
    case 'REMOVE_FROM_QUEUE':
      const newQueue = state.queue.filter((_, index) => index !== action.payload);
      const newIndex = action.payload < state.currentIndex ? state.currentIndex - 1 : state.currentIndex;
      return { 
        ...state, 
        queue: newQueue,
        currentIndex: Math.max(0, Math.min(newQueue.length - 1, newIndex))
      };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: Math.max(0, Math.min(state.queue.length - 1, action.payload)) };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };
    case 'TOGGLE_REPEAT':
      return { ...state, isRepeating: !state.isRepeating };
    case 'SET_SONGS':
      // Ensure we don't lose existing songs when adding new ones
      const existingIds = new Set(state.songs.map(s => s.id));
      const newSongs = action.payload.filter(s => !existingIds.has(s.id));
      return { ...state, songs: [...state.songs, ...newSongs] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EQUALIZER':
      return { ...state, equalizer: action.payload };
    case 'SET_CROSSFADE':
      return { 
        ...state, 
        crossfadeEnabled: action.payload.enabled,
        crossfadeDuration: Math.max(0, Math.min(12, action.payload.duration))
      };
    default:
      return state;
  }
};

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Stable callback refs to prevent memory leaks
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
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const handleError = useCallback((event: Event) => {
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
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const handleEnded = useCallback(() => {
    if (state.isRepeating) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('Error replaying audio:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to replay audio' });
        });
      }
    } else {
      nextSong();
    }
  }, [state.isRepeating]);

  // Set up audio event listeners with proper cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = state.volume;
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.volume, handleTimeUpdate, handleDurationChange, handleLoadStart, handleCanPlay, handleError, handleEnded]);

  const play = useCallback(async (song?: Song): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // Wait for any pending play promise to resolve
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }

      if (song) {
        dispatch({ type: 'SET_CURRENT_SONG', payload: song });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        // Try to get from IndexedDB first
        try {
          const cachedBlob = await db.getAudioBlob(song.id);
          if (cachedBlob) {
            const url = URL.createObjectURL(cachedBlob);
            audio.src = url;
          } else {
            audio.src = song.filePath;
          }
        } catch (error) {
          console.warn('Failed to load from cache:', error);
          audio.src = song.filePath;
        }
        
        // Add to recently played
        try {
          await db.addToRecentlyPlayed(song);
        } catch (error) {
          console.warn('Failed to add to recently played:', error);
        }
      }

      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      dispatch({ type: 'SET_PLAYING', payload: true });
    } catch (error) {
      console.error('Error playing audio:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio' });
      dispatch({ type: 'SET_PLAYING', payload: false });
    } finally {
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
      } else if (state.queue.length > 0) {
        play(state.queue[state.currentIndex]);
      }
    }
  }, [state.isPlaying, state.currentSong, state.queue, state.currentIndex, play, pause]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampedVolume;
      dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && !isNaN(time) && time >= 0 && time <= audio.duration) {
      audio.currentTime = time;
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }
  }, []);

  const nextSong = useCallback(() => {
    if (state.queue.length === 0) return;
    
    let nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.queue.length) {
      nextIndex = 0;
    }
    
    dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
    play(state.queue[nextIndex]);
  }, [state.queue, state.currentIndex, play]);

  const prevSong = useCallback(() => {
    if (state.queue.length === 0) return;
    
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.queue.length - 1;
    }
    
    dispatch({ type: 'SET_CURRENT_INDEX', payload: prevIndex });
    play(state.queue[prevIndex]);
  }, [state.queue, state.currentIndex, play]);

  const addToQueue = useCallback((song: Song) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: song });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    if (index >= 0 && index < state.queue.length) {
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index });
    }
  }, [state.queue.length]);

  const setQueue = useCallback((songs: Song[], startIndex = 0) => {
    dispatch({ type: 'SET_QUEUE', payload: { songs, startIndex } });
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

  const setSongs = useCallback((songs: Song[]) => {
    dispatch({ type: 'SET_SONGS', payload: songs });
  }, []);

  const setEqualizer = useCallback((equalizer: PlaybackState['equalizer']) => {
    dispatch({ type: 'SET_EQUALIZER', payload: equalizer });
  }, []);

  const setCrossfade = useCallback((enabled: boolean, duration: number) => {
    dispatch({ type: 'SET_CROSSFADE', payload: { enabled, duration } });
  }, []);

  return (
    <MusicContext.Provider value={{
      ...state,
      audioRef,
      play,
      pause,
      togglePlay,
      setVolume,
      seek,
      nextSong,
      prevSong,
      addToQueue,
      removeFromQueue,
      setQueue,
      toggleShuffle,
      toggleRepeat,
      updateCurrentTime,
      updateDuration,
      setSongs,
      setEqualizer,
      setCrossfade
    }}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};