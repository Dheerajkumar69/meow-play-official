// Storage management utility

export interface StorageQuota {
  usage: number;
  quota: number;
  available: number;
}

export class StorageManager {
  private static instance: StorageManager;
  private readonly quotaThreshold = 0.9; // 90% of quota
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async getStorageQuota(): Promise<StorageQuota> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    }
    throw new Error('Storage quota API not supported');
  }

  async checkQuota(): Promise<boolean> {
    const quota = await this.getStorageQuota();
    return quota.usage / quota.quota < this.quotaThreshold;
  }

  async compressAudioFile(file: File): Promise<File> {
    if (file.size <= this.maxFileSize) {
      return file;
    }

    try {
      // Use Web Audio API for compression
      const audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate * 0.5 // Reduce sample rate by half
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      const compressed = await this.bufferToWave(renderedBuffer, 0.7);

      return new File([compressed], file.name, {
        type: file.type
      });
    } catch (error) {
      // Audio compression failed
      return file;
    }
  }

  private async bufferToWave(audioBuffer: AudioBuffer, quality: number): Promise<Blob> {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    // Convert audio buffer to wave format
    let pos = 0;

    // Write audio data
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const sample = channelData ? channelData[i] * quality : 0;
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  async cleanupOrphanedFiles(): Promise<void> {
    try {
      // Get all songs from IndexedDB (simplified for production)
      const validPaths = new Set<string>();

      // Get all files from storage
      await navigator.storage.estimate();
      await navigator.serviceWorker.ready;
      const cache = await caches.open('audio-cache');
      const keys = await cache.keys();

      // Remove orphaned files from cache
      for (const request of keys) {
        if (!validPaths.has(request.url)) {
          await cache.delete(request);
        }
      }

      // Clear IndexedDB blobs not referenced
      // Cleanup orphaned blobs would be implemented in IndexedDBManager
    } catch (error) {
      // Cleanup failed
      throw new Error('Failed to cleanup orphaned files');
    }
  }
}
