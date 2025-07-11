import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  posterPath: {
    type: String,
    default: '/assets/default-cover.svg'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playCount: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  year: {
    type: Number
  },
  mood: [{
    type: String
  }],
  tempo: {
    type: Number
  },
  key: {
    type: String
  },
  description: {
    type: String
  },
  license: {
    type: String
  },
  source: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add text index for search functionality
songSchema.index({ title: 'text', artist: 'text', album: 'text', genre: 'text' });

const Song = mongoose.model('Song', songSchema);

export default Song;