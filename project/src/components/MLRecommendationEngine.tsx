/**
 * Machine Learning Recommendation Engine
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Song, Artist, Playlist } from '../types/music';
import { useAppSelector } from '../store';

interface RecommendationScore {
  songId: string;
  score: number;
  reasons: string[];
}

interface UserProfile {
  favoriteGenres: Record<string, number>;
  favoriteArtists: Record<string, number>;
  listeningPatterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    sessionLength: number[];
  };
  audioFeatures: {
    energy: number;
    valence: number;
    danceability: number;
    acousticness: number;
    tempo: number;
  };
}

export class MLRecommendationEngine {
  private static instance: MLRecommendationEngine;
  private userProfile: UserProfile | null = null;
  private modelWeights = {
    collaborative: 0.4,
    contentBased: 0.3,
    contextual: 0.2,
    popularity: 0.1
  };

  static getInstance(): MLRecommendationEngine {
    if (!MLRecommendationEngine.instance) {
      MLRecommendationEngine.instance = new MLRecommendationEngine();
    }
    return MLRecommendationEngine.instance;
  }

  /**
   * Build user profile from listening history
   */
  buildUserProfile(
    listeningHistory: Song[],
    likedSongs: string[],
    playCount: Record<string, number>,
    skipCount: Record<string, number>
  ): UserProfile {
    const profile: UserProfile = {
      favoriteGenres: {},
      favoriteArtists: {},
      listeningPatterns: {
        timeOfDay: {},
        dayOfWeek: {},
        sessionLength: []
      },
      audioFeatures: {
        energy: 0,
        valence: 0,
        danceability: 0,
        acousticness: 0,
        tempo: 0
      }
    };

    // Analyze genre preferences
    listeningHistory.forEach(song => {
      if (song.genre) {
        profile.favoriteGenres[song.genre] = (profile.favoriteGenres[song.genre] || 0) + 1;
      }
      
      // Weight by play count and likes
      const weight = (playCount[song.id] || 1) * (likedSongs.includes(song.id) ? 2 : 1);
      profile.favoriteArtists[song.artist] = (profile.favoriteArtists[song.artist] || 0) + weight;
    });

    // Calculate average audio features from liked songs
    const likedSongData = listeningHistory.filter(song => likedSongs.includes(song.id));
    if (likedSongData.length > 0) {
      const features = likedSongData.reduce((acc, song) => {
        acc.energy += song.audioFeatures?.energy || 0.5;
        acc.valence += song.audioFeatures?.valence || 0.5;
        acc.danceability += song.audioFeatures?.danceability || 0.5;
        acc.acousticness += song.audioFeatures?.acousticness || 0.5;
        acc.tempo += song.audioFeatures?.tempo || 120;
        return acc;
      }, { energy: 0, valence: 0, danceability: 0, acousticness: 0, tempo: 0 });

      profile.audioFeatures = {
        energy: features.energy / likedSongData.length,
        valence: features.valence / likedSongData.length,
        danceability: features.danceability / likedSongData.length,
        acousticness: features.acousticness / likedSongData.length,
        tempo: features.tempo / likedSongData.length
      };
    }

    this.userProfile = profile;
    return profile;
  }

  /**
   * Content-based filtering using audio features
   */
  private contentBasedScore(song: Song, userProfile: UserProfile): number {
    if (!song.audioFeatures || !userProfile.audioFeatures) return 0.5;

    const featureWeights = {
      energy: 0.25,
      valence: 0.25,
      danceability: 0.2,
      acousticness: 0.15,
      tempo: 0.15
    };

    let similarity = 0;
    
    // Calculate cosine similarity for audio features
    Object.entries(featureWeights).forEach(([feature, weight]) => {
      const userValue = userProfile.audioFeatures[feature as keyof typeof userProfile.audioFeatures];
      const songValue = song.audioFeatures[feature as keyof typeof song.audioFeatures];
      
      if (feature === 'tempo') {
        // Normalize tempo difference
        const tempoDiff = Math.abs(userValue - songValue) / 200;
        similarity += weight * (1 - Math.min(tempoDiff, 1));
      } else {
        // For other features (0-1 range)
        similarity += weight * (1 - Math.abs(userValue - songValue));
      }
    });

    return similarity;
  }

  /**
   * Collaborative filtering based on similar users
   */
  private collaborativeScore(song: Song, userProfile: UserProfile, allUsers: any[]): number {
    // Simplified collaborative filtering
    // In production, this would use matrix factorization or deep learning
    
    let score = 0;
    let similarUsers = 0;

    allUsers.forEach(otherUser => {
      const similarity = this.calculateUserSimilarity(userProfile, otherUser.profile);
      if (similarity > 0.3) { // Threshold for similar users
        similarUsers++;
        if (otherUser.likedSongs.includes(song.id)) {
          score += similarity;
        }
      }
    });

    return similarUsers > 0 ? score / similarUsers : 0.5;
  }

  /**
   * Calculate similarity between two user profiles
   */
  private calculateUserSimilarity(profile1: UserProfile, profile2: UserProfile): number {
    // Genre similarity
    const genres1 = Object.keys(profile1.favoriteGenres);
    const genres2 = Object.keys(profile2.favoriteGenres);
    const commonGenres = genres1.filter(g => genres2.includes(g));
    const genreSimilarity = commonGenres.length / Math.max(genres1.length, genres2.length);

    // Artist similarity
    const artists1 = Object.keys(profile1.favoriteArtists);
    const artists2 = Object.keys(profile2.favoriteArtists);
    const commonArtists = artists1.filter(a => artists2.includes(a));
    const artistSimilarity = commonArtists.length / Math.max(artists1.length, artists2.length);

    // Audio feature similarity
    const featureSimilarity = 1 - Object.keys(profile1.audioFeatures).reduce((diff, feature) => {
      const f1 = profile1.audioFeatures[feature as keyof typeof profile1.audioFeatures];
      const f2 = profile2.audioFeatures[feature as keyof typeof profile2.audioFeatures];
      return diff + Math.abs(f1 - f2);
    }, 0) / Object.keys(profile1.audioFeatures).length;

    return (genreSimilarity * 0.4 + artistSimilarity * 0.4 + featureSimilarity * 0.2);
  }

  /**
   * Contextual scoring based on time, mood, etc.
   */
  private contextualScore(song: Song, context: { timeOfDay: string; mood?: string }): number {
    let score = 0.5;

    // Time-based recommendations
    const timePreferences = {
      morning: { energy: 0.7, valence: 0.8 },
      afternoon: { energy: 0.6, valence: 0.6 },
      evening: { energy: 0.4, valence: 0.5 },
      night: { energy: 0.3, valence: 0.4 }
    };

    const timePrefs = timePreferences[context.timeOfDay as keyof typeof timePreferences];
    if (timePrefs && song.audioFeatures) {
      const energyMatch = 1 - Math.abs(song.audioFeatures.energy - timePrefs.energy);
      const valenceMatch = 1 - Math.abs(song.audioFeatures.valence - timePrefs.valence);
      score = (energyMatch + valenceMatch) / 2;
    }

    return score;
  }

  /**
   * Popularity-based scoring
   */
  private popularityScore(song: Song, globalPlayCount: Record<string, number>): number {
    const maxPlays = Math.max(...Object.values(globalPlayCount));
    const songPlays = globalPlayCount[song.id] || 0;
    return maxPlays > 0 ? songPlays / maxPlays : 0;
  }

  /**
   * Generate recommendations using ensemble method
   */
  generateRecommendations(
    candidateSongs: Song[],
    userProfile: UserProfile,
    context: { timeOfDay: string; mood?: string },
    allUsers: any[] = [],
    globalPlayCount: Record<string, number> = {},
    excludeSongs: string[] = [],
    limit: number = 20
  ): RecommendationScore[] {
    const recommendations: RecommendationScore[] = [];

    candidateSongs
      .filter(song => !excludeSongs.includes(song.id))
      .forEach(song => {
        const scores = {
          contentBased: this.contentBasedScore(song, userProfile),
          collaborative: this.collaborativeScore(song, userProfile, allUsers),
          contextual: this.contextualScore(song, context),
          popularity: this.popularityScore(song, globalPlayCount)
        };

        // Weighted ensemble score
        const finalScore = 
          scores.contentBased * this.modelWeights.contentBased +
          scores.collaborative * this.modelWeights.collaborative +
          scores.contextual * this.modelWeights.contextual +
          scores.popularity * this.modelWeights.popularity;

        // Generate explanation
        const reasons: string[] = [];
        if (scores.contentBased > 0.7) reasons.push('Similar to your music taste');
        if (scores.collaborative > 0.6) reasons.push('Liked by similar users');
        if (scores.contextual > 0.6) reasons.push(`Perfect for ${context.timeOfDay}`);
        if (scores.popularity > 0.8) reasons.push('Trending now');
        if (userProfile.favoriteGenres[song.genre || ''] > 5) reasons.push(`You love ${song.genre}`);
        if (userProfile.favoriteArtists[song.artist] > 3) reasons.push(`You enjoy ${song.artist}`);

        recommendations.push({
          songId: song.id,
          score: finalScore,
          reasons: reasons.length > 0 ? reasons : ['Recommended for you']
        });
      });

    // Sort by score and apply diversity
    return this.applyDiversification(
      recommendations.sort((a, b) => b.score - a.score),
      candidateSongs
    ).slice(0, limit);
  }

  /**
   * Apply diversification to avoid echo chamber
   */
  private applyDiversification(
    recommendations: RecommendationScore[],
    songs: Song[]
  ): RecommendationScore[] {
    const diversified: RecommendationScore[] = [];
    const usedGenres = new Set<string>();
    const usedArtists = new Set<string>();

    recommendations.forEach(rec => {
      const song = songs.find(s => s.id === rec.songId);
      if (!song) return;

      // Promote diversity in genres and artists
      const genreCount = usedGenres.size;
      const artistCount = usedArtists.size;
      
      let diversityBonus = 0;
      if (song.genre && !usedGenres.has(song.genre)) {
        diversityBonus += 0.1;
        usedGenres.add(song.genre);
      }
      if (!usedArtists.has(song.artist)) {
        diversityBonus += 0.05;
        usedArtists.add(song.artist);
      }

      diversified.push({
        ...rec,
        score: rec.score + diversityBonus
      });
    });

    return diversified.sort((a, b) => b.score - a.score);
  }

  /**
   * Update model weights based on user feedback
   */
  updateModelWeights(feedback: {
    songId: string;
    liked: boolean;
    skipped: boolean;
    playTime: number;
  }[]): void {
    // Simple reinforcement learning approach
    // In production, this would use more sophisticated ML techniques
    
    const performance = {
      contentBased: 0,
      collaborative: 0,
      contextual: 0,
      popularity: 0
    };

    feedback.forEach(fb => {
      const weight = fb.liked ? 1 : (fb.skipped ? -0.5 : fb.playTime > 30 ? 0.5 : -0.2);
      
      // This is simplified - in reality you'd track which component contributed most
      Object.keys(performance).forEach(component => {
        performance[component as keyof typeof performance] += weight * 0.25;
      });
    });

    // Adjust weights slightly based on performance
    const adjustment = 0.05;
    Object.keys(this.modelWeights).forEach(component => {
      const perf = performance[component as keyof typeof performance];
      if (perf > 0) {
        this.modelWeights[component as keyof typeof this.modelWeights] += adjustment;
      } else if (perf < 0) {
        this.modelWeights[component as keyof typeof this.modelWeights] -= adjustment;
      }
    });

    // Normalize weights to sum to 1
    const totalWeight = Object.values(this.modelWeights).reduce((sum, w) => sum + w, 0);
    Object.keys(this.modelWeights).forEach(component => {
      this.modelWeights[component as keyof typeof this.modelWeights] /= totalWeight;
    });
  }
}

