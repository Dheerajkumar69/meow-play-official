import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/audio'),
  path.join(__dirname, '../uploads/posters')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    const isAudio = file.mimetype.startsWith('audio/');
    const dest = isAudio 
      ? path.join(__dirname, '../uploads/audio')
      : path.join(__dirname, '../uploads/posters');
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

// Create songs directory if it doesn't exist
const songsDir = path.join(__dirname, './songs');
if (!fs.existsSync(songsDir)) {
  fs.mkdirSync(songsDir, { recursive: true });
  console.log(`Created songs directory: ${songsDir}`);
}

// Initialize songs.json if it doesn't exist
const songsJsonPath = path.join(songsDir, 'songs.json');
if (!fs.existsSync(songsJsonPath)) {
  fs.writeFileSync(songsJsonPath, '[]', 'utf8');
  console.log(`Created songs.json file: ${songsJsonPath}`);
}

// Import routes
import songRoutes from './routes/songs.js';
import userRoutes from './routes/users.js';

// Use routes
app.use('/api', songRoutes);
app.use('/api', userRoutes);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});