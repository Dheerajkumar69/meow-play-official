/**
 * Analytics State Management with Redux Toolkit
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsEvent {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface UserSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  songsPlayed: number;
  interactions: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    screenResolution: string;
  };
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  currentSession: UserSession | null;
  metrics: {
    totalPlayTime: number;
    songsPlayed: number;
    skippedSongs: number;
    likedSongs: number;
    playlistsCreated: number;
    searchQueries: number;
    uniqueArtists: Set<string>;
    favoriteGenres: Record<string, number>;
    peakListeningHours: Record<number, number>;
    averageSessionDuration: number;
    retentionRate: number;
  };
  realTimeStats: {
    activeUsers: number;
    currentlyPlaying: number;
    topSongs: Array<{ songId: string; playCount: number }>;
    trendingGenres: string[];
  };
  conversionFunnel: {
    visitors: number;
    signups: number;
    firstPlay: number;
    premiumUpgrades: number;
  };
  performanceMetrics: {
    pageLoadTime: number;
    audioLoadTime: number;
    searchResponseTime: number;
    errorRate: number;
  };
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
}

const initialState: AnalyticsState = {
  events: [],
  currentSession: null,
  metrics: {
    totalPlayTime: 0,
    songsPlayed: 0,
    skippedSongs: 0,
    likedSongs: 0,
    playlistsCreated: 0,
    searchQueries: 0,
    uniqueArtists: new Set(),
    favoriteGenres: {},
    peakListeningHours: {},
    averageSessionDuration: 0,
    retentionRate: 0,
  },
  realTimeStats: {
    activeUsers: 0,
    currentlyPlaying: 0,
    topSongs: [],
    trendingGenres: [],
  },
  conversionFunnel: {
    visitors: 0,
    signups: 0,
    firstPlay: 0,
    premiumUpgrades: 0,
  },
  performanceMetrics: {
    pageLoadTime: 0,
    audioLoadTime: 0,
    searchResponseTime: 0,
    errorRate: 0,
  },
  enabled: true,
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    trackEvent: (state, action: PayloadAction<{ type: string; data: any; userId?: string }>) => {
      if (!state.enabled) return;
      
      const { type, data, userId } = action.payload;
      const event: AnalyticsEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        type,
        data,
        timestamp: Date.now(),
        sessionId: state.currentSession?.id || 'no-session',
        userId,
      };
      
      state.events.push(event);
      
      // Update metrics based on event type
      switch (type) {
        case 'song_played':
          state.metrics.songsPlayed++;
          state.metrics.uniqueArtists.add(data.artist);
          if (data.genre) {
            state.metrics.favoriteGenres[data.genre] = (state.metrics.favoriteGenres[data.genre] || 0) + 1;
          }
          break;
        case 'song_skipped':
          state.metrics.skippedSongs++;
          break;
        case 'song_liked':
          state.metrics.likedSongs++;
          break;
        case 'playlist_created':
          state.metrics.playlistsCreated++;
          break;
        case 'search_performed':
          state.metrics.searchQueries++;
          break;
      }
      
      // Track peak listening hours
      const hour = new Date().getHours();
      if (type === 'song_played') {
        state.metrics.peakListeningHours[hour] = (state.metrics.peakListeningHours[hour] || 0) + 1;
      }
    },

    startSession: (state, action: PayloadAction<{ userId?: string }>) => {
      const { userId } = action.payload;
      const sessionId = `session-${Date.now()}-${Math.random()}`;
      
      state.currentSession = {
        id: sessionId,
        startTime: Date.now(),
        duration: 0,
        songsPlayed: 0,
        interactions: 0,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          screenResolution: `${screen.width}x${screen.height}`,
        },
      };
      
      // Track session start
      state.events.push({
        id: `session-start-${Date.now()}`,
        type: 'session_started',
        data: { userId, deviceInfo: state.currentSession.deviceInfo },
        timestamp: Date.now(),
        sessionId,
        userId,
      });
    },

    endSession: (state) => {
      if (state.currentSession) {
        const endTime = Date.now();
        state.currentSession.endTime = endTime;
        state.currentSession.duration = endTime - state.currentSession.startTime;
        
        // Track session end
        state.events.push({
          id: `session-end-${Date.now()}`,
          type: 'session_ended',
          data: {
            duration: state.currentSession.duration,
            songsPlayed: state.currentSession.songsPlayed,
            interactions: state.currentSession.interactions,
          },
          timestamp: endTime,
          sessionId: state.currentSession.id,
        });
        
        // Update average session duration
        const totalSessions = state.events.filter(e => e.type === 'session_ended').length;
        const totalDuration = state.events
          .filter(e => e.type === 'session_ended')
          .reduce((sum, e) => sum + e.data.duration, 0);
        state.metrics.averageSessionDuration = totalDuration / totalSessions;
        
        state.currentSession = null;
      }
    },

    updateSessionActivity: (state) => {
      if (state.currentSession) {
        state.currentSession.interactions++;
        state.currentSession.duration = Date.now() - state.currentSession.startTime;
      }
    },

    trackPlayTime: (state, action: PayloadAction<number>) => {
      const seconds = action.payload;
      state.metrics.totalPlayTime += seconds;
      
      if (state.currentSession) {
        state.currentSession.duration = Date.now() - state.currentSession.startTime;
      }
    },

    trackPerformanceMetric: (state, action: PayloadAction<{
      type: 'pageLoad' | 'audioLoad' | 'searchResponse' | 'error';
      value: number;
    }>) => {
      const { type, value } = action.payload;
      
      switch (type) {
        case 'pageLoad':
          state.performanceMetrics.pageLoadTime = value;
          break;
        case 'audioLoad':
          state.performanceMetrics.audioLoadTime = value;
          break;
        case 'searchResponse':
          state.performanceMetrics.searchResponseTime = value;
          break;
        case 'error':
          state.performanceMetrics.errorRate = value;
          break;
      }
    },

    updateRealTimeStats: (state, action: PayloadAction<Partial<AnalyticsState['realTimeStats']>>) => {
      state.realTimeStats = { ...state.realTimeStats, ...action.payload };
    },

    updateConversionFunnel: (state, action: PayloadAction<{
      step: 'visitors' | 'signups' | 'firstPlay' | 'premiumUpgrades';
      increment?: number;
    }>) => {
      const { step, increment = 1 } = action.payload;
      state.conversionFunnel[step] += increment;
    },

    clearEvents: (state) => {
      state.events = [];
    },

    setAnalyticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },

    setBatchSize: (state, action: PayloadAction<number>) => {
      state.batchSize = action.payload;
    },

    setFlushInterval: (state, action: PayloadAction<number>) => {
      state.flushInterval = action.payload;
    },

    // A/B Testing integration
    trackExperiment: (state, action: PayloadAction<{
      experimentId: string;
      variant: string;
      userId?: string;
    }>) => {
      const { experimentId, variant, userId } = action.payload;
      
      state.events.push({
        id: `experiment-${Date.now()}-${Math.random()}`,
        type: 'experiment_exposure',
        data: { experimentId, variant },
        timestamp: Date.now(),
        sessionId: state.currentSession?.id || 'no-session',
        userId,
      });
    },

    trackConversion: (state, action: PayloadAction<{
      experimentId: string;
      variant: string;
      conversionType: string;
      value?: number;
      userId?: string;
    }>) => {
      const { experimentId, variant, conversionType, value, userId } = action.payload;
      
      state.events.push({
        id: `conversion-${Date.now()}-${Math.random()}`,
        type: 'experiment_conversion',
        data: { experimentId, variant, conversionType, value },
        timestamp: Date.now(),
        sessionId: state.currentSession?.id || 'no-session',
        userId,
      });
    },

    // User journey tracking
    trackUserJourney: (state, action: PayloadAction<{
      step: string;
      data?: any;
      userId?: string;
    }>) => {
      const { step, data, userId } = action.payload;
      
      state.events.push({
        id: `journey-${Date.now()}-${Math.random()}`,
        type: 'user_journey',
        data: { step, ...data },
        timestamp: Date.now(),
        sessionId: state.currentSession?.id || 'no-session',
        userId,
      });
    },

    // Cohort analysis
    trackCohortEvent: (state, action: PayloadAction<{
      cohortId: string;
      eventType: string;
      data?: any;
      userId?: string;
    }>) => {
      const { cohortId, eventType, data, userId } = action.payload;
      
      state.events.push({
        id: `cohort-${Date.now()}-${Math.random()}`,
        type: 'cohort_event',
        data: { cohortId, eventType, ...data },
        timestamp: Date.now(),
        sessionId: state.currentSession?.id || 'no-session',
        userId,
      });
    },

    // Reset analytics data
    resetAnalytics: (state) => {
      state.events = [];
      state.metrics = initialState.metrics;
      state.realTimeStats = initialState.realTimeStats;
      state.conversionFunnel = initialState.conversionFunnel;
      state.performanceMetrics = initialState.performanceMetrics;
    },
  },
});

export const {
  trackEvent,
  startSession,
  endSession,
  updateSessionActivity,
  trackPlayTime,
  trackPerformanceMetric,
  updateRealTimeStats,
  updateConversionFunnel,
  clearEvents,
  setAnalyticsEnabled,
  setBatchSize,
  setFlushInterval,
  trackExperiment,
  trackConversion,
  trackUserJourney,
  trackCohortEvent,
  resetAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
