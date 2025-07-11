import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fileStorage from '../utils/fileStorage.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    const isAudio = file.mimetype.startsWith('audio/');
    const dest = isAudio 
      ? path.join(__dirname, '../../uploads/audio')
      : path.join(__dirname, '../../uploads/posters');
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Validate file types
    if (file.fieldname === 'audio') {
      if (!file.mimetype.startsWith('audio/') && 
          !file.originalname.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
        return cb(new Error('Only audio files are allowed!'));
      }
    } else if (file.fieldname === 'poster') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for posters!'));
      }
    }
    cb(null, true);
  }
});

// Upload a song
router.post('/songs/upload', auth, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'poster', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    const audioFile = req.files.audio[0];
    const posterFile = req.files.poster ? req.files.poster[0] : null;
    
    // Generate a unique filename for the song
    const originalExt = path.extname(audioFile.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${originalExt}`;
    const songPath = path.join(fileStorage.SONGS_DIR, filename);
    
    // Move the file from uploads to songs directory
    fs.copyFileSync(audioFile.path, songPath);
    fs.unlinkSync(audioFile.path); // Remove the original file
    
    // Generate hash for duplicate detection
    const hash = await fileStorage.generateFileHash(songPath);
    
    // Check for duplicates by hash
    if (fileStorage.isDuplicateHash(hash)) {
      // Remove the file we just copied
      fs.unlinkSync(songPath);
      return res.status(400).json({ message: 'Duplicate song detected. Upload aborted.' });
    }
    
    // Create song metadata
    const song = {
      title: req.body.title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
      artist: req.body.artist || 'Unknown Artist',
      album: req.body.album || '',
      genre: req.body.genre || '',
      duration: req.body.duration || 0,
      filename: filename,
      hash: hash,
      posterFilename: posterFile ? posterFile.filename : null,
      posterPath: posterFile ? `/uploads/posters/${posterFile.filename}` : '/assets/default-cover.svg',
      uploadedBy: req.user.id,
      year: req.body.year || new Date().getFullYear(),
      mood: req.body.mood ? req.body.mood.split(',') : [],
      playCount: 0,
      uploadedAt: new Date().toISOString()
    };

    // Add song to the JSON file
    const savedSong = fileStorage.addSong(song);
    res.status(201).json(savedSong);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all songs
router.get('/songs', (req, res) => {
  try {
    const songs = fileStorage.getAllSongs();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific song
router.get('/songs/:id', (req, res) => {
  try {
    const song = fileStorage.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stream a song by filename
router.get('/stream/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(fileStorage.SONGS_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    // Get the song metadata and increment play count
    const song = fileStorage.getSongByFilename(filename);
    if (song) {
      fileStorage.incrementPlayCount(song.id);
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Handle range requests for streaming
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });
      
      file.pipe(res);
    } else {
      // No range requested, send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Stream a song by ID (for backward compatibility)
router.get('/stream/id/:id', (req, res) => {
  try {
    const song = fileStorage.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Increment play count
    fileStorage.incrementPlayCount(song.id);

    // Get the absolute file path
    const filePath = path.join(fileStorage.SONGS_DIR, song.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Handle range requests for streaming
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      });
      
      file.pipe(res);
    } else {
      // No range requested, send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg'
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get songs by user
router.get('/songs/user/:userId', (req, res) => {
  try {
    const songs = fileStorage.getAllSongs().filter(song => song.uploadedBy === req.params.userId);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search songs
router.get('/songs/search/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const songs = fileStorage.getAllSongs().filter(song => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.album && song.album.toLowerCase().includes(query)) ||
        (song.genre && song.genre.toLowerCase().includes(query))
      );
    });
    
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a song
router.patch('/songs/:id', auth, (req, res) => {
  try {
    const song = fileStorage.getSongById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Check if user is the uploader or an admin
    if (song.uploadedBy !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this song' });
    }
    
    // Update fields
    const updates = req.body;
    const nonUpdatableFields = ['filename', 'hash', 'uploadedBy', 'uploadedAt'];
    
    // Filter out non-updatable fields
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => !nonUpdatableFields.includes(key))
    );
    
    const updatedSong = fileStorage.updateSong(req.params.id, filteredUpdates);
    res.json(updatedSong);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a song
router.delete('/songs/:id', auth, (req, res) => {
  try {
    const song = fileStorage.getSongById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Check if user is the uploader or an admin
    if (song.uploadedBy !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this song' });
    }
    
    // Delete the song (the fileStorage.deleteSong function handles file deletion)
    const deleted = fileStorage.deleteSong(req.params.id);
    
    if (deleted) {
      res.json({ message: 'Song deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete song' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if a song is a duplicate
router.post('/songs/check-duplicate', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Generate hash for the uploaded file
    const hash = await fileStorage.generateFileHash(req.file.path);
    
    // Check if a song with this hash already exists
    const isDuplicate = fileStorage.isDuplicateHash(hash);
    
    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.json({ isDuplicate, hash });
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;