// React component for displaying recommendations
interface MLRecommendationsProps {
  className?: string;
}

export const MLRecommendations: React.FC<MLRecommendationsProps> = ({ className }) => {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loading, setLoading] = useState(false);
  
  const {
    songs,
    likedSongs,
    recentlyPlayed,
    playCount,
    skipCount
  } = useAppSelector(state => state.music);

  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    
    try {
      const engine = MLRecommendationEngine.getInstance();
      
      // Build user profile
      const userProfile = engine.buildUserProfile(
        recentlyPlayed,
        likedSongs,
        playCount,
        skipCount
      );

      // Get current context
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = hour < 6 ? 'night' : 
                       hour < 12 ? 'morning' : 
                       hour < 18 ? 'afternoon' : 'evening';

      // Generate recommendations
      const recs = engine.generateRecommendations(
        songs,
        userProfile,
        { timeOfDay },
        [], // Would include other users in production
        playCount,
        [...likedSongs, ...recentlyPlayed.map(s => s.id)],
        10
      );

      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [songs, likedSongs, recentlyPlayed, playCount, skipCount]);

  useEffect(() => {
    if (songs.length > 0 && recentlyPlayed.length > 0) {
      generateRecommendations();
    }
  }, [generateRecommendations, songs.length, recentlyPlayed.length]);

  if (loading) {
    return (
      <div className={`ml-recommendations ${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`ml-recommendations ${className || ''}`}>
      <h3 className="text-lg font-semibold mb-4 text-white">
        🎯 AI Recommendations
      </h3>
      
      <div className="space-y-2">
        {recommendations.map((rec, index) => {
          const song = songs.find(s => s.id === rec.songId);
          if (!song) return null;

          return (
            <div
              key={rec.songId}
              className="flex items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-white">{song.title}</h4>
                <p className="text-sm text-gray-400">{song.artist}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rec.reasons.slice(0, 2).map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-purple-400">
                  {Math.round(rec.score * 100)}% match
                </div>
                <div className="text-xs text-gray-500">
                  #{index + 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>Keep listening to get personalized recommendations!</p>
        </div>
      )}
    </div>
  );
};

export default MLRecommendations;
