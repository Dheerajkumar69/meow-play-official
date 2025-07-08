import React, { useState, useEffect } from 'react';
import { Search, Download, Play, Filter, Globe, Heart, Info, RefreshCw, Music } from 'lucide-react';
import { musicSourceManager, ExternalSong } from '../utils/musicSources';
import { useMusic } from '../contexts/MusicContext';
import { useDebounce } from '../hooks/useDebounce';
import SpotifyImporter from '../components/SpotifyImporter';

const Discover: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ExternalSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [popularSongs, setPopularSongs] = useState<ExternalSong[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSpotifyImporter, setShowSpotifyImporter] = useState(false);
  const { songs, setSongs, play } = useMusic();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    loadPopularSongs();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchMusic(debouncedSearchTerm);
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm, selectedSource]);

  const loadPopularSongs = async () => {
    setLoading(true);
    try {
      const popular = await musicSourceManager.getPopularSongs(20);
      setPopularSongs(popular);
    } catch (error) {
      console.error('Failed to load popular songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadPopularSongs();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchMusic = async (query: string) => {
    setLoading(true);
    try {
      const searchResults = await musicSourceManager.searchAllSources(query, 30);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = (externalSong: ExternalSong) => {
    const localSong = musicSourceManager.convertToLocalSong(externalSong);
    setSongs([localSong, ...songs]);
  };

  const playExternalSong = (externalSong: ExternalSong) => {
    const localSong = musicSourceManager.convertToLocalSong(externalSong);
    play(localSong);
  };

  const SongCard: React.FC<{ song: ExternalSong; showAddButton?: boolean }> = ({ 
    song, 
    showAddButton = true 
  }) => {
    const isInLibrary = songs.some(s => s.id === song.id);

    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-all group">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {song.coverArt ? (
              <img
                src={song.coverArt}
                alt={`${song.title} by ${song.artist}`}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center" style={{ display: song.coverArt ? 'none' : 'flex' }}>
              <div className="text-white text-2xl">🎵</div>
            </div>
            <button
              onClick={() => playExternalSong(song)}
              className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Play ${song.title}`}
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{song.title}</h3>
            <p className="text-gray-400 text-sm truncate">{song.artist}</p>
            {song.album && (
              <p className="text-gray-500 text-xs truncate">{song.album}</p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <span className="badge badge-success">
                {song.license}
              </span>
              <span className="badge badge-info">
                {song.source}
              </span>
              {song.genre && (
                <span className="badge badge-primary">
                  {song.genre}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </span>
            {showAddButton && (
              <button
                onClick={() => addToLibrary(song)}
                disabled={isInLibrary}
                className={`p-2 rounded-lg transition-colors ${
                  isInLibrary
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                }`}
                title={isInLibrary ? 'Already in library' : 'Add to library'}
              >
                {isInLibrary ? <Heart className="w-4 h-4 fill-current" /> : <Download className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {song.description && (
          <p className="text-gray-400 text-sm mt-2 line-clamp-2">{song.description}</p>
        )}

        {song.tags && song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {song.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Globe className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Discover Free Music</h1>
        </div>
        <p className="text-gray-400">
          Explore Creative Commons and Public Domain music from around the world
        </p>
      </div>

      {/* Import Options */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => setShowSpotifyImporter(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Music className="w-4 h-4" />
          <span>Import from Spotify</span>
        </button>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for free music..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Search Results for "{searchTerm}"
            </h2>
            {loading && (
              <div className="text-purple-400">Searching...</div>
            )}
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : !loading && searchTerm ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
              <p className="text-gray-500">Try different search terms</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Popular Songs */}
      {!searchTerm && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Popular Free Music</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-purple-400">Loading popular songs...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {popularSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">About Free Music</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="text-purple-400 font-medium mb-2">Creative Commons</h4>
            <p className="text-gray-300">
              Music licensed for free use with attribution to the original creator.
            </p>
          </div>
          <div>
            <h4 className="text-green-400 font-medium mb-2">Public Domain</h4>
            <p className="text-gray-300">
              Music with expired copyrights, free for any use without restrictions.
            </p>
          </div>
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Royalty Free</h4>
            <p className="text-gray-300">
              Music available for use without ongoing royalty payments.
            </p>
          </div>
        </div>
      </div>

      <SpotifyImporter 
        isOpen={showSpotifyImporter} 
        onClose={() => setShowSpotifyImporter(false)} 
      />
    </div>
  );
};

export default Discover;