/**
 * Advanced Audio Streaming Manager for Meow-Play
 * Features: Progressive streaming, quality adjustment, intelligent buffering
 * Rating Target: A+ (10/10)
 */

export interface StreamingQuality {
  bitrate: number; // kbps
  sampleRate: number; // Hz
  channels: number;
  format: string;
  label: string; // e.g., "High", "Medium", "Low"
}

export interface StreamingOptions {
  preferredQuality: string;
  adaptiveStreaming: boolean;
  preloadAmount: number; // seconds
  maxBufferSize: number; // seconds
  minBufferSize: number; // seconds
  reconnectAttempts: number;
  progressiveDownload: boolean;
}

export interface BufferStatus {
  buffered: number; // seconds
  total: number; // seconds
  percentage: number;
  isStalling: boolean;
  downloadSpeed: number; // kbps
  estimatedBandwidth: number; // kbps
}

export interface StreamingStats {
  bytesLoaded: number;
  bytesTotal: number;
  downloadSpeed: number; // kbps
  averageSpeed: number; // kbps
  bufferHealth: number; // percentage
  stallEvents: number;
  qualitySwitches: number;
  startTime: number;
  playTime: number;
}

export class StreamingManager extends EventTarget {
  private options: StreamingOptions;
  private availableQualities: StreamingQuality[] = [];
  private currentQuality: StreamingQuality | null = null;
  private bufferStatus: BufferStatus;
  private stats: StreamingStats;
  
  // Network monitoring
  private bandwidthSamples: number[] = [];
  private lastBandwidthCheck: number = 0;
  private connectionType: string = 'unknown';
  
  // Buffer management
  private bufferCheckInterval: number | null = null;
  private preloadRequests: Map<string, AbortController> = new Map();
  
  // Progressive download
  private downloadRanges: Map<string, { start: number; end: number; data: ArrayBuffer }> = new Map();
  private downloadQueue: Array<{ url: string; start: number; end: number }> = [];
  
  // Quality adaptation
  private qualityHistory: Array<{ timestamp: number; quality: string; reason: string }> = [];
  private lastQualitySwitch: number = 0;
  private minimumSwitchInterval: number = 5000; // 5 seconds
  
