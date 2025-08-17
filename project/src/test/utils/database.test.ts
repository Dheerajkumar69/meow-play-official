import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openDB, IDBPDatabase } from 'idb';
import { initializeDatabase, getSongs, addSong, updateSong, deleteSong } from '../../utils/database';
import { Song } from '../../types';

// Mock idb
vi.mock('idb', () => {
  const mockObjectStore = {
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(undefined)
  };

  const mockTransaction = {
    objectStore: vi.fn().mockReturnValue(mockObjectStore)
  };

  const mockDB = {
    transaction: vi.fn().mockReturnValue(mockTransaction),
    close: vi.fn()
  };

  return {
    openDB: vi.fn().mockResolvedValue(mockDB)
  };
});

describe('Database Utilities', () => {
  let mockDB: IDBPDatabase;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Initialize the mock database
    mockDB = await openDB('test-db', 1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes the database correctly', async () => {
    await initializeDatabase();
    
    expect(openDB).toHaveBeenCalledWith('meow-play-db', 1, expect.any(Object));
  });

  it('retrieves songs from the database', async () => {
    const mockSongs: Song[] = [
      {
        id: '1',
        title: 'Test Song 1',
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 180,
        filePath: '/test/song1.mp3',
        liked: false,
        playCount: 0,
        createdAt: new Date(),
        uploadedBy: 'user1',
        genre: 'Pop'
      },
      {
        id: '2',
        title: 'Test Song 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        duration: 240,
        filePath: '/test/song2.mp3',
        liked: true,
        playCount: 5,
        createdAt: new Date(),
        uploadedBy: 'user1',
        genre: 'Rock'
      }
    ];

    // Mock the getAll method to return our test songs
    mockDB.transaction().objectStore().getAll = vi.fn().mockResolvedValue(mockSongs);

    const songs = await getSongs();
    
    expect(mockDB.transaction).toHaveBeenCalledWith('songs', 'readonly');
    expect(mockDB.transaction().objectStore).toHaveBeenCalledWith('songs');
    expect(mockDB.transaction().objectStore().getAll).toHaveBeenCalled();
    expect(songs).toEqual(mockSongs);
  });

  it('adds a song to the database', async () => {
    const mockSong: Song = {
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      filePath: '/test/song.mp3',
      liked: false,
      playCount: 0,
      createdAt: new Date(),
      uploadedBy: 'user1',
      genre: 'Pop'
    };

    await addSong(mockSong);
    
    expect(mockDB.transaction).toHaveBeenCalledWith('songs', 'readwrite');
    expect(mockDB.transaction().objectStore).toHaveBeenCalledWith('songs');
    expect(mockDB.transaction().objectStore().put).toHaveBeenCalledWith(mockSong);
  });

  it('updates a song in the database', async () => {
    const mockSong: Song = {
      id: '1',
      title: 'Updated Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      filePath: '/test/song.mp3',
      liked: true,
      playCount: 1,
      createdAt: new Date(),
      uploadedBy: 'user1',
      genre: 'Pop'
    };

    await updateSong(mockSong);
    
    expect(mockDB.transaction).toHaveBeenCalledWith('songs', 'readwrite');
    expect(mockDB.transaction().objectStore).toHaveBeenCalledWith('songs');
    expect(mockDB.transaction().objectStore().put).toHaveBeenCalledWith(mockSong);
  });

  it('deletes a song from the database', async () => {
    const songId = '1';

    await deleteSong(songId);
    
    expect(mockDB.transaction).toHaveBeenCalledWith('songs', 'readwrite');
    expect(mockDB.transaction().objectStore).toHaveBeenCalledWith('songs');
    expect(mockDB.transaction().objectStore().delete).toHaveBeenCalledWith(songId);
  });
});