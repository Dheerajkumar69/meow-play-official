// Shared song database manager
import { Song } from '../types';
import { audioMetadataExtractor } from './audioMetadata';
import { v4 as uuidv4 } from 'uuid';
import { errorService } from '../services/ErrorService';
import { withDatabaseRetry } from './retry';

export interface SharedSong extends Song {
  uploadedBy: string;
  uploaderUsername: string;
  isShared: boolean;
  uploadedAt: Date;
  downloadCount: number;
  likes: number;
  reports: number;
  status: 'active' | 'pending' | 'removed';
}

class SharedDatabaseManager {
  private static instance: SharedDatabaseManager;
  private sharedSongsKey = 'meow_play_shared_songs';
  private userUploadsKey = 'meow_play_user_uploads';

  static getInstance(): SharedDatabaseManager {
    if (!SharedDatabaseManager.instance) {
      SharedDatabaseManager.instance = new SharedDatabaseManager();
    }
    return SharedDatabaseManager.instance;
  }

  // Upload song to shared database
  async uploadToSharedDatabase(
    file: File, 
    userId: string, 
    username: string,
    customMetadata?: Partial<Song>
  ): Promise<SharedSong> {
    try {
      // Extract metadata automatically
      const metadata = await audioMetadataExtractor.extractMetadata(file);
      
      // Convert file to base64 for storage (in production, use proper file storage)
      const audioBase64 = await this.fileToBase64(file);
      
      // Create shared song object
      const sharedSong: SharedSong = {
        id: uuidv4(),
        title: customMetadata?.title || metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: customMetadata?.artist || metadata.artist || 'Unknown Artist',
        album: customMetadata?.album || metadata.album,
        genre: customMetadata?.genre || metadata.genre,
        duration: metadata.duration || 180,
        filePath: audioBase64,
        coverArt: metadata.coverArt || customMetadata?.coverArt,
        uploadedBy: userId,
        uploaderUsername: username,
        isShared: true,
        uploadedAt: new Date(),
        createdAt: new Date(),
        downloadCount: 0,
        likes: 0,
        reports: 0,
        status: 'active',
        playCount: 0,
        liked: false,
        mood: customMetadata?.mood || [],
        tempo: metadata.duration ? Math.floor(120 + Math.random() * 60) : undefined,
        key: customMetadata?.key,
        description: customMetadata?.description
      };

      // Save to shared database
      await this.saveSharedSong(sharedSong);
      
      // Track user upload
      await this.trackUserUpload(userId, sharedSong.id);
      
      return sharedSong;
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'upload', 'shared_songs');
      throw new Error('Failed to upload song to shared database');
    }
  }

  // Convert file to base64 for storage
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Convert base64 back to blob URL for playback
  async createPlayableUrl(base64Data: string): Promise<string> {
    try {
      // If it's already a base64 data URL, return as is for audio element
      if (base64Data.startsWith('data:audio/')) {
        return base64Data;
      }
      
      // If it's a regular URL, return as is
      if (base64Data.startsWith('http') || base64Data.startsWith('blob:')) {
        return base64Data;
      }
      
      // Otherwise, assume it's base64 and create data URL
      return `data:audio/mpeg;base64,${base64Data}`;
    } catch (error) {
      await errorService.log(error as Error, { context: { operation: 'createPlayableUrl' } });
      return base64Data;
    }
  }
  // Get all shared songs
  async getSharedSongs(): Promise<SharedSong[]> {
    try {
      const stored = localStorage.getItem(this.sharedSongsKey);
      if (!stored) return [];
      
      const songs = JSON.parse(stored);
      return songs.map((song: any) => ({
        ...song,
        uploadedAt: new Date(song.uploadedAt),
        createdAt: new Date(song.createdAt)
      })).filter((song: SharedSong) => song.status === 'active');
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'get', 'shared_songs');
      return [];
    }
  }

  // Get songs by user
  async getUserUploads(userId: string): Promise<SharedSong[]> {
    const allSongs = await this.getAllSharedSongs(); // Include all statuses for user's own uploads
    return allSongs.filter(song => song.uploadedBy === userId);
  }

  // Get all songs (admin only)
  async getAllSharedSongs(): Promise<SharedSong[]> {
    try {
      const stored = localStorage.getItem(this.sharedSongsKey);
      if (!stored) return [];
      
      const songs = JSON.parse(stored);
      return songs.map((song: any) => ({
        ...song,
        uploadedAt: new Date(song.uploadedAt),
        createdAt: new Date(song.createdAt)
      }));
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'getAll', 'shared_songs');
      return [];
    }
  }

  // Delete song (admin only)
  async deleteSong(songId: string, adminUserId: string): Promise<void> {
    try {
      const songs = this.getAllSharedSongs();
      const songIndex = songs.findIndex(song => song.id === songId);
      
      if (songIndex === -1) {
        throw new Error('Song not found');
      }

      const song = songs[songIndex];
      
      // Mark as removed instead of deleting completely (for audit trail)
      song.status = 'removed';
      
      // Save updated songs
      await this.saveAllSharedSongs(songs);
      
      // Log successful admin action
      errorService.log(new Error(`Song "${song.title}" removed by admin ${adminUserId}`), {
        severity: 'low',
        tags: ['admin'],
        context: { operation: 'delete', songId, adminUserId }
      });
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'delete', 'shared_songs');
      throw new Error('Failed to delete song');
    }
  }

  // Like/unlike song
  async toggleLike(songId: string, userId: string): Promise<void> {
    try {
      const songs = this.getAllSharedSongs();
      const song = songs.find(s => s.id === songId);
      
      if (song) {
        // Simple like toggle (in real app, track individual user likes)
        song.likes = Math.max(0, song.likes + (Math.random() > 0.5 ? 1 : -1));
        await this.saveAllSharedSongs(songs);
      }
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'toggleLike', 'shared_songs');
    }
  }

  // Increment download count
  async incrementDownloadCount(songId: string): Promise<void> {
    try {
      const songs = this.getAllSharedSongs();
      const song = songs.find(s => s.id === songId);
      
      if (song) {
        song.downloadCount++;
        await this.saveAllSharedSongs(songs);
      }
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'incrementDownloadCount', 'shared_songs');
    }
  }

  // Search shared songs
  async searchSharedSongs(query: string): Promise<SharedSong[]> {
    const songs = await this.getSharedSongs();
    const searchTerm = query.toLowerCase();
    
    return songs.filter(song =>
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm) ||
      song.album?.toLowerCase().includes(searchTerm) ||
      song.uploaderUsername.toLowerCase().includes(searchTerm) ||
      song.genre?.toLowerCase().includes(searchTerm)
    );
  }

  // Get trending songs
  async getTrendingSongs(limit: number = 20): Promise<SharedSong[]> {
    const songs = await this.getSharedSongs();
    
    // Sort by a combination of likes, downloads, and recency
    return songs.sort((a, b) => {
      const scoreA = (a.likes * 2) + a.downloadCount + (a.playCount || 0);
      const scoreB = (b.likes * 2) + b.downloadCount + (b.playCount || 0);
      return scoreB - scoreA;
    }).slice(0, limit);
  }

  // Get recent uploads
  async getRecentUploads(limit: number = 20): Promise<SharedSong[]> {
    const songs = await this.getSharedSongs();
    return songs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, limit);
  }

  // Private helper methods
  private async saveSharedSong(song: SharedSong): Promise<void> {
    const songs = this.getAllSharedSongs();
    songs.push(song);
    await this.saveAllSharedSongs(songs);
  }

  private async saveAllSharedSongs(songs: SharedSong[]): Promise<void> {
    try {
      localStorage.setItem(this.sharedSongsKey, JSON.stringify(songs));
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'save', 'shared_songs');
      throw new Error('Failed to save to database');
    }
  }

  private async trackUserUpload(userId: string, songId: string): Promise<void> {
    try {
      const uploads = await this.getUserUploadHistory(userId);
      uploads.push({
        songId,
        uploadedAt: new Date()
      });
      
      localStorage.setItem(`${this.userUploadsKey}_${userId}`, JSON.stringify(uploads));
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'trackUserUpload', 'user_uploads');
    }
  }

  private async getUserUploadHistory(userId: string): Promise<Array<{ songId: string; uploadedAt: Date }>> {
    try {
      const stored = localStorage.getItem(`${this.userUploadsKey}_${userId}`);
      if (!stored) return [];
      
      const uploads = JSON.parse(stored);
      return uploads.map((upload: any) => ({
        ...upload,
        uploadedAt: new Date(upload.uploadedAt)
      }));
    } catch (error) {
      await errorService.logDatabaseError(error as Error, 'getUserUploadHistory', 'user_uploads');
      return [];
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    totalSongs: number;
    totalUploaders: number;
    totalDownloads: number;
    totalLikes: number;
    recentUploads: number;
  }> {
    const songs = await this.getSharedSongs();
    const uploaders = new Set(songs.map(song => song.uploadedBy));
    const recentUploads = songs.filter(song => {
      const daysSinceUpload = (Date.now() - song.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpload <= 7;
    }).length;

    return {
      totalSongs: songs.length,
      totalUploaders: uploaders.size,
      totalDownloads: songs.reduce((sum, song) => sum + song.downloadCount, 0),
      totalLikes: songs.reduce((sum, song) => sum + song.likes, 0),
      recentUploads
    };
  }
}

export const sharedDatabase = SharedDatabaseManager.getInstance();