// Shared song database manager
import { Song } from '../types';
import { audioMetadataExtractor } from './audioMetadata';
import { v4 as uuidv4 } from 'uuid';

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
    customMetadata?: Partial<Song>,
    posterFile?: File
  ): Promise<SharedSong> {
    try {
      // Extract metadata automatically
      const metadata = await audioMetadataExtractor.extractMetadata(file);
      
      // Convert file to base64 for storage (in production, use proper file storage)
      const audioBase64 = await this.fileToBase64(file);
      
      // Process poster file if provided
      let posterBase64 = null;
      if (posterFile) {
        posterBase64 = await audioMetadataExtractor.processPosterImage(posterFile);
      }
      
      // Create shared song object
      const sharedSong: SharedSong = {
        id: uuidv4(),
        title: customMetadata?.title || metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: customMetadata?.artist || metadata.artist || 'Unknown Artist',
        album: customMetadata?.album || metadata.album,
        genre: customMetadata?.genre || metadata.genre,
        duration: metadata.duration || 180,
        filePath: audioBase64,
        coverArt: posterBase64 || metadata.coverArt || customMetadata?.coverArt || '/assets/default-cover.svg',
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
      this.trackUserUpload(userId, sharedSong.id);
      
      return sharedSong;
    } catch (error) {
      console.error('Failed to upload to shared database:', error);
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
  createPlayableUrl(base64Data: string): string {
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
      console.error('Failed to create playable URL:', error);
      return base64Data;
    }
  }
  // Get all shared songs
  getSharedSongs(): SharedSong[] {
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
      console.error('Failed to get shared songs:', error);
      return [];
    }
  }

  // Get songs by user
  getUserUploads(userId: string): SharedSong[] {
    const allSongs = this.getAllSharedSongs(); // Include all statuses for user's own uploads
    return allSongs.filter(song => song.uploadedBy === userId);
  }

  // Get all songs (admin only)
  getAllSharedSongs(): SharedSong[] {
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
      console.error('Failed to get all shared songs:', error);
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
      
      console.log(`Song "${song.title}" removed by admin ${adminUserId}`);
    } catch (error) {
      console.error('Failed to delete song:', error);
      throw new Error('Failed to delete song');
    }
  }
  
  // Bulk delete songs (admin only)
  async bulkDeleteSongs(songIds: string[], adminUserId: string): Promise<{success: number, failed: number}> {
    try {
      const songs = this.getAllSharedSongs();
      let successCount = 0;
      let failedCount = 0;
      
      // Process each song ID
      for (const songId of songIds) {
        const songIndex = songs.findIndex(song => song.id === songId);
        
        if (songIndex !== -1) {
          // Mark as removed instead of deleting completely
          songs[songIndex].status = 'removed';
          successCount++;
          console.log(`Song "${songs[songIndex].title}" removed by admin ${adminUserId}`);
        } else {
          failedCount++;
        }
      }
      
      // Save all changes at once
      if (successCount > 0) {
        await this.saveAllSharedSongs(songs);
      }
      
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Failed to bulk delete songs:', error);
      throw new Error('Failed to bulk delete songs');
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
      console.error('Failed to toggle like:', error);
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
      console.error('Failed to increment download count:', error);
    }
  }

  // Search shared songs
  searchSharedSongs(query: string): SharedSong[] {
    const songs = this.getSharedSongs();
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
  getTrendingSongs(limit: number = 20): SharedSong[] {
    const songs = this.getSharedSongs();
    
    // Sort by a combination of likes, downloads, and recency
    return songs.sort((a, b) => {
      const scoreA = (a.likes * 2) + a.downloadCount + (a.playCount || 0);
      const scoreB = (b.likes * 2) + b.downloadCount + (b.playCount || 0);
      return scoreB - scoreA;
    }).slice(0, limit);
  }

  // Get recent uploads
  getRecentUploads(limit: number = 20): SharedSong[] {
    const songs = this.getSharedSongs();
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
      console.error('Failed to save shared songs:', error);
      throw new Error('Failed to save to database');
    }
  }

  private trackUserUpload(userId: string, songId: string): void {
    try {
      const uploads = this.getUserUploadHistory(userId);
      uploads.push({
        songId,
        uploadedAt: new Date()
      });
      
      localStorage.setItem(`${this.userUploadsKey}_${userId}`, JSON.stringify(uploads));
    } catch (error) {
      console.error('Failed to track user upload:', error);
    }
  }

  private getUserUploadHistory(userId: string): Array<{ songId: string; uploadedAt: Date }> {
    try {
      const stored = localStorage.getItem(`${this.userUploadsKey}_${userId}`);
      if (!stored) return [];
      
      const uploads = JSON.parse(stored);
      return uploads.map((upload: any) => ({
        ...upload,
        uploadedAt: new Date(upload.uploadedAt)
      }));
    } catch (error) {
      console.error('Failed to get user upload history:', error);
      return [];
    }
  }

  // Get database statistics
  getDatabaseStats(): {
    totalSongs: number;
    totalUploaders: number;
    totalDownloads: number;
    totalLikes: number;
    recentUploads: number;
  } {
    const songs = this.getSharedSongs();
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