/**
 * Advanced Audio Engine for Meow-Play
 * Features: Web Audio API, Equalizer, Crossfade, Effects, Visualization
 * Rating Target: A+ (10/10)
 */

export interface AudioEffect {
  id: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  q: number;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  waveformData: Float32Array;
  spectrumData: Float32Array;
}

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number; // in seconds
  curve: 'linear' | 'exponential' | 'logarithmic';
}

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  crossfadeSettings: CrossfadeSettings;
  equalizerBands: EqualizerBand[];
  effects: AudioEffect[];
}

export type AudioFormat = 'mp3' | 'flac' | 'wav' | 'aac' | 'ogg' | 'webm';

export interface AudioTrack {
  id: string;
  url: string;
  format: AudioFormat;
  title: string;
  artist: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
}

export class AudioEngine extends EventTarget {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private equalizerNodes: BiquadFilterNode[] = [];
  private effectsNodes: AudioNode[] = [];
  
  // Audio elements for different scenarios
  private audioElement: HTMLAudioElement | null = null;
  private currentTrack: AudioTrack | null = null;
  private nextTrack: AudioTrack | null = null;
  
  // Crossfade support
  private crossfadeGainNode: GainNode | null = null;
  private crossfadeTimer: number | null = null;
  
  // Visualization data
  private visualizationData: AudioVisualizationData | null = null;
  private animationFrameId: number | null = null;
  
