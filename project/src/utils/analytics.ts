// Analytics and tracking utility
interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
}

class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isEnabled: boolean = false;
  private queue: AnalyticsEvent[] = [];

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    // Initialize Google Analytics if ID is provided
    const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
    if (gaId) {
      this.loadGoogleAnalytics(gaId);
      this.isEnabled = true;
    }

    // Process queued events
    this.processQueue();
  }

  private loadGoogleAnalytics(gaId: string) {
    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', gaId);
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  private sendEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      this.queue.push(event);
      return;
    }

    // Send to Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_map: {
          user_id: event.userId
        }
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(event);
  }

  private async sendToCustomAnalytics(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  // Public methods for tracking events
  trackSongPlay(songId: string, songTitle: string, artist: string, userId?: string) {
    this.sendEvent({
      event: 'song_play',
      category: 'Music',
      action: 'play',
      label: `${artist} - ${songTitle}`,
      value: 1,
      userId
    });
  }

  trackSongLike(songId: string, songTitle: string, userId?: string) {
    this.sendEvent({
      event: 'song_like',
      category: 'Engagement',
      action: 'like',
      label: songTitle,
      value: 1,
      userId
    });
  }

  trackPlaylistCreate(playlistName: string, songCount: number, userId?: string) {
    this.sendEvent({
      event: 'playlist_create',
      category: 'Content',
      action: 'create_playlist',
      label: playlistName,
      value: songCount,
      userId
    });
  }

  trackSongUpload(songTitle: string, genre: string, userId?: string) {
    this.sendEvent({
      event: 'song_upload',
      category: 'Content',
      action: 'upload',
      label: `${genre} - ${songTitle}`,
      value: 1,
      userId
    });
  }

  trackSearch(query: string, resultCount: number, userId?: string) {
    this.sendEvent({
      event: 'search',
      category: 'Discovery',
      action: 'search',
      label: query,
      value: resultCount,
      userId
    });
  }

  trackUserRegistration(userId: string) {
    this.sendEvent({
      event: 'user_registration',
      category: 'User',
      action: 'register',
      value: 1,
      userId
    });
  }

  trackPageView(pageName: string, userId?: string) {
    this.sendEvent({
      event: 'page_view',
      category: 'Navigation',
      action: 'view',
      label: pageName,
      value: 1,
      userId
    });
  }

  trackError(errorMessage: string, errorType: string, userId?: string) {
    this.sendEvent({
      event: 'error',
      category: 'Error',
      action: errorType,
      label: errorMessage,
      value: 1,
      userId
    });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, userId?: string) {
    this.sendEvent({
      event: 'performance',
      category: 'Performance',
      action: metric,
      value: Math.round(value),
      userId
    });
  }
}

export const analytics = AnalyticsManager.getInstance();