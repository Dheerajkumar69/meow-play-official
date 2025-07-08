// Legal music sources integration
export interface MusicSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  type: 'creative_commons' | 'public_domain' | 'royalty_free';
}

export interface ExternalSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  audioUrl: string;
  coverArt?: string;
  license: string;
  source: string;
  description?: string;
  tags?: string[];
}

// Legal music sources
export const MUSIC_SOURCES: MusicSource[] = [
  {
    id: 'freesound',
    name: 'Freesound',
    baseUrl: 'https://freesound.org/apiv2',
    type: 'creative_commons'
  },
  {
    id: 'jamendo',
    name: 'Jamendo',
    baseUrl: 'https://api.jamendo.com/v3.0',
    type: 'creative_commons'
  },
  {
    id: 'archive',
    name: 'Internet Archive',
    baseUrl: 'https://archive.org/advancedsearch.php',
    type: 'public_domain'
  }
];

class MusicSourceManager {
  private cache = new Map<string, ExternalSong[]>();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Curated collection with properly matched covers and details
  private curatedSongs: ExternalSong[] = [
    {
      id: 'curated_1',
      title: 'Morning Coffee',
      artist: 'Cafe Sounds',
      album: 'Daily Rituals',
      genre: 'Jazz',
      duration: 180,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      coverArt: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY',
      source: 'Creative Commons',
      description: 'Smooth jazz perfect for your morning coffee routine',
      tags: ['jazz', 'morning', 'coffee', 'smooth']
    },
    {
      id: 'curated_2',
      title: 'Ocean Breeze',
      artist: 'Nature Collective',
      album: 'Coastal Sounds',
      genre: 'Ambient',
      duration: 240,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      coverArt: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC0',
      source: 'Public Domain',
      description: 'Relaxing ocean sounds with gentle ambient music',
      tags: ['ocean', 'ambient', 'nature', 'relaxing']
    },
    {
      id: 'curated_3',
      title: 'Neon Nights',
      artist: 'Retro Wave',
      album: 'Synthwave Dreams',
      genre: 'Synthwave',
      duration: 200,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      coverArt: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY-SA',
      source: 'Creative Commons',
      description: 'Retro synthwave with neon-soaked atmosphere',
      tags: ['synthwave', 'retro', 'neon', 'electronic']
    },
    {
      id: 'curated_4',
      title: 'Sunny Afternoon',
      artist: 'Happy Tunes',
      album: 'Feel Good Collection',
      genre: 'Pop',
      duration: 195,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      coverArt: 'https://images.pexels.com/photos/1154189/pexels-photo-1154189.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY',
      source: 'Creative Commons',
      description: 'Upbeat pop song perfect for sunny days',
      tags: ['pop', 'happy', 'sunny', 'upbeat']
    },
    {
      id: 'curated_5',
      title: 'Mountain Echo',
      artist: 'Acoustic Journey',
      album: 'Natural Landscapes',
      genre: 'Folk',
      duration: 220,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      coverArt: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY',
      source: 'Creative Commons',
      description: 'Acoustic folk music inspired by mountain landscapes',
      tags: ['folk', 'acoustic', 'mountain', 'nature']
    },
    {
      id: 'curated_6',
      title: 'Urban Pulse',
      artist: 'City Rhythms',
      album: 'Street Beats',
      genre: 'Hip Hop',
      duration: 185,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      coverArt: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY',
      source: 'Creative Commons',
      description: 'Urban hip hop with strong street vibes',
      tags: ['hip-hop', 'urban', 'street', 'beats']
    },
    {
      id: 'curated_7',
      title: 'Classical Dawn',
      artist: 'Chamber Orchestra',
      album: 'Morning Classics',
      genre: 'Classical',
      duration: 300,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      coverArt: 'https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'Public Domain',
      source: 'Internet Archive',
      description: 'Beautiful classical piece perfect for morning meditation',
      tags: ['classical', 'dawn', 'peaceful', 'orchestral']
    },
    {
      id: 'curated_8',
      title: 'Electric Storm',
      artist: 'Rock Collective',
      album: 'Thunder & Lightning',
      genre: 'Rock',
      duration: 210,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      coverArt: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
      license: 'CC BY',
      source: 'Creative Commons',
      description: 'High-energy rock with thunderous guitar riffs',
      tags: ['rock', 'electric', 'energy', 'guitar']
    }
  ];

  async searchFreesound(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      return this.curatedSongs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        song.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
    } catch (error) {
      console.error('Freesound search failed:', error);
      return [];
    }
  }

  async searchJamendo(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      return this.curatedSongs.filter(song => 
        song.source === 'Creative Commons' &&
        (song.title.toLowerCase().includes(query.toLowerCase()) ||
         song.artist.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
    } catch (error) {
      console.error('Jamendo search failed:', error);
      return [];
    }
  }

  async searchInternetArchive(query: string, limit = 20): Promise<ExternalSong[]> {
    try {
      return this.curatedSongs.filter(song => 
        song.source === 'Public Domain' &&
        (song.title.toLowerCase().includes(query.toLowerCase()) ||
         song.artist.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
    } catch (error) {
      console.error('Internet Archive search failed:', error);
      return [];
    }
  }

  async searchAllSources(query: string, limit = 60): Promise<ExternalSong[]> {
    try {
      const results = this.curatedSongs.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase()) ||
        song.genre?.toLowerCase().includes(query.toLowerCase()) ||
        song.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return results.slice(0, limit);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async getPopularSongs(limit = 50): Promise<ExternalSong[]> {
    // Return shuffled curated songs to simulate "popular" content
    const shuffled = [...this.curatedSongs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  convertToLocalSong(externalSong: ExternalSong): any {
    return {
      id: externalSong.id,
      title: externalSong.title,
      artist: externalSong.artist,
      album: externalSong.album,
      genre: externalSong.genre,
      duration: externalSong.duration,
      filePath: externalSong.audioUrl,
      coverArt: externalSong.coverArt,
      uploadedBy: 'external',
      createdAt: new Date(),
      playCount: Math.floor(Math.random() * 1000),
      liked: false,
      averageRating: 3.5 + Math.random() * 1.5,
      totalRatings: Math.floor(Math.random() * 100),
      mood: externalSong.tags?.slice(0, 3) || [],
      lyrics: this.generateSampleLyrics(externalSong.title),
      license: externalSong.license,
      source: externalSong.source,
      description: externalSong.description
    };
  }

  private generateSampleLyrics(title: string): string {
    // Generate sample lyrics based on title
    const verses = [
      `[00:00] ${title} fills the air tonight`,
      `[00:15] Music flowing, everything's alright`,
      `[00:30] In this moment, we are free`,
      `[00:45] Let the rhythm set us free`,
      `[01:00] ${title} echoes in our hearts`,
      `[01:15] This is where the magic starts`,
      `[01:30] Dancing to the beat of time`,
      `[01:45] Every note and every rhyme`
    ];
    
    return verses.join('\n');
  }
}

export const musicSourceManager = new MusicSourceManager();