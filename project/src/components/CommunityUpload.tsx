/**
 * Community Upload Component with Progress Tracking
 */
import React, { useState, useCallback } from 'react';
import { Upload, Music, Image, Tag, Globe, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { CommunityApiService, UploadProgress } from '../services/communityApi';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface CommunityUploadProps {
  onUploadComplete?: (musicId: string) => void;
  className?: string;
}

export const CommunityUpload: React.FC<CommunityUploadProps> = ({ 
  onUploadComplete,
  className 
}) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector(state => state.user);
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  // Form data
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [explicitContent, setExplicitContent] = useState(false);
  const [copyrightInfo, setCopyrightInfo] = useState('');
  const [shareToPublic, setShareToPublic] = useState(true);

  const communityApi = CommunityApiService.getInstance();

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 
    'Country', 'R&B', 'Reggae', 'Folk', 'Blues', 'Metal', 'Indie', 'Alternative'
  ];

  const acceptedFormats = ['.mp3', '.wav', '.flac', '.m4a', '.ogg'];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      dispatch(addToast({
        type: 'error',
        message: `Unsupported file format. Please use: ${acceptedFormats.join(', ')}`
      }));
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      dispatch(addToast({
        type: 'error',
        message: 'File size must be less than 50MB'
      }));
      return;
    }

    setFile(selectedFile);
    
    // Auto-extract metadata from filename if possible
    const filename = selectedFile.name.replace(/\.[^/.]+$/, '');
    const parts = filename.split(' - ');
    if (parts.length >= 2) {
      setArtist(parts[0].trim());
      setTitle(parts[1].trim());
      if (parts.length >= 3) {
        setAlbum(parts[2].trim());
      }
    } else {
      setTitle(filename);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || !artist.trim()) {
      dispatch(addToast({
        type: 'error',
        message: 'Please provide a file, title, and artist'
      }));
      return;
    }

    if (!currentUser) {
      dispatch(addToast({
        type: 'error',
        message: 'Please log in to upload music'
      }));
      return;
    }

    try {
      setUploading(true);
      
      const metadata = {
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || undefined,
        genre: genre || undefined,
        tags: tags.length > 0 ? tags : undefined,
        lyrics: lyrics.trim() || undefined,
        explicit_content: explicitContent,
        copyright_info: copyrightInfo.trim() || undefined,
      };

      const result = await communityApi.uploadMusic(
        file,
        metadata,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      dispatch(addToast({
        type: 'success',
        message: shareToPublic 
          ? 'Music uploaded and shared with the community!' 
          : 'Music uploaded to your library!'
      }));

      // Reset form
      setFile(null);
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      setTags([]);
      setLyrics('');
      setExplicitContent(false);
      setCopyrightInfo('');
      setUploadProgress(null);

      if (onUploadComplete) {
        onUploadComplete(result.id);
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      dispatch(addToast({
        type: 'error',
        message: error.message || 'Upload failed'
      }));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setGenre('');
    setTags([]);
    setTagInput('');
    setLyrics('');
    setExplicitContent(false);
    setCopyrightInfo('');
    setUploadProgress(null);
  };

  return (
    <div className={`community-upload ${className || ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Upload className="w-6 h-6 mr-2 text-purple-400" />
            Upload to Community
          </h2>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-purple-400 bg-purple-400/10' 
                : file 
                  ? 'border-green-400 bg-green-400/10'
                  : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                  <p className="text-gray-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-red-400 hover:text-red-300 flex items-center mx-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Music className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Drop your music file here
                  </h3>
                  <p className="text-gray-400 mb-4">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept={acceptedFormats.join(',')}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Supported formats: {acceptedFormats.join(', ')} • Max size: 50MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">
                  {uploadProgress.stage === 'uploading' && 'Uploading...'}
                  {uploadProgress.stage === 'processing' && 'Processing...'}
                  {uploadProgress.stage === 'analyzing' && 'Analyzing audio...'}
                  {uploadProgress.stage === 'complete' && 'Complete!'}
                  {uploadProgress.stage === 'error' && 'Error occurred'}
                </span>
                <span className="text-gray-400">{uploadProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              {uploadProgress.message && (
                <p className="text-sm text-gray-400 mt-2">{uploadProgress.message}</p>
              )}
            </div>
          )}

          {/* Metadata Form */}
          {file && !uploading && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Song title"
                  />
                </div>

                {/* Artist */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Artist *
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Artist name"
                  />
                </div>

                {/* Album */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Album
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Album name"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select genre</option>
                    {genres.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-purple-200 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Add tags (e.g., chill, upbeat, acoustic)"
                    maxLength={20}
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 10}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Add up to 10 tags to help others discover your music
                </p>
              </div>

              {/* Lyrics */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lyrics (Optional)
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter song lyrics..."
                />
              </div>

              {/* Copyright Info */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Copyright Information
                </label>
                <input
                  type="text"
                  value={copyrightInfo}
                  onChange={(e) => setCopyrightInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="© 2024 Artist Name. All rights reserved."
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="explicit"
                    checked={explicitContent}
                    onChange={(e) => setExplicitContent(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="explicit" className="ml-2 text-gray-300">
                    This song contains explicit content
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="share-public"
                    checked={shareToPublic}
                    onChange={(e) => setShareToPublic(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="share-public" className="ml-2 text-gray-300 flex items-center">
                    {shareToPublic ? (
                      <Globe className="w-4 h-4 mr-1 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 mr-1 text-yellow-400" />
                    )}
                    Share with the community (others can discover and download)
                  </label>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">Important Notice:</p>
                    <ul className="space-y-1 text-yellow-300">
                      <li>• Only upload music you own or have permission to share</li>
                      <li>• Community uploads are subject to moderation</li>
                      <li>• Inappropriate content will be removed</li>
                      <li>• By uploading, you agree to our Terms of Service</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!title.trim() || !artist.trim() || uploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to Community
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityUpload;
