import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload as UploadIcon, X, Music, CheckCircle, AlertCircle, FileAudio, Sparkles, Share, Database, Cloud, HardDrive } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { useAuth } from '../contexts/AuthContext';
import { audioMetadataExtractor, AudioMetadata } from '../utils/audioMetadata';
import { sharedDatabase } from '../utils/sharedDatabase';
import { songsAPI } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'processing' | 'uploading' | 'success' | 'error';
  message?: string;
}

interface FileWithMetadata {
  file: File;
  metadata: AudioMetadata;
  id: string;
  shareToDatabase: boolean;
  uploadToServer: boolean;
  posterFile?: File;
  posterPreview?: string;
}

const Upload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithMetadata[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, status: 'idle' });
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { songs, setSongs } = useMusic();
  const { user } = useAuth();

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach(({ file }) => {
        const url = URL.createObjectURL(file);
        URL.revokeObjectURL(url);
      });
    };
  }, [selectedFiles]);

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a', 'audio/aac', 'audio/flac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)) {
      return 'Invalid file type. Please upload MP3, WAV, OGG, M4A, AAC, or FLAC files.';
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }
    
    return null;
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    setProcessingFiles(true);
    const processedFiles: FileWithMetadata[] = [];

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        console.warn(`Skipping ${file.name}: ${validationError}`);
        continue;
      }

      try {
        // Extract metadata automatically
        const metadata = await audioMetadataExtractor.extractMetadata(file);
        
        processedFiles.push({
          file,
          metadata,
          id: uuidv4(),
          shareToDatabase: true, // Default to sharing locally
          uploadToServer: true // Default to uploading to server
        });
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Still add the file with basic info
        processedFiles.push({
          file,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist'
          },
          id: uuidv4(),
          shareToDatabase: true,
          uploadToServer: true
        });
      }
    }

    setSelectedFiles(prev => [...prev, ...processedFiles]);
    setProcessingFiles(false);
  }, [validateFile]);

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
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)
    );
    
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const updateFileMetadata = useCallback((fileId: string, field: keyof AudioMetadata, value: string) => {
    setSelectedFiles(prev => prev.map(item => 
      item.id === fileId 
        ? { ...item, metadata: { ...item.metadata, [field]: value } }
        : item
    ));
  }, []);

  const handlePosterUpload = useCallback(async (fileId: string, posterFile: File) => {
    try {
      // Process the poster image
      const posterPreview = await audioMetadataExtractor.processPosterImage(posterFile);
      
      // Update the file metadata with the poster
      setSelectedFiles(prev => prev.map(item => 
        item.id === fileId 
          ? { 
              ...item, 
              posterFile, 
              posterPreview,
              metadata: { 
                ...item.metadata, 
                coverArt: posterPreview 
              } 
            }
          : item
      ));
    } catch (error) {
      console.error('Failed to process poster image:', error);
    }
  }, []);

  const toggleShareToDatabase = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.map(item => 
      item.id === fileId 
        ? { ...item, shareToDatabase: !item.shareToDatabase }
        : item
    ));
  }, []);
  
  const toggleUploadToServer = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.map(item => 
      item.id === fileId 
        ? { ...item, uploadToServer: !item.uploadToServer }
        : item
    ));
  }, []);
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(item => item.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(URL.createObjectURL(fileToRemove.file));
      }
      return prev.filter(item => item.id !== fileId);
    });
  }, []);

  const simulateUploadProgress = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          setUploadProgress({ progress, status: 'success' });
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress({ progress, status: 'uploading' });
        }
      }, 200);
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: 'Please select at least one audio file' 
      });
      return;
    }

    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      // Simulate upload process with progress
      await simulateUploadProgress();

      // Process each file
      const newSongs = [];
      const sharedSongs = [];
      const serverSongs = [];

      for (const { file, metadata, shareToDatabase, uploadToServer, posterFile } of selectedFiles) {
        // Create local song with blob URL for immediate playback
        const localBlobUrl = URL.createObjectURL(file);
        
        const localSong = {
          id: uuidv4(),
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album,
          genre: metadata.genre,
          duration: metadata.duration || 180,
          filePath: localBlobUrl,
          coverArt: metadata.coverArt || '/assets/default-cover.svg',
          uploadedBy: user?.id || '1',
          createdAt: new Date(),
          playCount: 0,
          year: metadata.year
        };

        newSongs.push(localSong);

        // Share to local database if enabled
        if (shareToDatabase && user) {
          try {
            const sharedSong = await sharedDatabase.uploadToSharedDatabase(
              file,
              user.id,
              user.username,
              {
                title: metadata.title,
                artist: metadata.artist,
                album: metadata.album,
                genre: metadata.genre,
                coverArt: metadata.coverArt || '/assets/default-cover.svg',
                year: metadata.year
              },
              posterFile // Pass the poster file to the upload function
            );
            sharedSongs.push(sharedSong);
          } catch (error) {
            console.error('Failed to share song to local database:', error);
          }
        }
        
        // Upload to server if enabled
        if (uploadToServer && user) {
          try {
            const songData = {
              title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
              artist: metadata.artist || 'Unknown Artist',
              album: metadata.album,
              genre: metadata.genre,
              duration: metadata.duration || 180,
              year: metadata.year,
              mood: metadata.mood
            };
            
            const serverSong = await songsAPI.uploadSong(file, songData, posterFile);
            serverSongs.push(serverSong);
          } catch (error) {
            console.error('Failed to upload song to server:', error);
            // Show error in UI
            setUploadProgress(prev => ({
              ...prev,
              message: `${prev.message || ''} Error uploading to server: ${error.message || 'Unknown error'}`
            }));
          }
        }
      }

      // Create new song objects (keeping original logic)
      /*const newSongs = selectedFiles.map(({ file, metadata }) => ({
        id: uuidv4(),
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: metadata.artist || 'Unknown Artist',
        album: metadata.album,
        genre: metadata.genre,
        duration: metadata.duration || 180,
        filePath: URL.createObjectURL(file),
        coverArt: metadata.coverArt,
        uploadedBy: '1',
        createdAt: new Date(),
        playCount: 0,
        year: metadata.year
      }));*/

      // Add to songs list
      setSongs([...newSongs, ...songs]);

      // Reset form
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setUploadProgress({ 
        progress: 100, 
        status: 'success', 
        message: `Successfully uploaded ${newSongs.length} song${newSongs.length > 1 ? 's' : ''}! ${sharedSongs.length > 0 ? `${sharedSongs.length} shared locally! ` : ''}${serverSongs.length > 0 ? `${serverSongs.length} uploaded to server! 🐱` : '🐱'}` 
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadProgress({ progress: 0, status: 'idle' });
      }, 3000);

    } catch (error) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: 'Upload failed. Please try again.' 
      });
    }
  }, [selectedFiles, simulateUploadProgress, setSongs, songs]);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-4xl">🐱</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Upload Your Meow-sic</h1>
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-gray-400">
          Drag & drop your audio files and let our smart detection do the rest!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Enhanced Drag & Drop Zone */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 sm:p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all file-upload-area ${
              dragActive ? 'drag-active border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-purple-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {processingFiles ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-white mb-2">
                    🐱 Analyzing your meow-sic...
                  </p>
                  <p className="text-gray-400">
                    Detecting metadata and extracting song details
                  </p>
                </div>
              </div>
            ) : selectedFiles.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <FileAudio className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready to upload! 🎉
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Review and edit the details below, then click upload
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all btn-hover"
                  >
                    Add More Files
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <UploadIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                  <span className="text-4xl">🐱</span>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Drop your audio files here, kitty! 🎵
                  </p>
                  <p className="text-gray-400 mb-4">
                    or click to browse files - we'll detect all the details automatically!
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all btn-hover"
                  >
                    Choose Files
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Supported: MP3, WAV, OGG, M4A, AAC, FLAC (Max 100MB each)
                </p>
              </div>
            )}
          </div>
          
          {/* Upload Progress */}
          {uploadProgress.status === 'uploading' && (
            <div className="mt-6 space-y-2">
              <div className="w-full bg-gray-600 rounded-full h-3 progress-bar">
                <div 
                  className="progress-fill h-3"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm text-center">
                Uploading your meow-sic... {Math.round(uploadProgress.progress)}% 🐱
              </p>
            </div>
          )}
          
          {/* Upload Status */}
          {uploadProgress.status === 'success' && (
            <div className="mt-6 flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>{uploadProgress.message}</span>
            </div>
          )}
          
          {uploadProgress.status === 'error' && (
            <div className="mt-6 flex items-center justify-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{uploadProgress.message}</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
        </div>

        {/* File Details Editor */}
        {selectedFiles.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 sm:p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Auto-Detected Song Details</h2>
              <span className="text-2xl">🎵</span>
            </div>
            
            <div className="space-y-6">
              {selectedFiles.map((fileItem) => (
                <div key={fileItem.id} className="bg-white/5 rounded-lg p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{fileItem.file.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                          {fileItem.metadata.duration && ` • ${Math.floor(fileItem.metadata.duration / 60)}:${(fileItem.metadata.duration % 60).toString().padStart(2, '0')}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileItem.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Title <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={fileItem.metadata.title || ''}
                        onChange={(e) => updateFileMetadata(fileItem.id, 'title', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Song title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Artist
                      </label>
                      <input
                        type="text"
                        value={fileItem.metadata.artist || ''}
                        onChange={(e) => updateFileMetadata(fileItem.id, 'artist', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Artist name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Album
                      </label>
                      <input
                        type="text"
                        value={fileItem.metadata.album || ''}
                        onChange={(e) => updateFileMetadata(fileItem.id, 'album', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="Album name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Genre
                      </label>
                      <select
                        value={fileItem.metadata.genre || ''}
                        onChange={(e) => updateFileMetadata(fileItem.id, 'genre', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-gray-800 text-white">Select genre</option>
                        <option value="Pop" className="bg-gray-800 text-white">Pop</option>
                        <option value="Rock" className="bg-gray-800 text-white">Rock</option>
                        <option value="Hip Hop" className="bg-gray-800 text-white">Hip Hop</option>
                        <option value="Electronic" className="bg-gray-800 text-white">Electronic</option>
                        <option value="Jazz" className="bg-gray-800 text-white">Jazz</option>
                        <option value="Classical" className="bg-gray-800 text-white">Classical</option>
                        <option value="Country" className="bg-gray-800 text-white">Country</option>
                        <option value="R&B" className="bg-gray-800 text-white">R&B</option>
                        <option value="Alternative" className="bg-gray-800 text-white">Alternative</option>
                        <option value="Ambient" className="bg-gray-800 text-white">Ambient</option>
                        <option value="Synthwave" className="bg-gray-800 text-white">Synthwave</option>
                        <option value="Folk" className="bg-gray-800 text-white">Folk</option>
                        <option value="Reggae" className="bg-gray-800 text-white">Reggae</option>
                        <option value="Other" className="bg-gray-800 text-white">Other</option>
                      </select>
                    </div>
                    
                    {/* Poster Image Upload */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cover Image (Optional)
                      </label>
                      <div className="flex items-start space-x-4">
                        <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-lg overflow-hidden flex items-center justify-center">
                          {fileItem.posterPreview ? (
                            <img 
                              src={fileItem.posterPreview} 
                              alt="Cover preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center">
                              <Music className="w-8 h-8 text-white/70" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePosterUpload(fileItem.id, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            id={`poster-upload-${fileItem.id}`}
                          />
                          <label 
                            htmlFor={`poster-upload-${fileItem.id}`}
                            className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium cursor-pointer transition-colors"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {fileItem.posterFile ? 'Change Cover Image' : 'Upload Cover Image'}
                          </label>
                          <p className="text-gray-400 text-xs mt-2">
                            Upload a custom cover image for your song. Recommended size: 500x500px.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Share to Database Option */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="w-5 h-5 text-purple-400" />
                        <div>
                          <h4 className="text-white font-medium">Share to Local Database</h4>
                          <p className="text-gray-400 text-sm">Store this song in your local device database</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleShareToDatabase(fileItem.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          fileItem.shareToDatabase ? 'bg-purple-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            fileItem.shareToDatabase ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {fileItem.shareToDatabase && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Share className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm">
                            This song will be stored in your local device database
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload to Server Option */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Cloud className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="text-white font-medium">Upload to Server</h4>
                          <p className="text-gray-400 text-sm">Store this song on the server for cross-device access</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleUploadToServer(fileItem.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          fileItem.uploadToServer ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            fileItem.uploadToServer ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {fileItem.uploadToServer && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Cloud className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-300 text-sm">
                            This song will be uploaded to the server for access across all your devices
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedFiles.length > 0 && (
          <div className="text-center">
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploadProgress.status === 'uploading'}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-hover flex items-center space-x-2 mx-auto"
            >
              <span className="text-xl">🐱</span>
              <span>
                {uploadProgress.status === 'uploading' 
                  ? 'Uploading Meow-sic...' 
                  : `Upload ${selectedFiles.length} Song${selectedFiles.length > 1 ? 's' : ''}`
                }
              </span>
              <span className="text-xl">🎵</span>
            </button>
            <p className="text-gray-500 text-sm mt-2">
              🐾 Smart detection automatically fills in song details from your files!
            </p>
          </div>
        )}
      </form>

      {/* Features Info */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span>Smart Detection Features</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="text-purple-400 font-medium mb-2">🎵 Metadata Extraction</h4>
                <p className="text-gray-300">
                  Automatically detects title, artist, album, and genre from file metadata and filename patterns.
                </p>
              </div>
              <div>
                <h4 className="text-green-400 font-medium mb-2">⏱️ Duration Detection</h4>
                <p className="text-gray-300">
                  Analyzes audio files to determine exact duration and other technical details.
                </p>
              </div>
              <div>
                <h4 className="text-blue-400 font-medium mb-2">🖼️ Cover Art Support</h4>
                <p className="text-gray-300">
                  Extracts embedded album artwork when available in the audio file.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Database className="w-6 h-6 text-purple-400" />
              <span>Community Sharing</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="text-purple-400 font-medium mb-2">🌍 Global Database</h4>
                <p className="text-gray-300">
                  Share your music with the entire Meow-Play community automatically.
                </p>
              </div>
              <div>
                <h4 className="text-green-400 font-medium mb-2">🔍 Auto-Discovery</h4>
                <p className="text-gray-300">
                  Other users can discover your uploads through search and recommendations.
                </p>
              </div>
              <div>
                <h4 className="text-blue-400 font-medium mb-2">👑 Admin Control</h4>
                <p className="text-gray-300">
                  Only administrators can remove songs from the shared database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Old Features Info - keeping for reference */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6" style={{ display: 'none' }}>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <span>Smart Detection Features</span>
          <span className="text-2xl">🐱</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="text-purple-400 font-medium mb-2">🎵 Metadata Extraction</h4>
            <p className="text-gray-300">
              Automatically detects title, artist, album, and genre from file metadata and filename patterns.
            </p>
          </div>
          <div>
            <h4 className="text-green-400 font-medium mb-2">⏱️ Duration Detection</h4>
            <p className="text-gray-300">
              Analyzes audio files to determine exact duration and other technical details.
            </p>
          </div>
          <div>
            <h4 className="text-blue-400 font-medium mb-2">🖼️ Cover Art Support</h4>
            <p className="text-gray-300">
              Extracts embedded album artwork when available in the audio file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;