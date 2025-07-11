import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SONGS_DIR = 'F:\\spotify\\New folder\\meow-play-official\\songs';
const SONGS_JSON_PATH = path.join(SONGS_DIR, 'songs.json');

/**
 * Generate a hash for a file to check for duplicates
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - SHA-256 hash of the file
 */
export const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

/**
 * Get all songs from the JSON file
 * @returns {Array} - Array of song objects
 */
export const getAllSongs = () => {
  try {
    if (!fs.existsSync(SONGS_JSON_PATH)) {
      fs.writeFileSync(SONGS_JSON_PATH, '[]', 'utf8');
    }
    const data = fs.readFileSync(SONGS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading songs.json:', error);
    return [];
  }
};

/**
 * Save songs data to the JSON file
 * @param {Array} songs - Array of song objects
 */
export const saveSongs = (songs) => {
  try {
    fs.writeFileSync(SONGS_JSON_PATH, JSON.stringify(songs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to songs.json:', error);
    throw error;
  }
};

/**
 * Add a new song to the JSON file
 * @param {Object} song - Song object to add
 * @returns {Object} - Added song with generated ID
 */
export const addSong = (song) => {
  const songs = getAllSongs();
  
  // Generate a unique ID
  const id = crypto.randomUUID();
  const newSong = { id, ...song };
  
  songs.push(newSong);
  saveSongs(songs);
  
  return newSong;
};

/**
 * Get a song by ID
 * @param {string} id - Song ID
 * @returns {Object|null} - Song object or null if not found
 */
export const getSongById = (id) => {
  const songs = getAllSongs();
  return songs.find(song => song.id === id) || null;
};

/**
 * Get a song by filename
 * @param {string} filename - Song filename
 * @returns {Object|null} - Song object or null if not found
 */
export const getSongByFilename = (filename) => {
  const songs = getAllSongs();
  return songs.find(song => song.filename === filename) || null;
};

/**
 * Get a song by hash
 * @param {string} hash - Song hash
 * @returns {Object|null} - Song object or null if not found
 */
export const getSongByHash = (hash) => {
  const songs = getAllSongs();
  return songs.find(song => song.hash === hash) || null;
};

/**
 * Update a song by ID
 * @param {string} id - Song ID
 * @param {Object} updates - Object with fields to update
 * @returns {Object|null} - Updated song or null if not found
 */
export const updateSong = (id, updates) => {
  const songs = getAllSongs();
  const index = songs.findIndex(song => song.id === id);
  
  if (index === -1) return null;
  
  // Update song fields but preserve the id, filename, and hash
  const { id: _, filename, hash, ...updatableFields } = updates;
  songs[index] = { ...songs[index], ...updatableFields };
  
  saveSongs(songs);
  return songs[index];
};

/**
 * Delete a song by ID
 * @param {string} id - Song ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteSong = (id) => {
  const songs = getAllSongs();
  const song = songs.find(song => song.id === id);
  
  if (!song) return false;
  
  // Delete the actual file
  const filePath = path.join(SONGS_DIR, song.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // Delete poster if it exists and is not the default
  if (song.posterFilename) {
    const posterPath = path.join(__dirname, '../../uploads/posters', song.posterFilename);
    if (fs.existsSync(posterPath)) {
      fs.unlinkSync(posterPath);
    }
  }
  
  // Update the JSON file
  const updatedSongs = songs.filter(s => s.id !== id);
  saveSongs(updatedSongs);
  
  return true;
};

/**
 * Increment play count for a song
 * @param {string} id - Song ID
 * @returns {Object|null} - Updated song or null if not found
 */
export const incrementPlayCount = (id) => {
  const songs = getAllSongs();
  const index = songs.findIndex(song => song.id === id);
  
  if (index === -1) return null;
  
  songs[index].playCount = (songs[index].playCount || 0) + 1;
  saveSongs(songs);
  
  return songs[index];
};

/**
 * Check if a song with the same hash already exists
 * @param {string} hash - File hash to check
 * @returns {boolean} - True if a duplicate exists
 */
export const isDuplicateHash = (hash) => {
  return getSongByHash(hash) !== null;
};

/**
 * Check if a song with the same filename already exists
 * @param {string} filename - Filename to check
 * @returns {boolean} - True if a duplicate exists
 */
export const isDuplicateFilename = (filename) => {
  return getSongByFilename(filename) !== null;
};

export default {
  getAllSongs,
  getSongById,
  getSongByFilename,
  getSongByHash,
  addSong,
  updateSong,
  deleteSong,
  incrementPlayCount,
  generateFileHash,
  isDuplicateHash,
  isDuplicateFilename,
  SONGS_DIR
};