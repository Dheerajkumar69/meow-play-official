import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback, ReactNode } from 'react';
import { PlaybackState, Song, Repeat } from '../types';
import { db } from '../utils/indexedDB';
import { mockSongs } from '../utils/mockData';
import { sharedDatabase } from '../utils/sharedDatabase';
import { PlayerManager } from '../utils/playerManager';
import { CacheManager } from '../utils/cacheManager';
import { ApiService } from '../services/api';

export interface MusicContextType extends PlaybackState {
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
  refreshSongs: () => void;
  toggleLike: (songId: string) => void;
  addToPlaylist: (songId: string, playlistId: string) => void;
  isRepeating: boolean;
}

export const MusicContext = createContext<MusicContextType | undefined>(undefined);

// MusicAction type is defined below

const initialState: PlaybackState & { songs: Song[]; loading: boolean; error: string | null } = {
  currentSong: null,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  repeat: 'none' as Repeat,
  crossfadeEnabled: false,
  crossfadeDuration: 3,
  equalizer: {
    bass: 0,
    mid: 0,
    treble: 0,
    enabled: true
  },
  songs: mockSongs,
  loading: false,
  error: null
};

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
  | { type: 'SET_CROSSFADE'; payload: { enabled: boolean; duration: number } }
  | { type: 'REFRESH_SONGS' }
  | { type: 'TOGGLE_LIKE'; payload: string };

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
    case 'TOGGLE_LIKE': {
      // Update the song in the songs array
      const updatedSongs = state.songs.map(song => {
        if (song.id === action.payload) {
          return { ...song, liked: !song.liked };
        }
        return song;
      });
      
      // Update the current song if it's the one being liked/unliked
      const updatedCurrentSong = state.currentSong && state.currentSong.id === action.payload
        ? { ...state.currentSong, liked: !state.currentSong.liked }
        : state.currentSong;
      
      // Update the queue if it contains the song being liked/unliked
      const updatedQueue = state.queue.map(song => {
        if (song.id === action.payload) {
          return { ...song, liked: !song.liked };
        }
        return song;
      });
      
      return { 
        ...state, 
        songs: updatedSongs,
        currentSong: updatedCurrentSong,
        queue: updatedQueue
      };
    }
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter((_, index) => index !== action.payload);
      const newIndex = action.payload < state.currentIndex ? state.currentIndex - 1 : state.currentIndex;
      return { 
        ...state, 
        queue: newQueue,
        currentIndex: Math.max(0, Math.min(newQueue.length - 1, newIndex))
      };
    }
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: Math.max(0, Math.min(state.queue.length - 1, action.payload)) };
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
    case 'SET_SONGS': {
      const existingIds = new Set(state.songs.map(s => s.id));
      const newSongs = action.payload.filter(s => !existingIds.has(s.id));
      return { ...state, songs: [...state.songs, ...newSongs] };
    }
    case 'REFRESH_SONGS': {
      const sharedSongs = sharedDatabase.getSharedSongs();
      const localSongs = state.songs.filter(s => s.uploadedBy !== 'community');
      const communityIds = new Set(localSongs.map(s => s.id));
      const newCommunity = sharedSongs.filter(s => !communityIds.has(s.id));
      return { ...state, songs: [...localSongs, ...newCommunity] };
    }
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
  const playerManagerRef = useRef<PlayerManager | null>(null);
  const cacheManagerRef = useRef<CacheManager | null>(null);

  // Core playback functions
  const play = useCallback(async (song?: Song): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }

      if (song) {
        dispatch({ type: 'SET_CURRENT_SONG', payload: song });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        const cachedSong = await cacheManagerRef.current?.get(song.id);
        if (cachedSong) {
          audio.src = cachedSong.filePath;
        } else if (song.uploadedBy === 'community' && song.filePath.startsWith('data:audio/')) {
          audio.src = song.filePath;
          void cacheManagerRef.current?.set(song.id, song);
        } else {
          audio.src = song.filePath;
          if (song.id) {
            void cacheManagerRef.current?.set(song.id, song);
          }
        }
        
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
        void play();
      } else if (state.queue.length > 0) {
        void play(state.queue[state.currentIndex]);
      }
    }
  }, [state.isPlaying, state.currentSong, state.queue, state.currentIndex, play, pause]);

  // Navigation functions
  const getNextIndex = useCallback(() => {
    if (state.isShuffled) {
      const availableIndexes = [...Array(state.queue.length).keys()].filter(i => i !== state.currentIndex);
      if (availableIndexes.length === 0) return null;
      return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    } else {
      const nextIndex = state.currentIndex + 1;
      return nextIndex < state.queue.length ? nextIndex : (state.repeat === 'all' ? 0 : null);
    }
  }, [state.isShuffled, state.currentIndex, state.queue.length, state.repeat]);

  const nextSong = useCallback(() => {
    const nextIndex = getNextIndex();
    if (nextIndex === null) {
      dispatch({ type: 'SET_PLAYING', payload: false });
    } else {
      dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
      const nextSong = state.queue[nextIndex];
      if (nextSong) {
        void play(nextSong);
      }
    }
  }, [getNextIndex, state.queue, play]);

  const prevSong = useCallback(() => {
    if (state.queue.length === 0) return;
    
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = state.queue.length - 1;
    }
    
    dispatch({ type: 'SET_CURRENT_INDEX', payload: prevIndex });
    void play(state.queue[prevIndex]);
  }, [state.queue, state.currentIndex, play]);

  // Queue management functions
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

  // Playback control functions
  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  }, []);

  const toggleRepeat = useCallback(() => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  }, []);

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
    if (state.repeat === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
      }
    } else {
      if (state.repeat === 'all' || state.isShuffled) {
        void nextSong();
      } else if (state.currentIndex < state.queue.length - 1) {
        void nextSong();
      } else {
        dispatch({ type: 'SET_PLAYING', payload: false });
      }
    }
  }, [state.repeat, state.isShuffled, state.currentIndex, state.queue.length, nextSong]);

  // State update functions
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

  // Audio effects functions
  const setEqualizer = useCallback((equalizer: PlaybackState['equalizer']) => {
    dispatch({ type: 'SET_EQUALIZER', payload: equalizer });
  }, []);

  const setCrossfade = useCallback((enabled: boolean, duration: number) => {
    dispatch({ type: 'SET_CROSSFADE', payload: { enabled, duration } });
  }, []);

  // Song management functions
  const refreshSongs = useCallback(() => {
    try {
      const sharedSongs = sharedDatabase.getSharedSongs();
      const localSongs = state.songs.filter(s => s.uploadedBy !== 'community');
      const existingIds = new Set(localSongs.map(s => s.id));
      const newCommunity = sharedSongs.filter(s => !existingIds.has(s.id));
      
      if (newCommunity.length > 0) {
        setSongs([...localSongs, ...newCommunity]);
      }
    } catch (error) {
      console.error('Failed to refresh songs:', error);
    }
  }, [state.songs, setSongs]);

  const toggleLike = useCallback(async (songId: string) => {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    
    // Update state immediately for responsive UI
    dispatch({ type: 'TOGGLE_LIKE', payload: songId });
    
    try {
      // Update local database
      await db.songs.update(songId, { liked: !song.liked });
      
      // If we have a user and Supabase is configured, update the backend
      const authContext = window.localStorage.getItem('meow_play_auth');
      if (authContext) {
        const auth = JSON.parse(authContext);
        const userId = auth?.user?.id;
        
        if (userId) {
          const api = ApiService.getInstance();
          if (!song.liked) {
            await api.likeSong(userId, songId);
          } else {
            await api.unlikeSong(userId, songId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle like status:', error);
      // Revert the state change if the operation failed
      dispatch({ type: 'TOGGLE_LIKE', payload: songId });
    }
  }, [state.songs]);

  const addToPlaylist = useCallback((songId: string, playlistId: string) => {
    // Implementation would go here, using the db helper
    console.log('Adding song to playlist:', songId, playlistId);
  }, []);

  // Setup effects
  useEffect(() => {
    playerManagerRef.current = new PlayerManager();
    cacheManagerRef.current = new CacheManager();
    return () => {
      playerManagerRef.current?.cleanup();
      playerManagerRef.current = null;
      cacheManagerRef.current?.destroy();
      cacheManagerRef.current = null;
    };
  }, []);

  // Volume effect
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = state.volume;
    }
  }, [state.volume]);

  // Audio event binding effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
  }, [handleTimeUpdate, handleDurationChange, handleLoadStart, handleCanPlay, handleError, handleEnded]);

  // Auto-refresh community songs effect
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSongs();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshSongs]);

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
      setCrossfade,
      refreshSongs,
      toggleLike,
      addToPlaylist,
      isRepeating: state.repeat !== 'none'
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
