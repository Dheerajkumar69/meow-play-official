import { supabase } from './supabase';
import { Song, User } from '../types';

interface UserListeningHistory {
  user_id: string;
  song_id: string;
  play_count: number;
  last_played: string;
  liked: boolean;
  song?: Song;
}

interface SimilarityScore {
  user_id: string;
  similarity: number;
}

interface MoodProfile {
  energy: number; // 0-1
  valence: number; // 0-1 (sad to happy)
  danceability: number; // 0-1
  acousticness: number; // 0-1
  tempo: number; // BPM
}

export class AIRecommendationEngine {
  // Collaborative Filtering - Find similar users
  static async findSimilarUsers(userId: string, limit: number = 10): Promise<SimilarityScore[]> {
    try {
      // Get user's listening history
      const { data: userHistory } = await supabase
        .from('user_listening_history')
        .select('song_id, play_count, liked')
        .eq('user_id', userId);

      if (!userHistory || userHistory.length === 0) return [];

      // Get all other users' listening history
      const { data: allHistory } = await supabase
        .from('user_listening_history')
        .select('user_id, song_id, play_count, liked')
        .neq('user_id', userId);

      if (!allHistory) return [];

      // Calculate similarity scores using cosine similarity
      const userSongs = new Set(userHistory.map(h => h.song_id));
      const userScores = new Map<string, number>();
      
      // Group by user
      const otherUsers = new Map<string, typeof userHistory>();
      allHistory.forEach(history => {
        if (!otherUsers.has(history.user_id)) {
          otherUsers.set(history.user_id, []);
        }
        otherUsers.get(history.user_id)!.push(history);
      });

      // Calculate similarity for each user
      otherUsers.forEach((otherHistory, otherUserId) => {
        const otherSongs = new Set(otherHistory.map(h => h.song_id));
        const commonSongs = new Set([...userSongs].filter(s => otherSongs.has(s)));
        
        if (commonSongs.size === 0) return;

        // Calculate cosine similarity
        let dotProduct = 0;
        let userMagnitude = 0;
        let otherMagnitude = 0;

        const userMap = new Map(userHistory.map(h => [h.song_id, h.play_count * (h.liked ? 2 : 1)]));
        const otherMap = new Map(otherHistory.map(h => [h.song_id, h.play_count * (h.liked ? 2 : 1)]));

        commonSongs.forEach(songId => {
          const userScore = userMap.get(songId) || 0;
          const otherScore = otherMap.get(songId) || 0;
          dotProduct += userScore * otherScore;
        });

        userHistory.forEach(h => {
          const score = h.play_count * (h.liked ? 2 : 1);
          userMagnitude += score * score;
        });

        otherHistory.forEach(h => {
          const score = h.play_count * (h.liked ? 2 : 1);
          otherMagnitude += score * score;
        });

        const similarity = dotProduct / (Math.sqrt(userMagnitude) * Math.sqrt(otherMagnitude));
        userScores.set(otherUserId, similarity);
      });

      return Array.from(userScores.entries())
        .map(([user_id, similarity]) => ({ user_id, similarity }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  // Get recommendations based on similar users
  static async getCollaborativeRecommendations(userId: string, limit: number = 20): Promise<Song[]> {
    try {
      const similarUsers = await this.findSimilarUsers(userId, 5);
      if (similarUsers.length === 0) return [];

      const similarUserIds = similarUsers.map(u => u.user_id);

      // Get user's already played songs to exclude them
      const { data: userSongs } = await supabase
        .from('user_listening_history')
        .select('song_id')
        .eq('user_id', userId);

      const excludeSongIds = userSongs?.map(h => h.song_id) || [];

      // Get highly rated songs from similar users
      const { data: recommendations } = await supabase
        .from('user_listening_history')
        .select(`
          song_id,
          play_count,
          liked,
          song:songs(*)
        `)
        .in('user_id', similarUserIds)
        .not('song_id', 'in', `(${excludeSongIds.join(',')})`)
        .gte('play_count', 3)
        .order('play_count', { ascending: false })
        .limit(limit * 2); // Get more to filter

      if (!recommendations) return [];

      // Score and rank recommendations
      const songScores = new Map<string, { song: Song; score: number }>();
      
      recommendations.forEach(rec => {
        if (!rec.song) return;
        
        const currentScore = songScores.get(rec.song_id)?.score || 0;
        const userSimilarity = similarUsers.find(u => u.user_id === rec.user_id)?.similarity || 0;
        const score = currentScore + (rec.play_count * (rec.liked ? 2 : 1) * userSimilarity);
        
        songScores.set(rec.song_id, {
          song: rec.song as Song,
          score
        });
      });

      return Array.from(songScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.song);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  // Content-based filtering using song features
  static async getContentBasedRecommendations(userId: string, limit: number = 20): Promise<Song[]> {
    try {
      // Get user's liked songs to analyze preferences
      const { data: likedSongs } = await supabase
        .from('user_listening_history')
        .select(`
          song:songs(*)
        `)
        .eq('user_id', userId)
        .eq('liked', true)
        .limit(50);

      if (!likedSongs || likedSongs.length === 0) return [];

      // Calculate user's preference profile
      const userProfile = this.calculateUserMoodProfile(likedSongs.map(l => l.song as Song));

      // Find songs with similar characteristics
      const { data: allSongs } = await supabase
        .from('songs')
        .select('*')
        .limit(1000); // Limit for performance

      if (!allSongs) return [];

      // Get user's already played songs to exclude them
      const { data: userHistory } = await supabase
        .from('user_listening_history')
        .select('song_id')
        .eq('user_id', userId);

      const excludeSongIds = new Set(userHistory?.map(h => h.song_id) || []);

      // Score songs based on similarity to user profile
      const scoredSongs = allSongs
        .filter(song => !excludeSongIds.has(song.id))
        .map(song => ({
          song,
          score: this.calculateSongSimilarity(userProfile, this.extractSongFeatures(song))
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredSongs.map(item => item.song);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  // Time-based recommendations
  static async getTimeBasedRecommendations(userId: string, limit: number = 10): Promise<Song[]> {
    try {
      const currentHour = new Date().getHours();
      let moodFilter: Partial<MoodProfile>;

      // Define mood preferences by time of day
      if (currentHour >= 6 && currentHour < 12) {
        // Morning: Energetic, upbeat
        moodFilter = { energy: 0.7, valence: 0.7, tempo: 120 };
      } else if (currentHour >= 12 && currentHour < 18) {
        // Afternoon: Moderate energy, focus music
        moodFilter = { energy: 0.6, valence: 0.6, acousticness: 0.4 };
      } else if (currentHour >= 18 && currentHour < 22) {
        // Evening: Relaxed, social
        moodFilter = { energy: 0.5, valence: 0.6, danceability: 0.6 };
      } else {
        // Night: Calm, low energy
        moodFilter = { energy: 0.3, valence: 0.4, acousticness: 0.7 };
      }

      // Get songs matching the time-based mood
      const { data: songs } = await supabase
        .from('songs')
        .select('*')
        .limit(200);

      if (!songs) return [];

      // Get user's already played songs to exclude them
      const { data: userHistory } = await supabase
        .from('user_listening_history')
        .select('song_id')
        .eq('user_id', userId);

      const excludeSongIds = new Set(userHistory?.map(h => h.song_id) || []);

      // Score songs based on time-based mood preferences
      const scoredSongs = songs
        .filter(song => !excludeSongIds.has(song.id))
        .map(song => ({
          song,
          score: this.calculateMoodMatch(moodFilter, this.extractSongFeatures(song))
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredSongs.map(item => item.song);
    } catch (error) {
      console.error('Error getting time-based recommendations:', error);
      return [];
    }
  }

  // Hybrid recommendations combining all methods
  static async getHybridRecommendations(userId: string, limit: number = 20): Promise<Song[]> {
    try {
      const [collaborative, contentBased, timeBased] = await Promise.all([
        this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.5)),
        this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.3)),
        this.getTimeBasedRecommendations(userId, Math.ceil(limit * 0.2))
      ]);

      // Combine and deduplicate
      const allRecommendations = new Map<string, Song>();
      
      collaborative.forEach(song => allRecommendations.set(song.id, song));
      contentBased.forEach(song => allRecommendations.set(song.id, song));
      timeBased.forEach(song => allRecommendations.set(song.id, song));

      return Array.from(allRecommendations.values()).slice(0, limit);
    } catch (error) {
      console.error('Error getting hybrid recommendations:', error);
      return [];
    }
  }

  // Helper methods
  private static calculateUserMoodProfile(songs: Song[]): MoodProfile {
    if (songs.length === 0) {
      return { energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.5, tempo: 120 };
    }

    const features = songs.map(song => this.extractSongFeatures(song));
    
    return {
      energy: features.reduce((sum, f) => sum + f.energy, 0) / features.length,
      valence: features.reduce((sum, f) => sum + f.valence, 0) / features.length,
      danceability: features.reduce((sum, f) => sum + f.danceability, 0) / features.length,
      acousticness: features.reduce((sum, f) => sum + f.acousticness, 0) / features.length,
      tempo: features.reduce((sum, f) => sum + f.tempo, 0) / features.length
    };
  }

  private static extractSongFeatures(song: Song): MoodProfile {
    // Extract features from song metadata or use defaults
    // In a real implementation, you'd use audio analysis APIs
    const title = song.title.toLowerCase();
    const genre = song.genre?.toLowerCase() || '';
    
    let energy = 0.5;
    let valence = 0.5;
    let danceability = 0.5;
    let acousticness = 0.5;
    let tempo = 120;

    // Simple heuristics based on genre and title
    if (genre.includes('rock') || genre.includes('metal')) {
      energy = 0.8;
      valence = 0.6;
      tempo = 140;
    } else if (genre.includes('classical') || genre.includes('ambient')) {
      energy = 0.2;
      acousticness = 0.9;
      tempo = 80;
    } else if (genre.includes('dance') || genre.includes('electronic')) {
      energy = 0.9;
      danceability = 0.9;
      tempo = 128;
    } else if (genre.includes('jazz') || genre.includes('blues')) {
      energy = 0.4;
      valence = 0.4;
      acousticness = 0.7;
      tempo = 100;
    }

    // Adjust based on title keywords
    if (title.includes('sad') || title.includes('cry')) valence = 0.2;
    if (title.includes('happy') || title.includes('joy')) valence = 0.8;
    if (title.includes('dance') || title.includes('party')) danceability = 0.8;

    return { energy, valence, danceability, acousticness, tempo };
  }

  private static calculateSongSimilarity(userProfile: MoodProfile, songFeatures: MoodProfile): number {
    const weights = {
      energy: 0.3,
      valence: 0.3,
      danceability: 0.2,
      acousticness: 0.1,
      tempo: 0.1
    };

    let similarity = 0;
    similarity += weights.energy * (1 - Math.abs(userProfile.energy - songFeatures.energy));
    similarity += weights.valence * (1 - Math.abs(userProfile.valence - songFeatures.valence));
    similarity += weights.danceability * (1 - Math.abs(userProfile.danceability - songFeatures.danceability));
    similarity += weights.acousticness * (1 - Math.abs(userProfile.acousticness - songFeatures.acousticness));
    similarity += weights.tempo * (1 - Math.abs(userProfile.tempo - songFeatures.tempo) / 100);

    return similarity;
  }

  private static calculateMoodMatch(targetMood: Partial<MoodProfile>, songFeatures: MoodProfile): number {
    let score = 0;
    let count = 0;

    Object.entries(targetMood).forEach(([key, value]) => {
      if (value !== undefined) {
        const songValue = songFeatures[key as keyof MoodProfile];
        if (key === 'tempo') {
          score += 1 - Math.abs(value - songValue) / 100;
        } else {
          score += 1 - Math.abs(value - songValue);
        }
        count++;
      }
    });

    return count > 0 ? score / count : 0;
  }

  // Track user interactions for learning
  static async trackInteraction(userId: string, songId: string, interactionType: 'play' | 'like' | 'skip'): Promise<void> {
    try {
      // Update or insert listening history
      const { data: existing } = await supabase
        .from('user_listening_history')
        .select('*')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .single();

      if (existing) {
        const updates: any = { last_played: new Date().toISOString() };
        
        if (interactionType === 'play') {
          updates.play_count = existing.play_count + 1;
        } else if (interactionType === 'like') {
          updates.liked = true;
        }

        await supabase
          .from('user_listening_history')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_listening_history')
          .insert({
            user_id: userId,
            song_id: songId,
            play_count: interactionType === 'play' ? 1 : 0,
            liked: interactionType === 'like',
            last_played: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}
