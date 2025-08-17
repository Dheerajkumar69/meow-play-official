/**
 * Advanced Redux Toolkit store configuration
 */
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createListenerMiddleware } from '@reduxjs/toolkit';

// Slices
import musicSlice from './slices/musicSlice';
import userSlice from './slices/userSlice';
import playlistSlice from './slices/playlistSlice';
import queueSlice from './slices/queueSlice';
import uiSlice from './slices/uiSlice';
import offlineSlice from './slices/offlineSlice';
import analyticsSlice from './slices/analyticsSlice';

// Middleware
import { analyticsMiddleware } from './middleware/analyticsMiddleware';
import { offlineMiddleware } from './middleware/offlineMiddleware';
import { performanceMiddleware } from './middleware/performanceMiddleware';

// Create listener middleware for side effects
export const listenerMiddleware = createListenerMiddleware();

// Persist configuration
const persistConfig = {
  key: 'meow-play-root',
  storage,
  whitelist: ['user', 'playlists', 'queue', 'ui', 'offline'], // Only persist these slices
  blacklist: ['music', 'analytics'], // Don't persist these (real-time data)
};

// Root reducer
const rootReducer = combineReducers({
  music: musicSlice,
  user: userSlice,
  playlists: playlistSlice,
  queue: queueSlice,
  ui: uiSlice,
  offline: offlineSlice,
  analytics: analyticsSlice,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    })
    .prepend(listenerMiddleware.middleware)
    .concat(analyticsMiddleware, offlineMiddleware, performanceMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