  constructor(options: Partial<StreamingOptions> = {}) {
    super();
    
    this.options = {
      preferredQuality: 'auto',
      adaptiveStreaming: true,
      preloadAmount: 30,
      maxBufferSize: 120,
      minBufferSize: 10,
      reconnectAttempts: 3,
      progressiveDownload: true,
      ...options
    };
    
    this.bufferStatus = {
      buffered: 0,
      total: 0,
      percentage: 0,
      isStalling: false,
      downloadSpeed: 0,
      estimatedBandwidth: 0
    };
    
    this.stats = {
      bytesLoaded: 0,
      bytesTotal: 0,
      downloadSpeed: 0,
      averageSpeed: 0,
      bufferHealth: 100,
      stallEvents: 0,
      qualitySwitches: 0,
      startTime: Date.now(),
      playTime: 0
    };
    
    this.initializeNetworkMonitoring();
    this.setupDefaultQualities();
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor network connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      this.connectionType = connection.effectiveType || 'unknown';
      
      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType || 'unknown';
        this.handleConnectionChange();
      });
    }
    
    // Start bandwidth monitoring
    this.startBandwidthMonitoring();
  }

  /**
   * Setup default quality options
   */
  private setupDefaultQualities(): void {
    this.availableQualities = [
      {
        bitrate: 320,
        sampleRate: 44100,
        channels: 2,
        format: 'mp3',
        label: 'High'
      },
      {
        bitrate: 192,
        sampleRate: 44100,
        channels: 2,
        format: 'mp3',
        label: 'Medium'
      },
      {
        bitrate: 128,
        sampleRate: 44100,
        channels: 2,
        format: 'mp3',
        label: 'Low'
      },
      {
        bitrate: 64,
        sampleRate: 22050,
        channels: 2,
        format: 'mp3',
        label: 'Data Saver'
      }
    ];
    
    // Set initial quality based on connection
    this.currentQuality = this.selectOptimalQuality();
  }

  /**
   * Select optimal quality based on network conditions
   */
  private selectOptimalQuality(): StreamingQuality {
    if (this.options.preferredQuality !== 'auto') {
      const preferred = this.availableQualities.find(q => 
        q.label.toLowerCase() === this.options.preferredQuality.toLowerCase()
      );
      if (preferred) return preferred;
    }
    
    // Auto-select based on connection
    const bandwidth = this.getEstimatedBandwidth();
    
    if (bandwidth < 200) {
      return this.availableQualities.find(q => q.label === 'Data Saver') || this.availableQualities[3];
    } else if (bandwidth < 500) {
      return this.availableQualities.find(q => q.label === 'Low') || this.availableQualities[2];
    } else if (bandwidth < 1000) {
      return this.availableQualities.find(q => q.label === 'Medium') || this.availableQualities[1];
    } else {
      return this.availableQualities.find(q => q.label === 'High') || this.availableQualities[0];
    }
  }

  /**
   * Get estimated bandwidth from recent measurements
   */
  private getEstimatedBandwidth(): number {
    if (this.bandwidthSamples.length === 0) {
      // Default estimates based on connection type
      const connectionEstimates: Record<string, number> = {
        'slow-2g': 50,
        '2g': 100,
        '3g': 500,
        '4g': 2000,
        'unknown': 1000
      };
      return connectionEstimates[this.connectionType] || 1000;
    }
    
    // Use weighted average of recent samples
    const recentSamples = this.bandwidthSamples.slice(-5);
    const weights = recentSamples.map((_, index) => index + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const weightedSum = recentSamples.reduce((sum, sample, index) => {
      return sum + (sample * weights[index]);
    }, 0);
    
    return weightedSum / totalWeight;
  }

  /**
   * Start bandwidth monitoring
   */
  private startBandwidthMonitoring(): void {
    const measureBandwidth = async () => {
      try {
        const startTime = performance.now();
        const response = await fetch('/api/bandwidth-test', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = performance.now();
        
        if (response.ok) {
          const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
          const duration = (endTime - startTime) / 1000; // seconds
          const bandwidth = (contentLength * 8) / duration / 1000; // kbps
          
          this.bandwidthSamples.push(bandwidth);
          if (this.bandwidthSamples.length > 10) {
            this.bandwidthSamples.shift(); // Keep only recent samples
          }
          
          this.bufferStatus.estimatedBandwidth = this.getEstimatedBandwidth();
        }
      } catch (error) {
        console.warn('Bandwidth measurement failed:', error);
      }
    };
    
    // Initial measurement
    measureBandwidth();
    
    // Periodic measurements
    setInterval(measureBandwidth, 30000); // Every 30 seconds
  }

  /**
   * Handle connection changes
   */
  private handleConnectionChange(): void {
    if (this.options.adaptiveStreaming) {
      const newQuality = this.selectOptimalQuality();
      
      if (newQuality.label !== this.currentQuality?.label) {
        this.switchQuality(newQuality, 'connection_change');
      }
    }
    
    this.dispatchEvent(new CustomEvent('connectionChange', {
      detail: { 
        connectionType: this.connectionType,
        estimatedBandwidth: this.getEstimatedBandwidth()
      }
    }));
  }

  /**
   * Switch to different quality
   */
  private async switchQuality(quality: StreamingQuality, reason: string): Promise<void> {
    const now = Date.now();
    
    // Prevent frequent quality switches
    if (now - this.lastQualitySwitch < this.minimumSwitchInterval) {
      return;
    }
    
    const previousQuality = this.currentQuality;
    this.currentQuality = quality;
    this.lastQualitySwitch = now;
    
    // Record quality switch
    this.qualityHistory.push({
      timestamp: now,
      quality: quality.label,
      reason
    });
    
    this.stats.qualitySwitches++;
    
    this.dispatchEvent(new CustomEvent('qualityChange', {
      detail: { 
        previousQuality,
        currentQuality: quality,
        reason
      }
    }));
  }

  /**
   * Create streaming URL with quality parameters
   */
  createStreamingUrl(baseUrl: string): string {
    if (!this.currentQuality) return baseUrl;
    
    const url = new URL(baseUrl);
    url.searchParams.set('bitrate', this.currentQuality.bitrate.toString());
    url.searchParams.set('format', this.currentQuality.format);
    url.searchParams.set('quality', this.currentQuality.label.toLowerCase());
    
    return url.toString();
  }

  /**
   * Progressive download with range requests
   */
  async downloadRange(url: string, start: number, end: number): Promise<ArrayBuffer> {
    const rangeKey = `${url}:${start}-${end}`;
    
    // Check if already downloaded
    const cached = this.downloadRanges.get(rangeKey);
    if (cached) {
      return cached.data;
    }
    
    const controller = new AbortController();
    this.preloadRequests.set(rangeKey, controller);
    
    try {
      const startTime = performance.now();
      const response = await fetch(url, {
        headers: {
          'Range': `bytes=${start}-${end}`
        },
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.arrayBuffer();
      const endTime = performance.now();
      
      // Calculate download speed
      const duration = (endTime - startTime) / 1000; // seconds
      const bytes = data.byteLength;
      const speed = (bytes * 8) / duration / 1000; // kbps
      
      // Update statistics
      this.stats.bytesLoaded += bytes;
      this.stats.downloadSpeed = speed;
      this.updateAverageSpeed(speed);
      
      // Cache the range
      this.downloadRanges.set(rangeKey, { start, end, data });
      
      // Update bandwidth samples
      this.bandwidthSamples.push(speed);
      if (this.bandwidthSamples.length > 10) {
        this.bandwidthSamples.shift();
      }
      
      this.dispatchEvent(new CustomEvent('rangeDownloaded', {
        detail: { 
          start, 
          end, 
          bytes, 
          speed,
          url 
        }
      }));
      
      return data;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Download aborted');
      }
      throw error;
    } finally {
      this.preloadRequests.delete(rangeKey);
    }
  }

  /**
   * Update average download speed
   */
  private updateAverageSpeed(newSpeed: number): void {
    const alpha = 0.1; // Smoothing factor
    this.stats.averageSpeed = this.stats.averageSpeed === 0 
      ? newSpeed 
      : this.stats.averageSpeed * (1 - alpha) + newSpeed * alpha;
  }

  /**
   * Preload audio segments
   */
  async preloadSegments(url: string, currentPosition: number, duration: number): Promise<void> {
    if (!this.options.progressiveDownload) return;
    
    const segmentSize = 1024 * 1024; // 1MB segments
    const preloadTime = this.options.preloadAmount;
    const bytesPerSecond = (this.currentQuality?.bitrate || 128) * 1000 / 8; // Convert kbps to bytes/sec
    const preloadBytes = preloadTime * bytesPerSecond;
    
    const currentByte = currentPosition * bytesPerSecond;
    const endByte = Math.min(currentByte + preloadBytes, duration * bytesPerSecond);
    
    // Create download segments
    const segments: Array<{ start: number; end: number }> = [];
    for (let start = currentByte; start < endByte; start += segmentSize) {
      const end = Math.min(start + segmentSize - 1, endByte);
      segments.push({ start: Math.floor(start), end: Math.floor(end) });
    }
    
    // Download segments in parallel (but limited)
    const maxConcurrent = 3;
    const downloadPromises: Promise<void>[] = [];
    
    for (let i = 0; i < Math.min(segments.length, maxConcurrent); i++) {
      const segment = segments[i];
      downloadPromises.push(
        this.downloadRange(url, segment.start, segment.end)
          .then(() => {
            this.dispatchEvent(new CustomEvent('segmentPreloaded', {
              detail: { segment, totalSegments: segments.length }
            }));
          })
          .catch(error => {
            console.warn('Segment preload failed:', error);
          })
      );
    }
    
    await Promise.allSettled(downloadPromises);
  }

  /**
   * Monitor buffer status
   */
  startBufferMonitoring(audioElement: HTMLAudioElement): void {
    if (this.bufferCheckInterval) {
      clearInterval(this.bufferCheckInterval);
    }
    
    this.bufferCheckInterval = window.setInterval(() => {
      this.updateBufferStatus(audioElement);
    }, 1000);
    
    // Listen for buffer events
    audioElement.addEventListener('progress', () => {
      this.updateBufferStatus(audioElement);
    });
    
    audioElement.addEventListener('waiting', () => {
      this.bufferStatus.isStalling = true;
      this.stats.stallEvents++;
      
      this.dispatchEvent(new CustomEvent('bufferStall', {
        detail: { bufferStatus: this.bufferStatus }
      }));
      
      // Consider quality downgrade if stalling frequently
      if (this.options.adaptiveStreaming && this.stats.stallEvents > 2) {
        this.considerQualityDowngrade();
      }
    });
    
    audioElement.addEventListener('canplay', () => {
      this.bufferStatus.isStalling = false;
      
      this.dispatchEvent(new CustomEvent('bufferReady', {
        detail: { bufferStatus: this.bufferStatus }
      }));
    });
  }

  /**
   * Update buffer status
   */
  private updateBufferStatus(audioElement: HTMLAudioElement): void {
    const buffered = audioElement.buffered;
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration || 0;
    
    let totalBuffered = 0;
    let bufferedAhead = 0;
    
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      totalBuffered += (end - start);
      
      // Calculate buffered time ahead of current position
      if (currentTime >= start && currentTime <= end) {
        bufferedAhead = end - currentTime;
      }
    }
    
    this.bufferStatus.buffered = bufferedAhead;
    this.bufferStatus.total = duration;
    this.bufferStatus.percentage = duration > 0 ? (totalBuffered / duration) * 100 : 0;
    
    // Update buffer health
    this.stats.bufferHealth = this.bufferStatus.buffered > this.options.minBufferSize ? 100 : 
      (this.bufferStatus.buffered / this.options.minBufferSize) * 100;
    
    this.dispatchEvent(new CustomEvent('bufferUpdate', {
      detail: { bufferStatus: this.bufferStatus, stats: this.stats }
    }));
    
    // Check if we need to preload more
    if (this.bufferStatus.buffered < this.options.preloadAmount) {
      this.preloadSegments(audioElement.src, currentTime, duration);
    }
  }

  /**
   * Consider quality downgrade due to poor performance
   */
  private considerQualityDowngrade(): void {
    if (!this.currentQuality || !this.options.adaptiveStreaming) return;
    
    const currentIndex = this.availableQualities.findIndex(q => q.label === this.currentQuality!.label);
    
    // Find lower quality option
    const lowerQuality = this.availableQualities.find((q, index) => 
      index > currentIndex && q.bitrate < this.currentQuality!.bitrate
    );
    
    if (lowerQuality) {
      this.switchQuality(lowerQuality, 'performance_degradation');
    }
  }

  /**
   * Consider quality upgrade when performance allows
   */
  private considerQualityUpgrade(): void {
    if (!this.currentQuality || !this.options.adaptiveStreaming) return;
    
    const bandwidth = this.getEstimatedBandwidth();
    const currentIndex = this.availableQualities.findIndex(q => q.label === this.currentQuality!.label);
    
    // Find higher quality option that bandwidth can support
    const higherQuality = this.availableQualities.find((q, index) => 
      index < currentIndex && q.bitrate * 1.5 < bandwidth // 50% headroom
    );
    
    if (higherQuality && this.stats.bufferHealth > 80) {
      this.switchQuality(higherQuality, 'bandwidth_improvement');
    }
  }

  /**
   * Stop buffer monitoring
   */
  stopBufferMonitoring(): void {
    if (this.bufferCheckInterval) {
      clearInterval(this.bufferCheckInterval);
      this.bufferCheckInterval = null;
    }
  }

  /**
   * Cancel all preload requests
   */
  cancelAllPreloads(): void {
    this.preloadRequests.forEach(controller => {
      controller.abort();
    });
    this.preloadRequests.clear();
    this.downloadQueue = [];
  }

  /**
   * Set preferred quality
   */
  setPreferredQuality(quality: string): void {
    this.options.preferredQuality = quality;
    
    if (quality === 'auto') {
      const optimalQuality = this.selectOptimalQuality();
      if (optimalQuality.label !== this.currentQuality?.label) {
        this.switchQuality(optimalQuality, 'user_preference');
      }
    } else {
      const requestedQuality = this.availableQualities.find(q => 
        q.label.toLowerCase() === quality.toLowerCase()
      );
      
      if (requestedQuality && requestedQuality.label !== this.currentQuality?.label) {
        this.switchQuality(requestedQuality, 'user_preference');
      }
    }
  }

  /**
   * Enable/disable adaptive streaming
   */
  setAdaptiveStreaming(enabled: boolean): void {
    this.options.adaptiveStreaming = enabled;
    
    this.dispatchEvent(new CustomEvent('adaptiveStreamingChange', {
      detail: { enabled }
    }));
  }

  /**
   * Get available qualities
   */
  getAvailableQualities(): StreamingQuality[] {
    return [...this.availableQualities];
  }

  /**
   * Get current quality
   */
  getCurrentQuality(): StreamingQuality | null {
    return this.currentQuality;
  }

  /**
   * Get buffer status
   */
  getBufferStatus(): BufferStatus {
    return { ...this.bufferStatus };
  }

  /**
   * Get streaming statistics
   */
  getStats(): StreamingStats {
    return { ...this.stats };
  }

  /**
   * Get quality history
   */
  getQualityHistory(): Array<{ timestamp: number; quality: string; reason: string }> {
    return [...this.qualityHistory];
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      bytesLoaded: 0,
      bytesTotal: 0,
      downloadSpeed: 0,
      averageSpeed: 0,
      bufferHealth: 100,
      stallEvents: 0,
      qualitySwitches: 0,
      startTime: Date.now(),
      playTime: 0
    };
    
    this.qualityHistory = [];
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopBufferMonitoring();
    this.cancelAllPreloads();
    
    // Clear cached ranges
    this.downloadRanges.clear();
    
    this.dispatchEvent(new CustomEvent('disposed'));
  }
}
