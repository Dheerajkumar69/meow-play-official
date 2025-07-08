// Spotify Integration Utility
// Note: This is a conceptual implementation for educational purposes
// In production, you would need proper Spotify API credentials and backend integration

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    items: Array<{ track: SpotifyTrack }>;
  };
  images: Array<{ url: string; height: number; width: number }>;
}

class SpotifyIntegrationManager {
  private clientId: string = '';
  private clientSecret: string = '';
  private accessToken: string = '';

  // Note: In a real implementation, you would:
  // 1. Set up Spotify App in Spotify Developer Dashboard
  // 2. Implement OAuth flow for user authentication
  // 3. Use backend server to handle client secret securely
  // 4. Implement proper token refresh mechanism

  async getPlaylistInfo(playlistUrl: string): Promise<SpotifyPlaylist | null> {
    try {
      // Extract playlist ID from URL
      const playlistId = this.extractPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new Error('Invalid Spotify playlist URL');
      }

      // In a real implementation, this would make an actual API call
      // For now, we'll return mock data to demonstrate the concept
      return this.getMockPlaylistData(playlistId);
    } catch (error) {
      console.error('Failed to fetch Spotify playlist:', error);
      return null;
    }
  }

  private extractPlaylistId(url: string): string | null {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private getMockPlaylistData(playlistId: string): SpotifyPlaylist {
    // Mock data for demonstration
    return {
      id: playlistId,
      name: 'Spotify Playlist',
      description: 'A curated playlist from Spotify',
      images: [
        {
          url: 'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=300',
          height: 300,
          width: 300
        }
      ],
      tracks: {
        items: [
          {
            track: {
              id: 'spotify_1',
              name: 'Sample Track 1',
              artists: [{ name: 'Sample Artist' }],
              album: {
                name: 'Sample Album',
                images: [
                  {
                    url: 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=300',
                    height: 300,
                    width: 300
                  }
                ]
              },
              duration_ms: 180000,
              preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
              external_urls: {
                spotify: 'https://open.spotify.com/track/sample1'
              }
            }
          },
          {
            track: {
              id: 'spotify_2',
              name: 'Sample Track 2',
              artists: [{ name: 'Another Artist' }],
              album: {
                name: 'Another Album',
                images: [
                  {
                    url: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=300',
                    height: 300,
                    width: 300
                  }
                ]
              },
              duration_ms: 210000,
              preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
              external_urls: {
                spotify: 'https://open.spotify.com/track/sample2'
              }
            }
          }
        ]
      }
    };
  }

  convertSpotifyTrackToLocalSong(track: SpotifyTrack): any {
    return {
      id: `spotify_${track.id}`,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      genre: 'Unknown', // Spotify API doesn't always provide genre info
      duration: Math.floor(track.duration_ms / 1000),
      filePath: track.preview_url || '', // Note: Only 30-second previews available
      coverArt: track.album.images[0]?.url,
      uploadedBy: 'spotify',
      createdAt: new Date(),
      playCount: 0,
      liked: false,
      source: 'Spotify',
      description: `From Spotify: ${track.external_urls.spotify}`,
      isPreview: true // Flag to indicate this is only a preview
    };
  }

  // Alternative approach using spotdl (conceptual)
  async downloadWithSpotdl(playlistUrl: string): Promise<string[]> {
    // Note: This would require a backend service to run spotdl
    // spotdl is a Python tool that can't run directly in the browser
    
    console.log('Spotify playlist download requested:', playlistUrl);
    
    // In a real implementation, you would:
    // 1. Send the playlist URL to your backend
    // 2. Backend runs: spotdl download "playlist_url"
    // 3. Backend processes the downloaded files
    // 4. Backend returns the processed song data
    
    throw new Error('spotdl integration requires backend implementation');
  }

  // Educational note about legal considerations
  getUsageGuidelines(): string {
    return `
    IMPORTANT LEGAL NOTICE:
    
    1. Spotify Integration:
       - Only 30-second previews are available through Spotify Web API
       - Full track downloads require Spotify Premium and proper licensing
       - Always respect Spotify's Terms of Service
    
    2. spotdl Usage:
       - Only use with music you own or have proper licensing for
       - Respect copyright laws and artist rights
       - Consider supporting artists through official channels
    
    3. Recommended Approach:
       - Use Spotify for discovery and previews
       - Direct users to official platforms for full tracks
       - Implement proper attribution and licensing
    `;
  }
}

export const spotifyIntegration = new SpotifyIntegrationManager();

// Example usage function for demonstration
export async function demonstrateSpotifyIntegration(playlistUrl: string) {
  try {
    console.log('Spotify Integration Demo');
    console.log('Legal Guidelines:', spotifyIntegration.getUsageGuidelines());
    
    const playlist = await spotifyIntegration.getPlaylistInfo(playlistUrl);
    if (playlist) {
      console.log('Playlist Info:', playlist.name);
      console.log('Track Count:', playlist.tracks.items.length);
      
      // Convert tracks to local format
      const localSongs = playlist.tracks.items.map(item => 
        spotifyIntegration.convertSpotifyTrackToLocalSong(item.track)
      );
      
      return localSongs;
    }
    
    return [];
  } catch (error) {
    console.error('Spotify integration error:', error);
    return [];
  }
}