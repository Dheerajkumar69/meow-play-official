import { Song } from '../types';
import { db } from '../utils/indexedDB';
import { CacheManager } from '../utils/cacheManager';
import { PlayerManager } from '../utils/playerManager';

export type PlayerEventType = 
  | 'play'
  | 'pause'
  | 'timeupdate'
  | 'durationchange'
  | 'loadstart'
  | 'canplay'
  | 'error'
  | 'ended'
  | 'volumechange';

export type PlayerEventCallback = (event?: Event) => void;

export class PlayerService {
  private static instance: PlayerService;
  private audioElement: HTMLAudioElement;
  private eventListeners: Map<PlayerEventType, Set<PlayerEventCallback>>;
  private playPromise: Promise<void> | null = null;
  private playerManager: PlayerManager | null = null;
  private cacheManager: CacheManager | null = null;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'metadata';
    this.eventListeners = new Map();
    this.setupEventListeners();
    this.initializeManagers();
  }

  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }

  private initializeManagers(): void {
    this.playerManager = new PlayerManager();
    this.cacheManager = new CacheManager();
  }

  private setupEventListeners(): void {
    const eventTypes: PlayerEventType[] = [
      'play', 'pause', 'timeupdate', 'durationchange', 
      'loadstart', 'canplay', 'error', 'ended', 'volumechange'
    ];

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, new Set());
      this.audioElement.addEventListener(eventType, (event) => {
        this.notifyListeners(eventType, event);
      });
    });
  }

  private notifyListeners(eventType: PlayerEventType, event?: Event): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  public addEventListener(eventType: PlayerEventType, callback: PlayerEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  public removeEventListener(eventType: PlayerEventType, callback: PlayerEventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  public async play(song?: Song): Promise<void> {
    try {
      if (this.playPromise) {
        await this.playPromise;
      }

      if (song) {
        await this.loadSong(song);
      }

      this.playPromise = this.audioElement.play();
      await this.playPromise;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    } finally {
      this.playPromise = null;
    }
  }

  public pause(): void {
    if (!this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  public seek(time: number): void {
    if (!isNaN(time) && time >= 0 && time <= this.audioElement.duration) {
      this.audioElement.currentTime = time;
    }
  }

  public setVolume(volume: number): void {
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  public getCurrentTime(): number {
    return this.audioElement.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioElement.duration || 0;
  }

  public getVolume(): number {
    return this.audioElement.volume;
  }

  public isPaused(): boolean {
    return this.audioElement.paused;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  private async loadSong(song: Song): Promise<void> {
    try {
      const cachedSong = await this.cacheManager?.get(song.id);
      if (cachedSong) {
        this.audioElement.src = cachedSong.filePath;
      } else if (song.uploadedBy === 'community' && song.filePath.startsWith('data:audio/')) {
        this.audioElement.src = song.filePath;
        void this.cacheManager?.set(song.id, song);
      } else {
        this.audioElement.src = song.filePath;
        if (song.id) {
          void this.cacheManager?.set(song.id, song);
        }
      }

      // Add to recently played
      try {
        await db.addToRecentlyPlayed(song);
      } catch (error) {
        console.warn('Failed to add to recently played:', error);
      }
    } catch (error) {
      console.error('Error loading song:', error);
      throw error;
    }
  }

  public cleanup(): void {
    // Clear all event listeners
    this.eventListeners.forEach((listeners) => {
      listeners.clear();
    });
    this.eventListeners.clear();

    // Cleanup managers
    this.playerManager?.cleanup();
    this.cacheManager?.destroy();

    // Reset audio element
    this.audioElement.src = '';
    this.audioElement.load();

    this.playerManager = null;
    this.cacheManager = null;
  }

  public destroy(): void {
    this.cleanup();
    PlayerService.instance = null as any;
  }
}
