import React, { useState, useMemo, useCallback } from 'react';
import { Search as SearchIcon, Filter, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';
import { useDebounce } from '../hooks/useDebounce';

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const { songs } = useMusic();
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Filter by search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        song.artist.toLowerCase().includes(searchLower) ||
        song.album?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by genre
    if (filterGenre !== 'all') {
      filtered = filtered.filter(song => song.genre === filterGenre);
    }

    return filtered;
  }, [songs, debouncedSearchTerm, filterGenre]);

  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(songs.map(song => song.genre).filter(Boolean))];
    return uniqueGenres.sort();
  }, [songs]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleGenreChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterGenre(e.target.value);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search Music</h1>
        <p className="text-gray-400">Find your favorite songs, artists, and albums</p>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            aria-label="Search music"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/search/advanced"
            className="flex items-center space-x-2 px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced</span>
          </Link>
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterGenre}
            onChange={handleGenreChange}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            aria-label="Filter by genre"
          >
            <option value="all">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'All Songs'}
          </h2>
          <span className="text-gray-400 text-sm">
            {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredSongs.length > 0 ? (
          <div className="space-y-2">
            {filteredSongs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                index={index}
                showIndex={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No songs found matching "${searchTerm}"` 
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;