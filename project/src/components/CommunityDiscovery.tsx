/**
 * Community Discovery Component for Global Music Sharing
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, TrendingUp, Heart, Download, Share2, Flag, Play, Pause, User, Music, Clock, Eye } from 'lucide-react';
import { CommunityApiService, CommunityMusic, CommunitySearchFilters } from '../services/communityApi';
import { useAppSelector, useAppDispatch } from '../store';
import { playSong } from '../store/slices/musicSlice';
import { addToQueue } from '../store/slices/queueSlice';
import { addToast } from '../store/slices/uiSlice';

interface CommunityDiscoveryProps {
  className?: string;
}

export const CommunityDiscovery: React.FC<CommunityDiscoveryProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying } = useAppSelector(state => state.music);
  const { currentUser } = useAppSelector(state => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityMusic[]>([]);
  const [trendingMusic, setTrendingMusic] = useState<CommunityMusic[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'play_count' | 'like_count' | 'created_at'>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  const communityApi = CommunityApiService.getInstance();

  const genres = [
    'All', 'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 
    'Country', 'R&B', 'Reggae', 'Folk', 'Blues', 'Metal', 'Indie', 'Alternative'
  ];

  // Load trending music on component mount
  useEffect(() => {
    loadTrendingMusic();
  }, []);

  const loadTrendingMusic = async () => {
    try {
      setLoading(true);
      const trending = await communityApi.getTrendingMusic(20);
      setTrendingMusic(trending);
    } catch (error) {
      console.error('Failed to load trending music:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to load trending music'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() && !selectedGenre) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const filters: CommunitySearchFilters = {
        query: searchQuery.trim() || undefined,
        genre: selectedGenre && selectedGenre !== 'All' ? selectedGenre : undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        limit: 50
      };

      const results = await communityApi.searchMusic(filters);
      setSearchResults(results.items);
    } catch (error) {
      console.error('Failed to search music:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to search music'
      }));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre, sortBy, dispatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [handleSearch]);

  const handlePlaySong = async (song: CommunityMusic) => {
    try {
      // Convert CommunityMusic to Song format
      const songData = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
        duration: song.duration,
        url: song.file_url,
        coverArt: song.cover_art_url,
        explicit: song.explicit_content,
        playCount: song.play_count,
        likeCount: song.like_count,
        isLiked: likedSongs.has(song.id)
      };

      dispatch(playSong(songData));
      
      // Track play in community stats
      // This would be handled by the backend when the song actually starts playing
    } catch (error) {
      console.error('Failed to play song:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to play song'
      }));
    }
  };

  const handleAddToQueue = (song: CommunityMusic) => {
    const songData = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      duration: song.duration,
      url: song.file_url,
      coverArt: song.cover_art_url,
      explicit: song.explicit_content
    };

    dispatch(addToQueue({ song: songData, position: 'end' }));
    dispatch(addToast({
      type: 'success',
      message: `Added "${song.title}" to queue`
    }));
  };

  const handleLikeSong = async (song: CommunityMusic) => {
    if (!currentUser) {
      dispatch(addToast({
        type: 'error',
        message: 'Please log in to like songs'
      }));
      return;
    }

    try {
      const result = await communityApi.toggleMusicLike(song.id);
      
      if (result.liked) {
        setLikedSongs(prev => new Set([...prev, song.id]));
      } else {
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      }

      dispatch(addToast({
        type: 'success',
        message: result.liked ? 'Song liked!' : 'Song unliked'
      }));
    } catch (error) {
      console.error('Failed to like song:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to like song'
      }));
    }
  };

  const handleDownloadSong = async (song: CommunityMusic) => {
    if (!currentUser) {
      dispatch(addToast({
        type: 'error',
        message: 'Please log in to download songs'
      }));
      return;
    }

    try {
      const result = await communityApi.downloadMusic(song.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = result.download_url;
      link.download = `${song.artist} - ${song.title}.${song.audio_format || 'mp3'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(addToast({
        type: 'success',
        message: `Downloading "${song.title}"`
      }));
    } catch (error) {
      console.error('Failed to download song:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to download song'
      }));
    }
  };

  const handleShareSong = async (song: CommunityMusic) => {
    try {
      const shareData = {
        title: `${song.artist} - ${song.title}`,
        text: `Check out this song on Meow-Play!`,
        url: `${window.location.origin}/community/music/${song.id}`
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        dispatch(addToast({
          type: 'success',
          message: 'Song link copied to clipboard!'
        }));
      }
    } catch (error) {
      console.error('Failed to share song:', error);
    }
  };

  const handleReportSong = async (song: CommunityMusic) => {
    if (!currentUser) {
      dispatch(addToast({
        type: 'error',
        message: 'Please log in to report content'
      }));
      return;
    }

    // This would open a report modal in a real implementation
    const reason = prompt('Report reason (copyright/inappropriate/spam/harassment/other):');
    if (!reason) return;

    try {
      await communityApi.reportMusic(song.id, reason as any);
      dispatch(addToast({
        type: 'success',
        message: 'Content reported successfully'
      }));
    } catch (error) {
      console.error('Failed to report song:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to report content'
      }));
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const SongCard: React.FC<{ song: CommunityMusic; showUploader?: boolean }> = ({ 
    song, 
    showUploader = false 
  }) => {
    const isCurrentSong = currentSong?.id === song.id;
    const isLiked = likedSongs.has(song.id);

    return (
      <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors group">
        <div className="flex items-center space-x-4">
          {/* Cover Art */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <img
              src={song.cover_art_url || '/default-cover.jpg'}
              alt={song.title}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => handlePlaySong(song)}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            >
              {isCurrentSong && isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{song.title}</h3>
            <p className="text-gray-400 truncate">{song.artist}</p>
            {song.album && (
              <p className="text-gray-500 text-sm truncate">{song.album}</p>
            )}
            {showUploader && song.uploaded_by && (
              <p className="text-purple-400 text-sm flex items-center mt-1">
                <User className="w-3 h-3 mr-1" />
                Uploaded by User
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="hidden md:flex flex-col items-end text-sm text-gray-400 space-y-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {formatNumber(song.play_count)}
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {formatNumber(song.like_count)}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(song.duration)}
              </span>
            </div>
            {song.genre && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                {song.genre}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleLikeSong(song)}
              className={`p-2 rounded-full hover:bg-gray-700 ${
                isLiked ? 'text-red-400' : 'text-gray-400'
              }`}
              title="Like"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => handleAddToQueue(song)}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
              title="Add to Queue"
            >
              <Music className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleDownloadSong(song)}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleShareSong(song)}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => handleReportSong(song)}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400"
              title="Report"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`community-discovery ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Community Discovery</h1>
        <p className="text-gray-400">Discover amazing music shared by the Meow-Play community</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search community music..."
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {genres.map(genre => (
              <option key={genre} value={genre === 'All' ? '' : genre}>
                {genre}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="relevance">Relevance</option>
            <option value="play_count">Most Played</option>
            <option value="like_count">Most Liked</option>
            <option value="created_at">Newest</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Search Results */}
        {searchQuery || selectedGenre ? (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map(song => (
                  <SongCard key={song.id} song={song} showUploader />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No music found matching your search criteria</p>
              </div>
            )}
          </div>
        ) : (
          /* Trending Music */
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              Trending Now
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {trendingMusic.map((song, index) => (
                  <div key={song.id} className="relative">
                    <div className="absolute left-2 top-4 text-2xl font-bold text-purple-400 z-10">
                      #{index + 1}
                    </div>
                    <div className="pl-12">
                      <SongCard song={song} showUploader />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDiscovery;
