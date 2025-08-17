import { describe, it, expect, vi } from 'vitest';
import { audioMetadataExtractor } from '../../utils/audioMetadata';

describe('AudioMetadataExtractor', () => {
  it('parses filename with artist and title', () => {
    const result = audioMetadataExtractor.parseAdvancedFilename('Artist Name - Song Title.mp3');
    
    expect(result.artist).toBe('Artist Name');
    expect(result.title).toBe('Song Title');
  });

  it('handles filename with underscores', () => {
    const result = audioMetadataExtractor.parseAdvancedFilename('Artist_Name_Song_Title.mp3');
    
    expect(result.artist).toBe('Artist Name');
    expect(result.title).toBe('Song Title');
  });

  it('handles filename with track number', () => {
    const result = audioMetadataExtractor.parseAdvancedFilename('01 - Artist Name - Song Title.mp3');
    
    expect(result.artist).toBe('Artist Name');
    expect(result.title).toBe('Song Title');
  });

  it('handles filename with album info', () => {
    const result = audioMetadataExtractor.parseAdvancedFilename('Artist - Song Title (Album Name).mp3');
    
    expect(result.artist).toBe('Artist');
    expect(result.title).toBe('Song Title');
    expect(result.album).toBe('Album Name');
  });

  it('falls back to title only for unrecognized patterns', () => {
    const result = audioMetadataExtractor.parseAdvancedFilename('random_filename.mp3');
    
    expect(result.title).toBe('Random Filename');
    expect(result.artist).toBeUndefined();
  });

  it('extracts metadata from file', async () => {
    const mockFile = new File([''], 'test.mp3', { type: 'audio/mp3' });
    
    // Mock the getDuration method
    vi.spyOn(audioMetadataExtractor as any, 'getDuration').mockResolvedValue(180);
    
    const metadata = await audioMetadataExtractor.extractMetadata(mockFile);
    
    expect(metadata.title).toBe('Test');
    expect(metadata.duration).toBe(180);
  });
});