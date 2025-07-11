import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Song from '../models/Song.js';
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

    // Create song document
    const song = new Song({
      title: req.body.title || audioFile.originalname.replace(/\.[^/.]+$/, ''),
      artist: req.body.artist || 'Unknown Artist',
      album: req.body.album,
      genre: req.body.genre,
      duration: req.body.duration || 0, // This should be extracted from the file
      filePath: `/uploads/audio/${audioFile.filename}`,
      posterPath: posterFile ? `/uploads/posters/${posterFile.filename}` : '/assets/default-cover.svg',
      uploadedBy: req.user.id,
      year: req.body.year,
      mood: req.body.mood ? req.body.mood.split(',') : [],
      tempo: req.body.tempo,
      key: req.body.key,
      description: req.body.description,
      license: req.body.license,
      source: req.body.source
    });

    await song.save();
    res.status(201).json(song);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all songs
router.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific song
router.get('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Stream a song
router.get('/stream/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Increment play count
    song.playCount += 1;
    await song.save();

    // Get the absolute file path
    const filePath = path.join(__dirname, '../..', song.filePath);
    
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
router.get('/songs/user/:userId', async (req, res) => {
  try {
    const songs = await Song.find({ uploadedBy: req.params.userId }).sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search songs
router.get('/songs/search/:query', async (req, res) => {
  try {
    const songs = await Song.find(
      { $text: { $search: req.params.query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a song
router.patch('/songs/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Check if user is the uploader or an admin
    if (song.uploadedBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this song' });
    }
    
    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key !== 'filePath' && key !== 'uploadedBy' && key !== 'createdAt') {
        song[key] = updates[key];
      }
    });
    
    await song.save();
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a song
router.delete('/songs/:id', auth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Check if user is the uploader or an admin
    if (song.uploadedBy.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this song' });
    }
    
    // Delete associated files
    const audioPath = path.join(__dirname, '../..', song.filePath);
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    if (song.posterPath && song.posterPath !== '/assets/default-cover.svg') {
      const posterPath = path.join(__dirname, '../..', song.posterPath);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }
    
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;