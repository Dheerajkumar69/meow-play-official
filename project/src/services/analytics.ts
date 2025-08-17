/**
 * Advanced analytics service for user behavior tracking
 */
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
  page?: string;
  userAgent?: string;
}

interface UserProperties {
  userId: string;
  email?: string;
  plan?: 'free' | 'premium';
  registrationDate?: string;
  lastActiveDate?: string;
  totalSongs?: number;
  totalPlaylists?: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId?: string;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private userProperties: Partial<UserProperties> = {};

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics
   */
  init(config: { apiKey?: string; userId?: string; debug?: boolean }): void {
    if (this.isInitialized) return;

    this.userId = config.userId;
    this.isInitialized = true;

    // Track page views automatically
    this.setupPageTracking();
    
    // Track user engagement
    this.setupEngagementTracking();
    
    // Process queued events
    this.processEventQueue();

    if (config.debug) {
      console.log('Analytics initialized', { sessionId: this.sessionId });
    }
  }

  /**
   * Track custom event
   */
  track(event: string, properties?: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };

    if (this.isInitialized) {
      this.sendEvent(analyticsEvent);
    } else {
      this.eventQueue.push(analyticsEvent);
    }
  }

  /**
   * Track music-specific events
   */
  trackMusic = {
    play: (songId: string, playlistId?: string, position?: number) => {
      this.track('song_play', {
        songId,
        playlistId,
        position,
        source: playlistId ? 'playlist' : 'direct'
      });
    },

    pause: (songId: string, position: number, duration: number) => {
      this.track('song_pause', {
        songId,
        position,
        duration,
        completionRate: (position / duration) * 100
      });
    },

    skip: (songId: string, position: number, reason?: 'next' | 'previous' | 'seek') => {
      this.track('song_skip', {
        songId,
        position,
        reason
      });
    },

    complete: (songId: string, duration: number) => {
      this.track('song_complete', {
        songId,
        duration
      });
    },

    like: (songId: string, action: 'like' | 'unlike') => {
      this.track('song_like', {
        songId,
        action
      });
    },

    addToPlaylist: (songId: string, playlistId: string) => {
      this.track('song_add_to_playlist', {
        songId,
        playlistId
      });
    },

    search: (query: string, resultsCount: number, selectedResult?: string) => {
      this.track('music_search', {
        query,
        resultsCount,
        selectedResult,
        queryLength: query.length
      });
    }
  };

  /**
   * Track user interactions
   */
  trackInteraction = {
    click: (element: string, context?: string) => {
      this.track('ui_click', {
        element,
        context
      });
    },

    scroll: (depth: number, page: string) => {
      this.track('page_scroll', {
        depth,
        page
      });
    },

    timeOnPage: (page: string, duration: number) => {
      this.track('time_on_page', {
        page,
        duration
      });
    },

    error: (errorType: string, errorMessage: string, context?: string) => {
      this.track('user_error', {
        errorType,
        errorMessage,
        context
      });
    }
  };

  /**
   * Track conversion events
   */
  trackConversion = {
    signup: (method: 'email' | 'google' | 'facebook') => {
      this.track('user_signup', {
        method,
        source: this.getUtmSource()
      });
    },

    login: (method: 'email' | 'google' | 'facebook') => {
      this.track('user_login', {
        method
      });
    },

    upgrade: (fromPlan: string, toPlan: string) => {
      this.track('plan_upgrade', {
        fromPlan,
        toPlan
      });
    },

    playlistCreate: (playlistId: string, songCount: number) => {
      this.track('playlist_create', {
        playlistId,
        songCount
      });
    }
  };

  /**
   * Set user properties
   */
  setUser(userId: string, properties?: Partial<UserProperties>): void {
    this.userId = userId;
    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }
    
    this.track('user_identify', {
      userId,
      properties: this.userProperties
    });
  }

  /**
   * Track A/B test participation
   */
  trackExperiment(experimentName: string, variant: string, userId?: string): void {
    this.track('experiment_view', {
      experimentName,
      variant,
      userId: userId || this.userId
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.track('performance_metric', {
      metric,
      value,
      ...context
    });
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData(): {
    totalEvents: number;
    topEvents: Array<{ event: string; count: number }>;
    userEngagement: {
      averageSessionDuration: number;
      bounceRate: number;
      returnUserRate: number;
    };
    musicStats: {
      totalPlays: number;
      averageListenDuration: number;
      topSongs: Array<{ songId: string; plays: number }>;
    };
  } {
    const events = this.getStoredEvents();
    const eventCounts: Record<string, number> = {};
    
    let totalSessionDuration = 0;
    let totalPlays = 0;
    let totalListenDuration = 0;
    const songPlays: Record<string, number> = {};

    events.forEach(event => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
      
      if (event.event === 'time_on_page' && event.properties?.duration) {
        totalSessionDuration += event.properties.duration;
      }
      
      if (event.event === 'song_play') {
        totalPlays++;
        if (event.properties?.songId) {
          songPlays[event.properties.songId] = (songPlays[event.properties.songId] || 0) + 1;
        }
      }
      
      if (event.event === 'song_pause' && event.properties?.position) {
        totalListenDuration += event.properties.position;
      }
    });

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    const topSongs = Object.entries(songPlays)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([songId, plays]) => ({ songId, plays }));

    return {
      totalEvents: events.length,
      topEvents,
      userEngagement: {
        averageSessionDuration: totalSessionDuration / Math.max(1, eventCounts['time_on_page'] || 1),
        bounceRate: 0, // Calculate based on single-page sessions
        returnUserRate: 0 // Calculate based on repeat users
      },
      musicStats: {
        totalPlays,
        averageListenDuration: totalListenDuration / Math.max(1, totalPlays),
        topSongs
      }
    };
  }

  private setupPageTracking(): void {
    if (typeof window === 'undefined') return;

    // Track initial page view
    this.track('page_view', {
      page: window.location.pathname,
      referrer: document.referrer
    });

    // Track page changes (for SPAs)
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.track('page_view', {
          page: currentPath
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setupEngagementTracking(): void {
    if (typeof window === 'undefined') return;

    let startTime = Date.now();
    let isActive = true;

    // Track time on page
    const trackTimeOnPage = () => {
      if (isActive) {
        const duration = Date.now() - startTime;
        this.trackInteraction.timeOnPage(window.location.pathname, duration);
      }
    };

    // Track when user becomes inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        trackTimeOnPage();
      } else {
        isActive = true;
        startTime = Date.now();
      }
    };

    // Track scroll depth
    let maxScrollDepth = 0;
    const handleScroll = () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (scrollDepth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackInteraction.scroll(scrollDepth, window.location.pathname);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);
  }

  private processEventQueue(): void {
    this.eventQueue.forEach(event => this.sendEvent(event));
    this.eventQueue = [];
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store locally for now
      const events = this.getStoredEvents();
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.shift();
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));

      // In production, send to analytics service:
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });

    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUtmSource(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_source') || undefined;
  }
}