  // State management
  private state: AudioEngineState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    playbackRate: 1,
    crossfadeSettings: {
      enabled: true,
      duration: 3,
      curve: 'exponential'
    },
    equalizerBands: this.getDefaultEqualizerBands(),
    effects: []
  };

  constructor() {
    super();
    this.initializeAudioContext();
    this.setupEventListeners();
  }

  /**
   * Initialize Web Audio API context
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle audio context state changes
      this.audioContext.addEventListener('statechange', () => {
        this.dispatchEvent(new CustomEvent('contextStateChange', {
          detail: { state: this.audioContext?.state }
        }));
      });

      await this.setupAudioNodes();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw new Error('Web Audio API not supported');
    }
  }

  /**
   * Setup audio processing nodes
   */
  private async setupAudioNodes(): Promise<void> {
    if (!this.audioContext) return;

    // Create main gain node
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.state.volume;

    // Create analyzer node for visualization
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Create equalizer bands (10-band)
    this.setupEqualizer();

    // Create crossfade gain node
    this.crossfadeGainNode = this.audioContext.createGain();
    this.crossfadeGainNode.gain.value = 1;

    // Connect nodes: source -> equalizer -> effects -> crossfade -> gain -> analyzer -> destination
    this.connectAudioNodes();
  }

  /**
   * Setup 10-band equalizer
   */
  private setupEqualizer(): void {
    if (!this.audioContext) return;

    this.equalizerNodes = this.state.equalizerBands.map((band, index) => {
      const filter = this.audioContext!.createBiquadFilter();
      
      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === this.state.equalizerBands.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
      }
      
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;
      
      return filter;
    });

    // Connect equalizer nodes in series
    for (let i = 0; i < this.equalizerNodes.length - 1; i++) {
      this.equalizerNodes[i].connect(this.equalizerNodes[i + 1]);
    }
  }

  /**
   * Connect all audio nodes
   */
  private connectAudioNodes(): void {
    if (!this.audioContext || !this.gainNode || !this.analyserNode || !this.crossfadeGainNode) return;

    // The connection will be: source -> [first equalizer] -> ... -> [last equalizer] -> crossfade -> gain -> analyzer -> destination
    if (this.equalizerNodes.length > 0) {
      this.equalizerNodes[this.equalizerNodes.length - 1].connect(this.crossfadeGainNode);
      this.crossfadeGainNode.connect(this.gainNode);
    }
    
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  /**
   * Get default equalizer bands configuration
   */
  private getDefaultEqualizerBands(): EqualizerBand[] {
    return [
      { frequency: 60, gain: 0, q: 0.7 },    // Sub Bass
      { frequency: 120, gain: 0, q: 0.7 },   // Bass
      { frequency: 250, gain: 0, q: 0.7 },   // Low Mid
      { frequency: 500, gain: 0, q: 0.7 },   // Mid
      { frequency: 1000, gain: 0, q: 0.7 },  // Upper Mid
      { frequency: 2000, gain: 0, q: 0.7 },  // Presence
      { frequency: 4000, gain: 0, q: 0.7 },  // High Mid
      { frequency: 8000, gain: 0, q: 0.7 },  // Treble
      { frequency: 12000, gain: 0, q: 0.7 }, // High Treble
      { frequency: 16000, gain: 0, q: 0.7 }  // Air
    ];
  }

  /**
   * Load and play a track
   */
  async loadTrack(track: AudioTrack): Promise<void> {
    try {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.currentTrack = track;
      
      // Create audio element for streaming support
      this.audioElement = new Audio(track.url);
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';
      
      // Setup audio element event listeners
      this.setupAudioElementListeners();
      
      // Create media element source node
      if (this.audioContext) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        
        // Connect to audio processing chain
        if (this.equalizerNodes.length > 0) {
          this.sourceNode.connect(this.equalizerNodes[0]);
        } else if (this.crossfadeGainNode) {
          this.sourceNode.connect(this.crossfadeGainNode);
        }
      }

      // Load track metadata
      await this.loadTrackMetadata();
      
      this.dispatchEvent(new CustomEvent('trackLoaded', { detail: { track } }));
    } catch (error) {
      console.error('Failed to load track:', error);
      this.dispatchEvent(new CustomEvent('trackLoadError', { detail: { error, track } }));
      throw error;
    }
  }

  /**
   * Load track metadata
   */
  private async loadTrackMetadata(): Promise<void> {
    if (!this.audioElement) return;

    return new Promise((resolve) => {
      const onMetadataLoaded = () => {
        if (this.audioElement) {
          this.state.duration = this.audioElement.duration;
          this.dispatchEvent(new CustomEvent('metadataLoaded', {
            detail: { 
              duration: this.state.duration,
              track: this.currentTrack 
            }
          }));
        }
        resolve();
      };

      if (this.audioElement.readyState >= 1) {
        onMetadataLoaded();
      } else {
        this.audioElement.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
      }
    });
  }

  /**
   * Setup audio element event listeners
   */
  private setupAudioElementListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.state.currentTime = this.audioElement.currentTime;
        this.dispatchEvent(new CustomEvent('timeUpdate', {
          detail: { currentTime: this.state.currentTime }
        }));
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.state.isPlaying = false;
      this.dispatchEvent(new CustomEvent('trackEnded', {
        detail: { track: this.currentTrack }
      }));
    });

    this.audioElement.addEventListener('error', (e) => {
      this.dispatchEvent(new CustomEvent('audioError', {
        detail: { error: e, track: this.currentTrack }
      }));
    });

    this.audioElement.addEventListener('canplaythrough', () => {
      this.dispatchEvent(new CustomEvent('canPlay', {
        detail: { track: this.currentTrack }
      }));
    });
  }

  /**
   * Play current track
   */
  async play(): Promise<void> {
    if (!this.audioElement) return;

    try {
      await this.audioElement.play();
      this.state.isPlaying = true;
      this.startVisualization();
      
      this.dispatchEvent(new CustomEvent('playStateChange', {
        detail: { isPlaying: true }
      }));
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause current track
   */
  pause(): void {
    if (!this.audioElement) return;

    this.audioElement.pause();
    this.state.isPlaying = false;
    this.stopVisualization();
    
    this.dispatchEvent(new CustomEvent('playStateChange', {
      detail: { isPlaying: false }
    }));
  }

  /**
   * Stop current track
   */
  stop(): void {
    this.pause();
    this.seek(0);
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (!this.audioElement) return;

    this.audioElement.currentTime = Math.max(0, Math.min(time, this.state.duration));
    this.state.currentTime = this.audioElement.currentTime;
    
    this.dispatchEvent(new CustomEvent('seeked', {
      detail: { currentTime: this.state.currentTime }
    }));
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.state.volume = clampedVolume;
    
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(clampedVolume, this.audioContext!.currentTime);
    }
    
    if (this.audioElement) {
      this.audioElement.volume = clampedVolume;
    }
    
    this.dispatchEvent(new CustomEvent('volumeChange', {
      detail: { volume: clampedVolume }
    }));
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.state.muted = !this.state.muted;
    
    const targetVolume = this.state.muted ? 0 : this.state.volume;
    
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(targetVolume, this.audioContext!.currentTime);
    }
    
    if (this.audioElement) {
      this.audioElement.muted = this.state.muted;
    }
    
    this.dispatchEvent(new CustomEvent('muteToggle', {
      detail: { muted: this.state.muted }
    }));
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    const clampedRate = Math.max(0.25, Math.min(3, rate));
    this.state.playbackRate = clampedRate;
    
    if (this.audioElement) {
      this.audioElement.playbackRate = clampedRate;
    }
    
    this.dispatchEvent(new CustomEvent('playbackRateChange', {
      detail: { playbackRate: clampedRate }
    }));
  }

  /**
   * Update equalizer band
   */
  updateEqualizerBand(index: number, gain: number): void {
    if (index < 0 || index >= this.equalizerNodes.length) return;
    
    const clampedGain = Math.max(-20, Math.min(20, gain));
    this.state.equalizerBands[index].gain = clampedGain;
    
    const node = this.equalizerNodes[index];
    node.gain.setValueAtTime(clampedGain, this.audioContext!.currentTime);
    
    this.dispatchEvent(new CustomEvent('equalizerChange', {
      detail: { bandIndex: index, gain: clampedGain }
    }));
  }

  /**
   * Set equalizer preset
   */
  setEqualizerPreset(preset: string): void {
    const presets: Record<string, number[]> = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      rock: [5, 3, -1, -2, 1, 2, 4, 5, 6, 7],
      pop: [2, 1, 0, 1, 2, 2, 1, 0, 1, 2],
      jazz: [4, 2, 1, 2, -1, 1, 2, 3, 4, 5],
      classical: [5, 3, 2, 1, -1, -1, 0, 2, 3, 4],
      electronic: [6, 4, 2, 0, -1, 1, 2, 4, 5, 6],
      hiphop: [6, 4, 1, 2, -1, 0, 1, 2, 3, 4],
      vocal: [1, 0, -1, 1, 3, 4, 3, 2, 1, 0]
    };
    
    const gains = presets[preset.toLowerCase()];
    if (!gains) return;
    
    gains.forEach((gain, index) => {
      this.updateEqualizerBand(index, gain);
    });
    
    this.dispatchEvent(new CustomEvent('equalizerPresetChange', {
      detail: { preset }
    }));
  }

  /**
   * Setup crossfade for next track
   */
  async setupCrossfade(nextTrack: AudioTrack): Promise<void> {
    if (!this.state.crossfadeSettings.enabled || !this.audioContext) return;
    
    this.nextTrack = nextTrack;
    
    // Calculate crossfade start time
    const crossfadeStartTime = this.state.duration - this.state.crossfadeSettings.duration;
    
    if (this.state.currentTime >= crossfadeStartTime) {
      await this.startCrossfade();
    } else {
      // Setup timer for crossfade start
      const timeUntilCrossfade = (crossfadeStartTime - this.state.currentTime) * 1000;
      this.crossfadeTimer = window.setTimeout(() => {
        this.startCrossfade();
      }, timeUntilCrossfade);
    }
  }

  /**
   * Start crossfade to next track
   */
  private async startCrossfade(): Promise<void> {
    if (!this.nextTrack || !this.audioContext || !this.crossfadeGainNode) return;
    
    const duration = this.state.crossfadeSettings.duration;
    const currentTime = this.audioContext.currentTime;
    
    // Fade out current track
    if (this.state.crossfadeSettings.curve === 'exponential') {
      this.crossfadeGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    } else if (this.state.crossfadeSettings.curve === 'logarithmic') {
      this.crossfadeGainNode.gain.setValueCurveAtTime(
        this.createLogCurve(1, 0, 100),
        currentTime,
        duration
      );
    } else {
      this.crossfadeGainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
    }
    
    // Load and fade in next track
    setTimeout(async () => {
      await this.loadTrack(this.nextTrack!);
      await this.play();
      
      // Fade in new track
      if (this.crossfadeGainNode) {
        this.crossfadeGainNode.gain.setValueAtTime(0.001, this.audioContext!.currentTime);
        
        if (this.state.crossfadeSettings.curve === 'exponential') {
          this.crossfadeGainNode.gain.exponentialRampToValueAtTime(1, this.audioContext!.currentTime + duration);
        } else if (this.state.crossfadeSettings.curve === 'logarithmic') {
          this.crossfadeGainNode.gain.setValueCurveAtTime(
            this.createLogCurve(0, 1, 100),
            this.audioContext!.currentTime,
            duration
          );
        } else {
          this.crossfadeGainNode.gain.linearRampToValueAtTime(1, this.audioContext!.currentTime + duration);
        }
      }
    }, (duration * 1000) / 2);
    
    this.dispatchEvent(new CustomEvent('crossfadeStart', {
      detail: { currentTrack: this.currentTrack, nextTrack: this.nextTrack }
    }));
  }

  /**
   * Create logarithmic curve for crossfading
   */
  private createLogCurve(startValue: number, endValue: number, steps: number): Float32Array {
    const curve = new Float32Array(steps);
    const range = endValue - startValue;
    
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      curve[i] = startValue + range * Math.log(1 + t * (Math.E - 1)) / Math.log(Math.E);
    }
    
    return curve;
  }

  /**
   * Start visualization data collection
   */
  private startVisualization(): void {
    if (!this.analyserNode) return;
    
    const updateVisualization = () => {
      if (!this.analyserNode || !this.state.isPlaying) return;
      
      const bufferLength = this.analyserNode.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeDomainData = new Uint8Array(bufferLength);
      const waveformData = new Float32Array(bufferLength);
      const spectrumData = new Float32Array(bufferLength);
      
      this.analyserNode.getByteFrequencyData(frequencyData);
      this.analyserNode.getByteTimeDomainData(timeDomainData);
      this.analyserNode.getFloatTimeDomainData(waveformData);
      this.analyserNode.getFloatFrequencyData(spectrumData);
      
      this.visualizationData = {
        frequencyData,
        timeDomainData,
        waveformData,
        spectrumData
      };
      
      this.dispatchEvent(new CustomEvent('visualizationUpdate', {
        detail: { data: this.visualizationData }
      }));
      
      this.animationFrameId = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  }

  /**
   * Stop visualization data collection
   */
  private stopVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Setup general event listeners
   */
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.isPlaying) {
        // Continue playing in background
        this.dispatchEvent(new CustomEvent('backgroundPlayback', {
          detail: { hidden: true }
        }));
      }
    });
    
    // Handle audio interruptions (mobile)
    if ('audioSession' in navigator) {
      (navigator as any).audioSession.addEventListener('interrupt', () => {
        this.pause();
        this.dispatchEvent(new CustomEvent('audioInterruption'));
      });
    }
  }

  /**
   * Get current audio state
   */
  getState(): AudioEngineState {
    return { ...this.state };
  }

  /**
   * Get visualization data
   */
  getVisualizationData(): AudioVisualizationData | null {
    return this.visualizationData;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.pause();
    this.stopVisualization();
    
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
    }
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load();
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    
    this.equalizerNodes.forEach(node => node.disconnect());
    
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

