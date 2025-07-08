import React, { useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle, 
  Repeat,
  Heart,
  ListMusic,
  Settings,
  Type,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import Equalizer from './Equalizer';
import LyricsDisplay from './LyricsDisplay';
import QueueManager from './QueueManager';

const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    loading,
    error,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
    seek,
    toggleShuffle,
    toggleRepeat,
    isShuffled,
    isRepeating
  } = useMusic();

  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const [isLiked, setIsLiked] = useState(false);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = useMemo(() => {
    if (!duration || duration <= 0 || isNaN(currentTime) || isNaN(duration)) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!isNaN(time) && time >= 0) {
      seek(time);
    }
  }, [seek]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (!isNaN(vol)) {
      setVolume(vol);
      if (vol > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  }, [setVolume, isMuted]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, previousVolume, setVolume]);

  const toggleLike = useCallback(() => {
    setIsLiked(!isLiked);
    // TODO: Implement actual like functionality
  }, [isLiked]);

  if (!currentSong) return null;

  return (
    <>
      <div className="h-20 sm:h-24 bg-black/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-between px-3 sm:px-6 flex-shrink-0">
        {/* Current Song Info */}
        <div className="flex items-center space-x-2 sm:space-x-4 w-1/4 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {currentSong.coverArt ? (
              <img 
                src={currentSong.coverArt} 
                alt={currentSong.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-white text-lg sm:text-2xl">🎵</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-xs sm:text-sm truncate">
              {currentSong.title}
            </h3>
            <p className="text-gray-400 text-xs truncate">
              {currentSong.artist}
            </p>
            {currentSong.averageRating && (
              <div className="hidden sm:flex items-center space-x-1 mt-1">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="text-gray-400 text-xs">{currentSong.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <button 
            onClick={toggleLike}
            className={`transition-colors hidden sm:block ${
              isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            }`}
            aria-label="Like song"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-1/2 max-w-md">
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleShuffle}
              className={`p-1 sm:p-2 rounded-full transition-colors ${
                isShuffled ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={prevSong}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Previous song"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {loading ? (
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={nextSong}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Next song"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-1 sm:p-2 rounded-full transition-colors ${
                isRepeating ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Toggle repeat"
            >
              <Repeat className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-gray-400 min-w-[30px] sm:min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime || 0}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
                aria-label="Seek"
              />
            </div>
            <span className="text-xs text-gray-400 min-w-[30px] sm:min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4 w-1/4 justify-end">
          <button 
            onClick={() => setShowLyrics(true)}
            className="text-gray-400 hover:text-white transition-colors hidden sm:block"
            aria-label="Show lyrics"
          >
            <Type className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setShowQueue(true)}
            className="text-gray-400 hover:text-white transition-colors hidden sm:block"
            aria-label="Show queue"
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setShowEqualizer(true)}
            className="text-gray-400 hover:text-white transition-colors hidden sm:block"
            aria-label="Audio settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider hidden sm:block"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      <Equalizer isOpen={showEqualizer} onClose={() => setShowEqualizer(false)} />
      <LyricsDisplay isOpen={showLyrics} onClose={() => setShowLyrics(false)} />
      <QueueManager isOpen={showQueue} onClose={() => setShowQueue(false)} />
    </>
  );
};

export default PlayerBar;