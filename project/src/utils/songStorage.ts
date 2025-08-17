import { Song } from '../types';
import { db } from './indexedDB';
import { v4 as uuidv4 } from 'uuid';

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  uploadedBy: string;
  uploaderUsername: string;
  filePath: string;
  uploadedAt: Date;
  fileHash?: string; // For deduplication
}

class SongStorageManager {
  private static instance: SongStorageManager;
  private readonly API_BASE = '/api/songs';

  private constructor() {}

  static getInstance(): SongStorageManager {
    if (!SongStorageManager.instance) {
      SongStorageManager.instance = new SongStorageManager();
    }
    return SongStorageManager.instance;
  }

  async ensureStorageExists(): Promise<void> {
    // Check if we can access the metadata endpoint
    try {
      const response = await fetch(`${this.API_BASE}/metadata`);
      if (!response.ok) {
        throw new Error('Storage system not initialized');
      }
    } catch (error) {
      console.error('Failed to access song storage:', error);
      throw error;
    }
  }

  private async getMetadata(): Promise<SongMetadata[]> {
    try {
      const response = await fetch(`${this.API_BASE}/metadata`);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      return await response.json();
    } catch {
      return [];
    }
  }

  async storeSong(
    file: File,
    metadata: Pick<SongMetadata, 'title' | 'artist' | 'uploadedBy' | 'uploaderUsername'>
  ): Promise<SongMetadata> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`${this.API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload song');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to store song:', error);
      throw new Error('Failed to store song');
    }
  }

  async deleteSong(id: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete song');
    }
  }

  async getSongMetadata(id: string): Promise<SongMetadata | null> {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  async getAllSongMetadata(): Promise<SongMetadata[]> {
    return this.getMetadata();
  }
}

export const songStorage = SongStorageManager.getInstance();
