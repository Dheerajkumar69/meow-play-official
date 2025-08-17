import { Song } from '../types';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isShuffled: boolean;
  repeat: 'none' | 'one' | 'all';
}

interface AudioAnalyzerData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  averageFrequency: number;
}

export class PlayerManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private state: PlayerState;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor() {
    this.state = {
      currentSong: null,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      isShuffled: false,
      repeat: 'none'
    };
  }

  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    try {
      this.audioElement = audioElement;
      
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create analyser node for visualizations
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.state.volume;
      
      // Create audio source from HTML audio element
      this.audioSource = this.audioContext.createMediaElementSource(audioElement);
      
      // Connect nodes: source -> analyser -> gain -> destination
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      // Resume audio context if suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize PlayerManager:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('loadstart', () => {
      this.emit('loadstart');
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audioElement?.duration || 0;
      this.emit('durationchange', this.state.duration);
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.state.currentTime = this.audioElement.currentTime;
        this.emit('timeupdate', this.state.currentTime);
      }
    });

    this.audioElement.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.emit('play');
    });

    this.audioElement.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.emit('pause');
    });

    this.audioElement.addEventListener('ended', () => {
      this.state.isPlaying = false;
      this.emit('ended');
    });

    this.audioElement.addEventListener('error', (event) => {
      this.emit('error', event);
    });

    this.audioElement.addEventListener('canplay', () => {
      this.emit('canplay');
    });
  }

  async play(song?: Song): Promise<void> {
    if (!this.audioElement) {
      throw new Error('PlayerManager not initialized');
    }

    try {
      // Resume audio context if needed
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (song && song.id !== this.state.currentSong?.id) {
        this.state.currentSong = song;
        this.audioElement.src = song.filePath;
        await this.audioElement.load();
      }

      await this.audioElement.play();
      this.state.isPlaying = true;
    } catch (error) {
      console.error('Play failed:', error);
      throw error;
    }
  }

  pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.state.isPlaying = false;
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.state.isPlaying = false;
      this.state.currentTime = 0;
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.state.volume = clampedVolume;
    
    if (this.audioElement) {
      this.audioElement.volume = clampedVolume;
    }
    
    if (this.gainNode) {
      this.gainNode.gain.value = clampedVolume;
    }
  }

  seek(time: number): void {
    if (this.audioElement && !isNaN(time) && time >= 0) {
      const clampedTime = Math.min(time, this.state.duration);
      this.audioElement.currentTime = clampedTime;
      this.state.currentTime = clampedTime;
    }
  }

  getAnalyzerData(): AudioAnalyzerData | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);
    
    // Calculate average frequency for simple visualizations
    const sum = frequencyData.reduce((acc, value) => acc + value, 0);
    const averageFrequency = sum / bufferLength;
    
    return {
      frequencyData,
      timeDomainData,
      averageFrequency
    };
  }

  setEqualizer(bass: number, mid: number, treble: number): void {
    if (!this.audioContext) return;

    try {
      // Create or update EQ filters
      // This is a simplified implementation - in production, you'd want more sophisticated EQ
      const bassFilter = this.audioContext.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 320;
      bassFilter.gain.value = bass;

      const midFilter = this.audioContext.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 0.5;
      midFilter.gain.value = mid;

      const trebleFilter = this.audioContext.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 3200;
      trebleFilter.gain.value = treble;

      // Reconnect audio chain with EQ filters
      if (this.audioSource && this.analyser && this.gainNode) {
        this.audioSource.disconnect();
        this.audioSource.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(this.analyser);
        this.analyser.connect(this.gainNode);
      }
    } catch (error) {
      console.error('Failed to set equalizer:', error);
    }
  }

  // Event system for communication with React components
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  cleanup(): void {
    try {
      // Stop audio
      this.stop();
      
      // Disconnect audio nodes
      if (this.audioSource) {
        this.audioSource.disconnect();
        this.audioSource = null;
      }
      
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
      
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      
      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Reset state
      this.state = {
        currentSong: null,
        isPlaying: false,
        volume: 0.7,
        currentTime: 0,
        duration: 0,
        isShuffled: false,
        repeat: 'none'
      };
    } catch (error) {
      console.error('Error during PlayerManager cleanup:', error);
    }
  }
}
