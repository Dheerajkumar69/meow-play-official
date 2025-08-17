import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode, useRef } from 'react';
import { Song, Repeat } from '../types';
import { usePlayback } from './PlaybackContext';
import { PlayerService } from '../services/PlayerService';
import { errorService } from '../services/ErrorService';

export interface QueueState {
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  repeat: Repeat;
  history: Song[];
  loading: boolean;
  error: string | null;
}

export interface QueueContextType extends QueueState {
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: Song, position?: 'next' | 'end') => void;
  removeFromQueue: (index: number) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentIndex: (index: number) => void;
  getNextIndex: () => number | null;
  getCurrentSong: () => Song | null;
  getUpcomingSongs: (count: number) => Song[];
  clearQueue: () => void;
  clearError: () => void;
}

type QueueAction = 
  | { type: 'SET_QUEUE'; payload: { songs: Song[]; startIndex?: number } }
  | { type: 'ADD_TO_QUEUE'; payload: { song: Song; position?: 'next' | 'end' } }
  | { type: 'REMOVE_FROM_QUEUE'; payload: number }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TO_HISTORY'; payload: Song };

const initialState: QueueState = {
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  repeat: 'none' as Repeat,
  history: [],
  loading: false,
  error: null
};

const queueReducer = (state: QueueState, action: QueueAction): QueueState => {
  try {
    switch (action.type) {
      case 'SET_QUEUE':
        return { 
          ...state, 
          queue: action.payload.songs,
          currentIndex: Math.max(0, Math.min(action.payload.songs.length - 1, action.payload.startIndex || 0)),
          error: null
        };
      case 'ADD_TO_QUEUE': {
        const { song, position = 'end' } = action.payload;
        const newQueue = [...state.queue];
        
        if (position === 'next') {
          newQueue.splice(state.currentIndex + 1, 0, song);
        } else {
          newQueue.push(song);
        }
        
        return { ...state, queue: newQueue, error: null };
      }
      case 'REMOVE_FROM_QUEUE': {
        const index = action.payload;
        if (index < 0 || index >= state.queue.length) {
          return { ...state, error: 'Invalid queue index' };
        }
        
        const newQueue = state.queue.filter((_, i) => i !== index);
        let newIndex = state.currentIndex;
        
        if (index < state.currentIndex) {
          newIndex = Math.max(0, state.currentIndex - 1);
        } else if (index === state.currentIndex) {
          newIndex = Math.min(state.currentIndex, newQueue.length - 1);
        }
        
        return { 
          ...state, 
          queue: newQueue,
          currentIndex: Math.max(0, newIndex),
          error: null
        };
      }
      case 'SET_CURRENT_INDEX': {
        const newIndex = Math.max(0, Math.min(state.queue.length - 1, action.payload));
        const currentSong = state.queue[state.currentIndex];
        const newHistory = currentSong && newIndex !== state.currentIndex
          ? [...state.history.slice(-19), currentSong]
          : state.history;
        
        return { 
          ...state, 
          currentIndex: newIndex,
          history: newHistory,
          error: null
        };
      }
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
      case 'CLEAR_QUEUE':
        return { 
          ...state, 
          queue: [], 
          currentIndex: 0, 
          history: [], 
          error: null 
        };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload, loading: false };
      case 'CLEAR_ERROR':
        return { ...state, error: null };
      case 'ADD_TO_HISTORY':
        return {
          ...state,
          history: [...state.history.slice(-19), action.payload]
        };
      default:
        return state;
    }
  } catch (error) {
    return { ...state, error: 'Queue operation failed', loading: false };
  }
};

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(queueReducer, initialState);
  const { play } = usePlayback();

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
      // Handle end of queue - this could pause playback or do nothing
      return;
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

  // Queue management functions with error handling
  const addToQueue = useCallback((song: Song, position: 'next' | 'end' = 'end') => {
    try {
      dispatch({ type: 'ADD_TO_QUEUE', payload: { song, position } });
      
      const positionText = position === 'next' ? 'next in queue' : 'end of queue';
      errorService.showSuccess(`"${song.title}" added to ${positionText}`, { duration: 3000 });
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.addToQueue');
      errorService.showError('Failed to add song to queue', { duration: 5000 });
    }
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    try {
      if (index < 0 || index >= state.queue.length) {
        throw new Error('Invalid queue index');
      }
      
      const song = state.queue[index];
      dispatch({ type: 'REMOVE_FROM_QUEUE', payload: index });
      
      if (song) {
        errorService.showInfo(`"${song.title}" removed from queue`, { duration: 3000 });
      }
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.removeFromQueue');
      errorService.showError('Failed to remove song from queue', { duration: 5000 });
    }
  }, [state.queue]);

  const setQueue = useCallback((songs: Song[], startIndex = 0) => {
    try {
      if (!Array.isArray(songs)) {
        throw new Error('Invalid songs array');
      }
      dispatch({ type: 'SET_QUEUE', payload: { songs, startIndex } });
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.setQueue');
      errorService.showError('Failed to set queue', { duration: 5000 });
    }
  }, []);

  const clearQueue = useCallback(() => {
    try {
      dispatch({ type: 'CLEAR_QUEUE' });
      errorService.showInfo('Queue cleared', { duration: 2000 });
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.clearQueue');
      errorService.showError('Failed to clear queue', { duration: 5000 });
    }
  }, []);

  const getCurrentSong = useCallback((): Song | null => {
    try {
      return state.queue[state.currentIndex] || null;
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.getCurrentSong');
      return null;
    }
  }, [state.queue, state.currentIndex]);

  const getUpcomingSongs = useCallback((count: number): Song[] => {
    try {
      const upcoming: Song[] = [];
      let index = state.currentIndex + 1;
      
      for (let i = 0; i < count && i < state.queue.length; i++) {
        if (index >= state.queue.length) {
          if (state.repeat === 'all') {
            index = 0;
          } else {
            break;
          }
        }
        
        if (state.queue[index]) {
          upcoming.push(state.queue[index]);
        }
        
        index++;
      }
      
      return upcoming;
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.getUpcomingSongs');
      return [];
    }
  }, [state.queue, state.currentIndex, state.repeat]);

  const setCurrentIndex = useCallback((index: number) => {
    try {
      if (index < 0 || index >= state.queue.length) {
        throw new Error('Invalid queue index');
      }
      dispatch({ type: 'SET_CURRENT_INDEX', payload: index });
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.setCurrentIndex');
      errorService.showError('Failed to jump to song', { duration: 5000 });
    }
  }, [state.queue.length]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Playback control functions with user feedback
  const toggleShuffle = useCallback(() => {
    try {
      dispatch({ type: 'TOGGLE_SHUFFLE' });
      const newState = !state.isShuffled;
      errorService.showInfo(
        `Shuffle ${newState ? 'enabled' : 'disabled'}`, 
        { duration: 2000 }
      );
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.toggleShuffle');
      errorService.showError('Failed to toggle shuffle', { duration: 5000 });
    }
  }, [state.isShuffled]);

  const toggleRepeat = useCallback(() => {
    try {
      dispatch({ type: 'TOGGLE_REPEAT' });
      const nextRepeat = state.repeat === 'none' 
        ? 'one' 
        : state.repeat === 'one' 
        ? 'all' 
        : 'none';
      
      const repeatText = nextRepeat === 'none' 
        ? 'off' 
        : nextRepeat === 'one' 
        ? 'current song' 
        : 'all songs';
      
      errorService.showInfo(
        `Repeat: ${repeatText}`, 
        { duration: 2000 }
      );
    } catch (error) {
      errorService.logUIError(error as Error, 'QueueContext.toggleRepeat');
      errorService.showError('Failed to toggle repeat', { duration: 5000 });
    }
  }, [state.repeat]);

  // Handle song end events
  useEffect(() => {
    const playerService = PlayerService.getInstance();
    
    const handleEnded = () => {
      if (state.repeat === 'one') {
        // Repeat current song - handled by PlayerService
        return;
      } else {
        if (state.repeat === 'all' || state.isShuffled) {
          nextSong();
        } else if (state.currentIndex < state.queue.length - 1) {
          nextSong();
        } else {
          // End of queue - playback will pause naturally
        }
      }
    };

    playerService.addEventListener('ended', handleEnded);

    return () => {
      playerService.removeEventListener('ended', handleEnded);
    };
  }, [state.repeat, state.isShuffled, state.currentIndex, state.queue.length, nextSong]);

  return (
    <QueueContext.Provider value={{
      ...state,
      nextSong,
      prevSong,
      addToQueue,
      removeFromQueue,
      setQueue,
      clearQueue,
      toggleShuffle,
      toggleRepeat,
      setCurrentIndex,
      getNextIndex,
      getCurrentSong,
      getUpcomingSongs,
      clearError
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
