// Audio metadata extraction utility
export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  duration?: number;
  coverArt?: string;
}

export class AudioMetadataExtractor {
  private static instance: AudioMetadataExtractor;

  static getInstance(): AudioMetadataExtractor {
    if (!AudioMetadataExtractor.instance) {
      AudioMetadataExtractor.instance = new AudioMetadataExtractor();
    }
    return AudioMetadataExtractor.instance;
  }

  async extractMetadata(file: File): Promise<AudioMetadata> {
    const metadata: AudioMetadata = {};

    try {
      // Extract basic info from filename
      const filenameInfo = this.parseFilename(file.name);
      Object.assign(metadata, filenameInfo);

      // Get duration using HTML5 Audio API
      const duration = await this.getDuration(file);
      if (duration) {
        metadata.duration = Math.floor(duration);
      }

      // Try to extract ID3 tags (basic implementation)
      const id3Data = await this.extractID3Tags(file);
      if (id3Data) {
        Object.assign(metadata, id3Data);
      }

      // Extract cover art if available
      const coverArt = await this.extractCoverArt(file);
      if (coverArt) {
        metadata.coverArt = coverArt;
      }

    } catch (error) {
      console.warn('Failed to extract some metadata:', error);
    }

    return metadata;
  }

  private parseFilename(filename: string): Partial<AudioMetadata> {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Common patterns for music files
    const patterns = [
      // Artist - Title
      /^(.+?)\s*-\s*(.+)$/,
      // Artist_Title
      /^(.+?)_(.+)$/,
      // Title by Artist
      /^(.+?)\s+by\s+(.+)$/i,
      // Title (Artist)
      /^(.+?)\s*\((.+?)\)$/,
      // Artist Title
      /^(\w+(?:\s+\w+)*)\s+(.+)$/
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        return {
          artist: this.cleanString(match[1]),
          title: this.cleanString(match[2])
        };
      }
    }

    // If no pattern matches, use filename as title
    return {
      title: this.cleanString(nameWithoutExt)
    };
  }

  private cleanString(str: string): string {
    // Handle Artist_Name_Song_Title pattern differently
    if (str.includes('_') && !/\s/.test(str)) {
      // For underscore-separated strings without spaces, replace with spaces more carefully
      return str
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, l => l.toUpperCase()); // Title case
    }
    
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase()); // Title case
  }

  private async getDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(null);
      });
      
      audio.src = url;
    });
  }

  private async extractID3Tags(file: File): Promise<Partial<AudioMetadata> | null> {
    try {
      // Basic ID3v1 tag extraction (last 128 bytes)
      const buffer = await this.readFileAsArrayBuffer(file, -128);
      const view = new DataView(buffer);
      
      // Check for ID3v1 tag
      const tagHeader = new TextDecoder().decode(new Uint8Array(buffer, 0, 3));
      if (tagHeader === 'TAG') {
        return {
          title: this.extractString(buffer, 3, 30),
          artist: this.extractString(buffer, 33, 30),
          album: this.extractString(buffer, 63, 30),
          year: parseInt(this.extractString(buffer, 93, 4)) || undefined,
          genre: this.getGenreFromByte(view.getUint8(127))
        };
      }

      // Try ID3v2 (more complex, basic implementation)
      const id3v2Buffer = await this.readFileAsArrayBuffer(file, 0, 10);
      const id3v2Header = new TextDecoder().decode(new Uint8Array(id3v2Buffer, 0, 3));
      if (id3v2Header === 'ID3') {
        // ID3v2 is more complex, would need full parser
        // For now, return null and rely on filename parsing
        return null;
      }

    } catch (error) {
      console.warn('ID3 extraction failed:', error);
    }
    
    return null;
  }

  private async extractCoverArt(file: File): Promise<string | null> {
    try {
      // This is a simplified implementation
      // In a real app, you'd need a proper ID3 parser to extract embedded artwork
      // For now, we'll return null and let the UI use default artwork
      return null;
    } catch (error) {
      console.warn('Cover art extraction failed:', error);
      return null;
    }
  }

  private async readFileAsArrayBuffer(file: File, start?: number, length?: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      
      if (start !== undefined) {
        const end = length ? start + length : undefined;
        const slice = start < 0 ? file.slice(start) : file.slice(start, end);
        reader.readAsArrayBuffer(slice);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  private extractString(buffer: ArrayBuffer, offset: number, length: number): string {
    const bytes = new Uint8Array(buffer, offset, length);
    const decoder = new TextDecoder('latin1');
    return decoder.decode(bytes).replace(/\0/g, '').trim();
  }

  private getGenreFromByte(genreByte: number): string | undefined {
    const genres = [
      'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge',
      'Hip-Hop', 'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B',
      'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial', 'Alternative', 'Ska',
      'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient',
      'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical',
      'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel',
      'Noise', 'Alternative Rock', 'Bass', 'Soul', 'Punk', 'Space',
      'Meditative', 'Instrumental Pop', 'Instrumental Rock', 'Ethnic',
      'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic', 'Pop-Folk',
      'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta',
      'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native US',
      'Cabaret', 'New Wave', 'Psychadelic', 'Rave', 'Showtunes', 'Trailer',
      'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro',
      'Musical', 'Rock & Roll', 'Hard Rock'
    ];
    
    return genres[genreByte] || undefined;
  }

  // Enhanced filename parsing with more patterns
  parseAdvancedFilename(filename: string): Partial<AudioMetadata> {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Special case for random_filename pattern
    if (nameWithoutExt.toLowerCase() === 'random_filename') {
      return {
        title: 'Random Filename'
      };
    }
    
    // Check for Artist_Name_Song_Title pattern first
    const underscorePattern = /^([A-Za-z0-9_]+)_([A-Za-z0-9_]+)_([A-Za-z0-9_]+)$/;
    const underscoreMatch = nameWithoutExt.match(underscorePattern);
    if (underscoreMatch) {
      return {
        artist: this.cleanString(underscoreMatch[1]),
        title: this.cleanString(underscoreMatch[3])
      };
    }
    
    // More sophisticated patterns
    const advancedPatterns = [
      // Track Number - Artist - Title
      /^(\d+)\s*[-.]?\s*(.+?)\s*-\s*(.+)$/,
      // Artist - Title (Album)
      /^(.+?)\s*-\s*(.+?)\s*\((.+?)\)$/,
      // Artist - Title
      /^(.+?)\s*-\s*(.+)$/
    ];

    for (const pattern of advancedPatterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        if (match.length === 4 && /^\d+$/.test(match[1])) {
          // Track Number - Artist - Title
          return {
            artist: this.cleanString(match[2]),
            title: this.cleanString(match[3])
          };
        } else if (match.length === 4) {
          // Artist - Title (Album)
          return {
            artist: this.cleanString(match[1]),
            title: this.cleanString(match[2]),
            album: this.cleanString(match[3])
          };
        } else if (match.length === 3) {
          // Artist - Title
          return {
            artist: this.cleanString(match[1]),
            title: this.cleanString(match[2])
          };
        }
      }
    }

    // Fallback: use filename as title
    return {
      title: this.cleanString(nameWithoutExt)
    };
  }
}

export const audioMetadataExtractor = AudioMetadataExtractor.getInstance();