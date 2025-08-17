/**
 * UI State Management with Redux Toolkit
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Modal {
  id: string;
  type: string;
  props?: any;
  isOpen: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UIState {
  // Layout
  sidebarCollapsed: boolean;
  playerBarVisible: boolean;
  queueVisible: boolean;
  lyricsVisible: boolean;
  visualizerVisible: boolean;
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Modals and overlays
  modals: Modal[];
  toasts: Toast[];
  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    items: Array<{
      label: string;
      icon?: string;
      onClick: () => void;
      disabled?: boolean;
      separator?: boolean;
    }>;
  } | null;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Search
  searchFocused: boolean;
  searchHistory: string[];
  
  // Player
  playerExpanded: boolean;
  equalizerOpen: boolean;
  volumeSliderVisible: boolean;
  
  // Navigation
  currentView: string;
  navigationHistory: string[];
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  
  // Performance
  virtualScrolling: boolean;
  imageOptimization: boolean;
  
  // Notifications
  notificationsEnabled: boolean;
  notificationPermission: 'default' | 'granted' | 'denied';
}

const initialState: UIState = {
  sidebarCollapsed: false,
  playerBarVisible: false,
  queueVisible: false,
  lyricsVisible: false,
  visualizerVisible: false,
  
  theme: 'dark',
  accentColor: '#8b5cf6',
  fontSize: 'medium',
  compactMode: false,
  
  modals: [],
  toasts: [],
  contextMenu: null,
  
  globalLoading: false,
  loadingStates: {},
  
  searchFocused: false,
  searchHistory: [],
  
  playerExpanded: false,
  equalizerOpen: false,
  volumeSliderVisible: false,
  
  currentView: 'home',
  navigationHistory: [],
  
  reducedMotion: false,
  highContrast: false,
  screenReaderMode: false,
  
  virtualScrolling: true,
  imageOptimization: true,
  
  notificationsEnabled: false,
  notificationPermission: 'default',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    setPlayerBarVisible: (state, action: PayloadAction<boolean>) => {
      state.playerBarVisible = action.payload;
    },
    
    toggleQueue: (state) => {
      state.queueVisible = !state.queueVisible;
    },
    
    toggleLyrics: (state) => {
      state.lyricsVisible = !state.lyricsVisible;
    },
    
    toggleVisualizer: (state) => {
      state.visualizerVisible = !state.visualizerVisible;
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
    
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
    
    // Modals
    openModal: (state, action: PayloadAction<{ type: string; props?: any }>) => {
      const { type, props } = action.payload;
      const modal: Modal = {
        id: `${type}-${Date.now()}`,
        type,
        props,
        isOpen: true,
      };
      state.modals.push(modal);
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      state.modals = state.modals.filter(modal => modal.id !== modalId);
    },
    
    closeAllModals: (state) => {
      state.modals = [];
    },
    
    // Toasts
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      const toastId = action.payload;
      state.toasts = state.toasts.filter(toast => toast.id !== toastId);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // Context menu
    openContextMenu: (state, action: PayloadAction<{
      x: number;
      y: number;
      items: UIState['contextMenu']['items'];
    }>) => {
      state.contextMenu = {
        isOpen: true,
        ...action.payload,
      };
    },
    
    closeContextMenu: (state) => {
      state.contextMenu = null;
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    
    setLoadingState: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loadingStates[key] = true;
      } else {
        delete state.loadingStates[key];
      }
    },
    
    // Search
    setSearchFocused: (state, action: PayloadAction<boolean>) => {
      state.searchFocused = action.payload;
    },
    
    addToSearchHistory: (state, action: PayloadAction<string>) => {
      const query = action.payload;
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory.unshift(query);
        state.searchHistory = state.searchHistory.slice(0, 20);
      }
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    // Player
    togglePlayerExpanded: (state) => {
      state.playerExpanded = !state.playerExpanded;
    },
    
    toggleEqualizer: (state) => {
      state.equalizerOpen = !state.equalizerOpen;
    },
    
    setVolumeSliderVisible: (state, action: PayloadAction<boolean>) => {
      state.volumeSliderVisible = action.payload;
    },
    
    // Navigation
    setCurrentView: (state, action: PayloadAction<string>) => {
      if (state.currentView !== action.payload) {
        state.navigationHistory.push(state.currentView);
        state.navigationHistory = state.navigationHistory.slice(-10); // Keep last 10
        state.currentView = action.payload;
      }
    },
    
    navigateBack: (state) => {
      if (state.navigationHistory.length > 0) {
        state.currentView = state.navigationHistory.pop()!;
      }
    },
    
    // Accessibility
    setReducedMotion: (state, action: PayloadAction<boolean>) => {
      state.reducedMotion = action.payload;
    },
    
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload;
    },
    
    setScreenReaderMode: (state, action: PayloadAction<boolean>) => {
      state.screenReaderMode = action.payload;
    },
    
    // Performance
    setVirtualScrolling: (state, action: PayloadAction<boolean>) => {
      state.virtualScrolling = action.payload;
    },
    
    setImageOptimization: (state, action: PayloadAction<boolean>) => {
      state.imageOptimization = action.payload;
    },
    
    // Notifications
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    
    setNotificationPermission: (state, action: PayloadAction<'default' | 'granted' | 'denied'>) => {
      state.notificationPermission = action.payload;
    },
    
    // Bulk updates
    updateUISettings: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },
    
    resetUI: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setPlayerBarVisible,
  toggleQueue,
  toggleLyrics,
  toggleVisualizer,
  setTheme,
  setAccentColor,
  setFontSize,
  toggleCompactMode,
  openModal,
  closeModal,
  closeAllModals,
  addToast,
  removeToast,
  clearToasts,
  openContextMenu,
  closeContextMenu,
  setGlobalLoading,
  setLoadingState,
  setSearchFocused,
  addToSearchHistory,
  clearSearchHistory,
  togglePlayerExpanded,
  toggleEqualizer,
  setVolumeSliderVisible,
  setCurrentView,
  navigateBack,
  setReducedMotion,
  setHighContrast,
  setScreenReaderMode,
  setVirtualScrolling,
  setImageOptimization,
  setNotificationsEnabled,
  setNotificationPermission,
  updateUISettings,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
