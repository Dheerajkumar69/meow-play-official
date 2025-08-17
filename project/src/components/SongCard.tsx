import React, { useState, useCallback, useMemo } from 'react';
import { Play, Pause, MoreHorizontal, Heart, Plus, MessageCircle } from 'lucide-react';
import { Song } from '../types';
import { useMusic } from '../contexts/MusicContext';
import SongRating from './SongRating';
import SongComments from './SongComments';

interface SongCardProps {
  song: Song;
  index?: number;
  showIndex?: boolean;
  isPlaying?: boolean;
  onAddToPlaylist?: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ 
  song, 
  index, 
  showIndex = false,
  onAddToPlaylist 
}) => {
  const { currentSong, isPlaying, play, pause, addToQueue, toggleLike } = useMusic();
  const [showComments, setShowComments] = useState(false);
  // Use the liked property directly from the song object
  
  const isCurrentSong = useMemo(() => currentSong?.id === song.id, [currentSong?.id, song.id]);
  const isCurrentlyPlaying = useMemo(() => isCurrentSong && isPlaying, [isCurrentSong, isPlaying]);

  const handlePlay = useCallback(() => {
    if (isCurrentSong) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      play(song);
    }
  }, [isCurrentSong, isPlaying, play, pause, song]);

  const handleAddToQueue = useCallback(() => {
    addToQueue(song);
  }, [addToQueue, song]);

  const handleShowComments = useCallback(() => {
    setShowComments(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setShowComments(false);
  }, []);

  const handleLike = useCallback(() => {
    toggleLike(song.id);
  }, [toggleLike, song.id]);

  const formatDuration = useCallback((duration: number) => {
    if (isNaN(duration) || duration < 0) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <>
      <div className={`group flex items-center space-x-2 xxs:space-x-3 sm:space-x-4 p-2 xxs:p-3 rounded-lg glass hover:glass-enhanced interactive-lift transition-all duration-200 ${
        isCurrentSong ? 'bg-brand-500/20 shadow-glow-sm' : 'hover:bg-white/5'
      }`}>
        {/* Index/Play Button */}
        <div className="w-8 flex items-center justify-center touch-manipulation">
          {showIndex && (
            <span className={`text-sm ${isCurrentSong ? 'text-purple-400' : 'text-gray-400'} group-hover:hidden`}>
              {(index ?? 0) + 1}
            </span>
          )}
          <button
            onClick={handlePlay}
            className={`${showIndex ? 'hidden' : ''} group-hover:block w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition-colors touch-manipulation`}
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {song.coverArt ? (
              <img
                src={song.coverArt}
                alt={`${song.title} cover`}
                className="w-10 h-10 xxs:w-12 xxs:h-12 rounded-lg object-cover touch-manipulation"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <div className="text-white text-lg">
                  {song.uploadedBy === 'community' ? '🌍' : '🎵'}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm xxs:text-base font-semibold truncate ${
                isCurrentSong ? 'text-purple-400' : 'text-white'
              }`}>
                {song.title}
              </h3>
              <p className="text-gray-400 text-xs xxs:text-sm truncate">
                {song.artist}
                {song.uploadedBy === 'community' && (
                  <span className="ml-2 text-xs text-blue-400">• Community</span>
                )}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <SongRating song={song} />
                {song.mood && song.mood.length > 0 && (
                  <div className="flex space-x-1">
                    {song.mood.slice(0, 2).map((mood) => (
                      <span key={mood} className="px-1.5 xxs:px-2 py-0.5 xxs:py-1 bg-purple-500/20 text-purple-300 text-[10px] xxs:text-xs rounded-full">
                        {mood}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Album */}
        <div className="hidden md:block w-48">
          <p className="text-gray-400 text-sm truncate">
            {song.album || 'Unknown Album'}
          </p>
        </div>

        {/* Play Count */}
        <div className="hidden lg:block w-20 text-right">
          <p className="text-gray-400 text-sm">
            {(song.playCount ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Duration */}
        <div className="text-gray-400 text-sm w-16 text-right">
          {formatDuration(song.duration)}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleLike}
            className={`p-2 transition-all ${
              song.liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
            } active:scale-95 touch-manipulation`}
            aria-label="Like song"
          >
            <Heart className={`w-4 h-4 ${song.liked ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={handleAddToQueue}
            className="p-2 text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
            aria-label="Add to queue"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShowComments}
            className="p-2 text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
            aria-label="Show comments"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-white active:scale-95 transition-all touch-manipulation"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SongComments 
        songId={song.id} 
        isOpen={showComments} 
        onClose={handleCloseComments} 
      />
    </>
  );
};

export default React.memo(SongCard);