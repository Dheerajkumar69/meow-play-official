import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Grid, List, Filter, Sparkles, RefreshCw, Clock, Heart, TrendingUp, Zap } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';
import { playlistGenerator, PlaylistSuggestion } from '../utils/playlistGenerator';
import { db } from '../utils/indexedDB';
import { Song, Playlist } from '../types';

const Library: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('recent');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'songs' | 'playlists' | 'suggestions'>(
    (searchParams.get('tab') as any) || 'songs'
  );
  const [suggestions, setSuggestions] = useState<PlaylistSuggestion[]>([]);
  const [weekendSpecial, setWeekendSpecial] = useState<Playlist | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState({ days: 0, hours: 0 });
  
  const { songs, setQueue, play } = useMusic();

  // Load recently played songs
  useEffect(() => {
    const loadRecentlyPlayed = async () => {
      try {
        const recent = await db.getRecentlyPlayed();
        setRecentlyPlayed(recent);
      } catch (error) {
        console.error('Failed to load recently played:', error);
      }
    };
    loadRecentlyPlayed();
  }, []);

  // Generate suggestions and weekend special
  useEffect(() => {
    if (songs.length > 0) {
      const habits = playlistGenerator.analyzeListeningHabits(songs, recentlyPlayed);
      const newSuggestions = playlistGenerator.generateSuggestions(songs, habits);
      const weekend = playlistGenerator.generateWeekendSpecial(songs, habits);
      
      setSuggestions(newSuggestions);
      setWeekendSpecial(weekend);
      
      // Update time until next refresh
      const timeLeft = playlistGenerator.getTimeUntilNextRefresh();
      setTimeUntilRefresh(timeLeft);
    }
  }, [songs, recentlyPlayed]);

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return (b.playCount || 0) - (a.playCount || 0);
        default:
          return 0;
      }
    });
  }, [songs, sortBy]);

  const handlePlayAll = useCallback(() => {
    if (sortedSongs.length > 0) {
      setQueue(sortedSongs);
      play(sortedSongs[0]);
    }
  }, [sortedSongs, setQueue, play]);

  const handlePlaySuggestion = useCallback((suggestion: PlaylistSuggestion) => {
    if (suggestion.songs.length > 0) {
      setQueue(suggestion.songs);
      play(suggestion.songs[0]);
    }
  }, [setQueue, play]);

  const handlePlayWeekendSpecial = useCallback(() => {
    if (weekendSpecial && weekendSpecial.songs.length > 0) {
      setQueue(weekendSpecial.songs);
      play(weekendSpecial.songs[0]);
    }
  }, [weekendSpecial, setQueue, play]);

  const handleRefreshSuggestions = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const habits = playlistGenerator.analyzeListeningHabits(songs, recentlyPlayed);
      const newSuggestions = playlistGenerator.generateSuggestions(songs, habits);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setRefreshing(false);
    }
  }, [songs, recentlyPlayed]);

  const handleForceRefreshWeekend = useCallback(() => {
    if (songs.length > 0) {
      const habits = playlistGenerator.analyzeListeningHabits(songs, recentlyPlayed);
      const newWeekend = playlistGenerator.forceRefreshWeekendSpecial(songs, habits);
      setWeekendSpecial(newWeekend);
      
      const timeLeft = playlistGenerator.getTimeUntilNextRefresh();
      setTimeUntilRefresh(timeLeft);
    }
  }, [songs, recentlyPlayed]);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  const handleTabChange = useCallback((tab: 'songs' | 'playlists' | 'suggestions') => {
    setActiveTab(tab);
    setSearchParams(tab === 'songs' ? {} : { tab });
  }, [setSearchParams]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Match';
    if (confidence >= 0.6) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🐱</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Your Meow-sic Library</h1>
            <p className="text-gray-400">{songs.length} songs in your purr-fect collection</p>
          </div>
        </div>
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Play All</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1">
        {[
          { id: 'songs', label: 'Songs', icon: '🎵' },
          { id: 'playlists', label: 'Playlists', icon: '📝' },
          { id: 'suggestions', label: 'For You', icon: '✨' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Songs Tab */}
      {activeTab === 'songs' && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  aria-label="Sort songs"
                >
                  <option value="recent">Recently Added</option>
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="popular">Most Played</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Songs */}
          {songs.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <div className="text-6xl mb-4">🐱</div>
                <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
                <p>Start by uploading some meow-sic or exploring our collection</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  {sortedSongs.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={index}
                      showIndex={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedSongs.map((song) => (
                    <div key={song.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-all group">
                      <div className="relative mb-4">
                        {song.coverArt ? (
                          <img
                            src={song.coverArt}
                            alt={`${song.title} cover`}
                            className="w-full aspect-square object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <div className="text-white text-4xl">🎵</div>
                          </div>
                        )}
                        <button
                          onClick={() => play(song)}
                          className="absolute bottom-2 right-2 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                          aria-label={`Play ${song.title}`}
                        >
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </button>
                      </div>
                      <h3 className="text-white font-semibold truncate">{song.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          {/* Weekend Special */}
          {weekendSpecial && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">🐱</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{weekendSpecial.name}</h2>
                    <p className="text-gray-300">{weekendSpecial.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-400">
                    <p>Next refresh in:</p>
                    <p className="text-purple-400 font-semibold">
                      {timeUntilRefresh.days}d {timeUntilRefresh.hours}h
                    </p>
                  </div>
                  <button
                    onClick={handleForceRefreshWeekend}
                    className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                    title="Force refresh (for testing)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handlePlayWeekendSpecial}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {weekendSpecial.songs.slice(0, 6).map((song, index) => (
                  <div key={song.id} className="relative group">
                    {song.coverArt ? (
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-full aspect-square object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">🎵</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => play(song)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
                      >
                        <Play className="w-4 h-4 text-black ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {weekendSpecial.songs.length > 6 && (
                <p className="text-gray-400 text-sm mt-3">
                  +{weekendSpecial.songs.length - 6} more songs
                </p>
              )}
            </div>
          )}

          {/* Regular Playlists */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Your Playlists</h3>
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📝</span>
              <h4 className="text-lg font-semibold text-gray-400 mb-2">No custom playlists yet</h4>
              <p className="text-gray-500">Create your first playlist to organize your meow-sic!</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Personalized For You</h2>
              <span className="text-2xl">🐱</span>
            </div>
            <button
              onClick={handleRefreshSuggestions}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-white">{suggestion.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(suggestion.confidence)} bg-current/20`}>
                          {getConfidenceText(suggestion.confidence)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{suggestion.description}</p>
                      <p className="text-gray-500 text-xs">{suggestion.reason}</p>
                    </div>
                    <button
                      onClick={() => handlePlaySuggestion(suggestion)}
                      className="ml-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {suggestion.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {suggestion.songs.slice(0, 3).map((song) => (
                      <div key={song.id} className="relative group">
                        {song.coverArt ? (
                          <img
                            src={song.coverArt}
                            alt={song.title}
                            className="w-full aspect-square object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">🎵</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => play(song)}
                            className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          >
                            <Play className="w-3 h-3 text-black ml-0.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-gray-400 text-sm mt-3">
                    {suggestion.songs.length} songs • {Math.floor(suggestion.confidence * 100)}% match
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Building your suggestions...</h3>
              <p className="text-gray-500">
                Play more songs to get personalized recommendations! 🐱
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;