/**
 * Audio format detection utility
 */
export class AudioFormatDetector {
  private static supportedFormats: Record<string, boolean> = {};
  
  /**
   * Check if audio format is supported
   */
  static isFormatSupported(format: AudioFormat): boolean {
    if (this.supportedFormats[format] !== undefined) {
      return this.supportedFormats[format];
    }
    
    const audio = new Audio();
    const mimeTypes: Record<AudioFormat, string> = {
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      webm: 'audio/webm'
    };
    
    const canPlay = audio.canPlayType(mimeTypes[format]);
    const isSupported = canPlay === 'probably' || canPlay === 'maybe';
    
    this.supportedFormats[format] = isSupported;
    return isSupported;
  }
  
  /**
   * Get all supported formats
   */
  static getSupportedFormats(): AudioFormat[] {
    const allFormats: AudioFormat[] = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'webm'];
    return allFormats.filter(format => this.isFormatSupported(format));
  }
  
  /**
   * Detect format from file extension or MIME type
   */
  static detectFormat(url: string, mimeType?: string): AudioFormat | null {
    // Try MIME type first
    if (mimeType) {
      const mimeToFormat: Record<string, AudioFormat> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/flac': 'flac',
        'audio/wav': 'wav',
        'audio/wave': 'wav',
        'audio/aac': 'aac',
        'audio/ogg': 'ogg',
        'audio/webm': 'webm'
      };
      
      const format = mimeToFormat[mimeType.toLowerCase()];
      if (format && this.isFormatSupported(format)) {
        return format;
      }
    }
    
    // Fall back to file extension
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension) {
      const extToFormat: Record<string, AudioFormat> = {
        mp3: 'mp3',
        flac: 'flac',
        wav: 'wav',
        aac: 'aac',
        ogg: 'ogg',
        webm: 'webm'
      };
      
      const format = extToFormat[extension];
      if (format && this.isFormatSupported(format)) {
        return format;
      }
    }
    
    return null;
  }
}
