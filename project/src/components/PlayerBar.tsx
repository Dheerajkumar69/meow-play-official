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
  Loader,
  BarChart3,
  X
} from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import Equalizer from './Equalizer';
import LyricsDisplay from './LyricsDisplay';
import QueueManager from './QueueManager';
import MusicVisualizer from './MusicVisualizer';

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
    isRepeating,
    toggleLike
  } = useMusic();

  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

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

  const handleLike = useCallback(() => {
    if (currentSong) {
      toggleLike(currentSong.id);
    }
  }, [currentSong, toggleLike]);

  if (!currentSong) return null;

  return (
    <>
      <div className="h-20 xxs:h-22 sm:h-24 bg-black/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-between px-2 xxs:px-3 sm:px-6 flex-shrink-0">
        {/* Current Song Info */}
        <div className="flex items-center space-x-1 xxs:space-x-2 sm:space-x-4 w-1/3 xxs:w-1/4 min-w-0">
          <div className="w-10 h-10 xxs:w-12 xxs:h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 touch-manipulation">
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
            <h3 className="text-white font-semibold text-[10px] xxs:text-xs sm:text-sm truncate">
              {currentSong.title}
            </h3>
            <p className="text-gray-400 text-[9px] xxs:text-[10px] sm:text-xs truncate">
              {currentSong.artist}
            </p>
            {currentSong.averageRating && (
              <div className="hidden sm:flex items-center space-x-1 mt-1">
                <span className="text-yellow-400 text-[10px] xxs:text-xs">★</span>
                <span className="text-gray-400 text-[10px] xxs:text-xs">{currentSong.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLike}
            className={`transition-colors hidden sm:block ${
              currentSong.liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            }`}
            aria-label="Like song"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${currentSong.liked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-1/3 xxs:w-1/2 max-w-md">
          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-[10px] xxs:text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <div className="flex items-center space-x-1 xxs:space-x-2 sm:space-x-4">
            <button
              onClick={toggleShuffle}
              className={`p-1 sm:p-2 rounded-full transition-all touch-manipulation active:scale-95 ${
                isShuffled ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={prevSong}
              className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
              aria-label="Previous song"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-8 h-8 xxs:w-9 xxs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 touch-manipulation"
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
              className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
              aria-label="Next song"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-1 sm:p-2 rounded-full transition-all touch-manipulation active:scale-95 ${
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
            onClick={() => setShowVisualizer(true)}
            className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation hidden sm:block"
            aria-label="Show visualizer"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setShowLyrics(true)}
            className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation hidden sm:block"
            aria-label="Show lyrics"
          >
            <Type className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setShowQueue(true)}
            className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation hidden sm:block"
            aria-label="Show queue"
          >
            <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => setShowEqualizer(true)}
            className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation hidden sm:block"
            aria-label="Audio settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
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
      
      {/* Music Visualizer Modal */}
      {showVisualizer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Music Visualizer</h2>
              </div>
              <button
                onClick={() => setShowVisualizer(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <MusicVisualizer height={200} barCount={64} className="w-full" />
              {currentSong && (
                <div className="mt-6 text-center">
                  <h3 className="text-white font-semibold text-lg">{currentSong.title}</h3>
                  <p className="text-gray-400">{currentSong.artist}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerBar;