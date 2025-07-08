// Dynamic playlist generation system
import { Song, Playlist, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ListeningHabits {
  favoriteGenres: { genre: string; weight: number }[];
  favoriteArtists: { artist: string; weight: number }[];
  playTimePreferences: { hour: number; weight: number }[];
  moodPreferences: { mood: string; weight: number }[];
  averageSessionLength: number;
  preferredTempo: 'slow' | 'medium' | 'fast' | 'mixed';
}

export interface PlaylistSuggestion {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  reason: string;
  confidence: number;
  coverArt?: string;
  tags: string[];
}

class PlaylistGeneratorManager {
  private static instance: PlaylistGeneratorManager;
  private weekendSpecialKey = 'meow_play_weekend_special';
  private lastWeekendUpdateKey = 'meow_play_last_weekend_update';
  private listeningHabitsKey = 'meow_play_listening_habits';

  static getInstance(): PlaylistGeneratorManager {
    if (!PlaylistGeneratorManager.instance) {
      PlaylistGeneratorManager.instance = new PlaylistGeneratorManager();
    }
    return PlaylistGeneratorManager.instance;
  }

  // Analyze user listening habits
  analyzeListeningHabits(songs: Song[], recentlyPlayed: Song[]): ListeningHabits {
    const genreCount: Record<string, number> = {};
    const artistCount: Record<string, number> = {};
    const moodCount: Record<string, number> = {};
    
    // Analyze all songs with play count weighting
    songs.forEach(song => {
      const playWeight = (song.playCount || 0) + 1;
      
      if (song.genre) {
        genreCount[song.genre] = (genreCount[song.genre] || 0) + playWeight;
      }
      
      artistCount[song.artist] = (artistCount[song.artist] || 0) + playWeight;
      
      if (song.mood) {
        song.mood.forEach(mood => {
          moodCount[mood] = (moodCount[mood] || 0) + playWeight;
        });
      }
    });

    // Weight recent plays more heavily
    recentlyPlayed.forEach(song => {
      const recentWeight = 3;
      
      if (song.genre) {
        genreCount[song.genre] = (genreCount[song.genre] || 0) + recentWeight;
      }
      
      artistCount[song.artist] = (artistCount[song.artist] || 0) + recentWeight;
      
      if (song.mood) {
        song.mood.forEach(mood => {
          moodCount[mood] = (moodCount[mood] || 0) + recentWeight;
        });
      }
    });

    // Convert to weighted arrays
    const favoriteGenres = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    const favoriteArtists = Object.entries(artistCount)
      .map(([artist, count]) => ({ artist, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

    const moodPreferences = Object.entries(moodCount)
      .map(([mood, count]) => ({ mood, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);

    // Mock time preferences (in real app, track actual listening times)
    const playTimePreferences = [
      { hour: 9, weight: 0.8 },   // Morning
      { hour: 14, weight: 0.6 },  // Afternoon
      { hour: 19, weight: 1.0 },  // Evening
      { hour: 22, weight: 0.9 }   // Night
    ];

    const habits: ListeningHabits = {
      favoriteGenres,
      favoriteArtists,
      playTimePreferences,
      moodPreferences,
      averageSessionLength: 45, // minutes
      preferredTempo: this.determinePreferredTempo(songs)
    };

    // Save habits for future use
    this.saveListeningHabits(habits);
    
    return habits;
  }

  private determinePreferredTempo(songs: Song[]): 'slow' | 'medium' | 'fast' | 'mixed' {
    const tempoCount = { slow: 0, medium: 0, fast: 0 };
    
    songs.forEach(song => {
      const playWeight = (song.playCount || 0) + 1;
      if (song.tempo) {
        if (song.tempo < 90) tempoCount.slow += playWeight;
        else if (song.tempo < 130) tempoCount.medium += playWeight;
        else tempoCount.fast += playWeight;
      }
    });

    const total = tempoCount.slow + tempoCount.medium + tempoCount.fast;
    if (total === 0) return 'mixed';

    const maxTempo = Object.entries(tempoCount).reduce((a, b) => a[1] > b[1] ? a : b);
    const maxPercentage = maxTempo[1] / total;

    return maxPercentage > 0.5 ? maxTempo[0] as any : 'mixed';
  }

  // Generate personalized playlist suggestions
  generateSuggestions(songs: Song[], habits: ListeningHabits): PlaylistSuggestion[] {
    const suggestions: PlaylistSuggestion[] = [];

    // 1. Favorite Genre Mix
    if (habits.favoriteGenres.length > 0) {
      const topGenre = habits.favoriteGenres[0];
      const genreSongs = songs
        .filter(song => song.genre === topGenre.genre)
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 15);

      if (genreSongs.length >= 5) {
        suggestions.push({
          id: `suggestion_genre_${topGenre.genre.toLowerCase()}`,
          name: `${topGenre.genre} Favorites 🎵`,
          description: `Your most loved ${topGenre.genre} tracks`,
          songs: genreSongs,
          reason: `You've played ${topGenre.genre} songs ${topGenre.weight} times`,
          confidence: 0.9,
          coverArt: genreSongs[0]?.coverArt,
          tags: ['genre', 'favorites', topGenre.genre.toLowerCase()]
        });
      }
    }

    // 2. Artist Deep Dive
    if (habits.favoriteArtists.length > 0) {
      const topArtist = habits.favoriteArtists[0];
      const artistSongs = songs
        .filter(song => song.artist === topArtist.artist)
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 12);

      if (artistSongs.length >= 3) {
        suggestions.push({
          id: `suggestion_artist_${topArtist.artist.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${topArtist.artist} Collection 🎤`,
          description: `Deep dive into ${topArtist.artist}'s music`,
          songs: artistSongs,
          reason: `${topArtist.artist} is your most played artist`,
          confidence: 0.85,
          coverArt: artistSongs[0]?.coverArt,
          tags: ['artist', 'collection', topArtist.artist.toLowerCase()]
        });
      }
    }

    // 3. Mood-based playlist
    if (habits.moodPreferences.length > 0) {
      const topMood = habits.moodPreferences[0];
      const moodSongs = songs
        .filter(song => song.mood?.includes(topMood.mood))
        .sort(() => Math.random() - 0.5) // Shuffle for variety
        .slice(0, 20);

      if (moodSongs.length >= 5) {
        suggestions.push({
          id: `suggestion_mood_${topMood.mood}`,
          name: `${topMood.mood.charAt(0).toUpperCase() + topMood.mood.slice(1)} Vibes 😸`,
          description: `Songs that match your ${topMood.mood} mood`,
          songs: moodSongs,
          reason: `You often listen to ${topMood.mood} music`,
          confidence: 0.8,
          coverArt: moodSongs[0]?.coverArt,
          tags: ['mood', topMood.mood, 'vibes']
        });
      }
    }

    // 4. Discovery Mix (lesser-played songs from favorite genres)
    const discoveryMix = songs
      .filter(song => {
        const isFavoriteGenre = habits.favoriteGenres.some(g => g.genre === song.genre);
        const isLowPlayed = (song.playCount || 0) < 3;
        return isFavoriteGenre && isLowPlayed;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);

    if (discoveryMix.length >= 5) {
      suggestions.push({
        id: 'suggestion_discovery_mix',
        name: 'Discovery Mix 🔍',
        description: 'Hidden gems from your favorite genres',
        songs: discoveryMix,
        reason: 'Based on your genre preferences',
        confidence: 0.7,
        coverArt: discoveryMix[0]?.coverArt,
        tags: ['discovery', 'hidden-gems', 'exploration']
      });
    }

    // 5. High-rated songs you haven't played much
    const hiddenGems = songs
      .filter(song => (song.averageRating || 0) >= 4.0 && (song.playCount || 0) < 2)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 12);

    if (hiddenGems.length >= 5) {
      suggestions.push({
        id: 'suggestion_hidden_gems',
        name: 'Hidden Gems 💎',
        description: 'Highly rated songs you might have missed',
        songs: hiddenGems,
        reason: 'These songs have great ratings but low play counts',
        confidence: 0.75,
        coverArt: hiddenGems[0]?.coverArt,
        tags: ['hidden-gems', 'high-rated', 'discovery']
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // Generate or update Weekend Special playlist
  generateWeekendSpecial(songs: Song[], habits: ListeningHabits): Playlist {
    const lastUpdate = this.getLastWeekendUpdate();
    const now = new Date();
    const daysSinceUpdate = lastUpdate ? Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)) : 7;

    // Check if we need to update (weekly refresh)
    if (daysSinceUpdate >= 7 || !this.getWeekendSpecial()) {
      const weekendSongs = this.selectWeekendSongs(songs, habits);
      
      const weekendPlaylist: Playlist = {
        id: 'weekend_special',
        name: '🐱 Weekend Special',
        description: `Curated weekly mix based on your listening habits • Updated ${now.toLocaleDateString()}`,
        songs: weekendSongs,
        userId: 'system',
        isPublic: true,
        createdAt: now,
        coverArt: weekendSongs[0]?.coverArt || 'https://images.pexels.com/photos/1154189/pexels-photo-1154189.jpeg?auto=compress&cs=tinysrgb&w=300'
      };

      this.saveWeekendSpecial(weekendPlaylist);
      this.setLastWeekendUpdate(now);
      
      return weekendPlaylist;
    }

    return this.getWeekendSpecial()!;
  }

  private selectWeekendSongs(songs: Song[], habits: ListeningHabits): Song[] {
    const weekendSongs: Song[] = [];
    const usedSongs = new Set<string>();

    // 1. Top favorites (30%)
    const topFavorites = songs
      .filter(song => habits.favoriteGenres.some(g => g.genre === song.genre))
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 6);

    topFavorites.forEach(song => {
      if (!usedSongs.has(song.id)) {
        weekendSongs.push(song);
        usedSongs.add(song.id);
      }
    });

    // 2. Mood variety (25%)
    habits.moodPreferences.slice(0, 3).forEach(moodPref => {
      const moodSongs = songs
        .filter(song => song.mood?.includes(moodPref.mood) && !usedSongs.has(song.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      moodSongs.forEach(song => {
        weekendSongs.push(song);
        usedSongs.add(song.id);
      });
    });

    // 3. Discovery tracks (25%)
    const discoveryTracks = songs
      .filter(song => {
        const isNewish = (song.playCount || 0) < 3;
        const isGoodRating = (song.averageRating || 0) >= 3.5;
        const isRelevantGenre = habits.favoriteGenres.some(g => g.genre === song.genre);
        return isNewish && isGoodRating && isRelevantGenre && !usedSongs.has(song.id);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    discoveryTracks.forEach(song => {
      weekendSongs.push(song);
      usedSongs.add(song.id);
    });

    // 4. Random variety (20%)
    const randomTracks = songs
      .filter(song => !usedSongs.has(song.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    randomTracks.forEach(song => {
      weekendSongs.push(song);
      usedSongs.add(song.id);
    });

    // Shuffle the final playlist for better flow
    return this.shuffleArray(weekendSongs).slice(0, 20);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Storage methods
  private saveWeekendSpecial(playlist: Playlist): void {
    try {
      localStorage.setItem(this.weekendSpecialKey, JSON.stringify(playlist));
    } catch (error) {
      console.error('Failed to save weekend special:', error);
    }
  }

  private getWeekendSpecial(): Playlist | null {
    try {
      const stored = localStorage.getItem(this.weekendSpecialKey);
      if (!stored) return null;
      
      const playlist = JSON.parse(stored);
      return {
        ...playlist,
        createdAt: new Date(playlist.createdAt)
      };
    } catch (error) {
      console.error('Failed to get weekend special:', error);
      return null;
    }
  }

  private setLastWeekendUpdate(date: Date): void {
    try {
      localStorage.setItem(this.lastWeekendUpdateKey, date.toISOString());
    } catch (error) {
      console.error('Failed to set last weekend update:', error);
    }
  }

  private getLastWeekendUpdate(): Date | null {
    try {
      const stored = localStorage.getItem(this.lastWeekendUpdateKey);
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.error('Failed to get last weekend update:', error);
      return null;
    }
  }

  private saveListeningHabits(habits: ListeningHabits): void {
    try {
      localStorage.setItem(this.listeningHabitsKey, JSON.stringify(habits));
    } catch (error) {
      console.error('Failed to save listening habits:', error);
    }
  }

  getListeningHabits(): ListeningHabits | null {
    try {
      const stored = localStorage.getItem(this.listeningHabitsKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get listening habits:', error);
      return null;
    }
  }

  // Force refresh weekend special (for testing)
  forceRefreshWeekendSpecial(songs: Song[], habits: ListeningHabits): Playlist {
    localStorage.removeItem(this.weekendSpecialKey);
    localStorage.removeItem(this.lastWeekendUpdateKey);
    return this.generateWeekendSpecial(songs, habits);
  }

  // Get time until next weekend refresh
  getTimeUntilNextRefresh(): { days: number; hours: number } {
    const lastUpdate = this.getLastWeekendUpdate();
    if (!lastUpdate) return { days: 0, hours: 0 };

    const nextUpdate = new Date(lastUpdate);
    nextUpdate.setDate(nextUpdate.getDate() + 7);
    
    const now = new Date();
    const diff = nextUpdate.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days, hours };
  }
}

export const playlistGenerator = PlaylistGeneratorManager.getInstance();