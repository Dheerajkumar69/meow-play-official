import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Clock, Star, Music, User, Disc } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { useDebounce } from '../hooks/useDebounce';
import SongCard from './SongCard';

interface SearchFilters {
  genre: string;
  year: string;
  duration: string;
  rating: string;
  mood: string;
  tempo: string;
}

const AdvancedSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    genre: 'all',
    year: 'all',
    duration: 'all',
    rating: 'all',
    mood: 'all',
    tempo: 'all'
  });
  const [sortBy, setSortBy] = useState('relevance');
  const { songs } = useMusic();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Text search
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(searchLower) ||
        song.artist.toLowerCase().includes(searchLower) ||
        song.album?.toLowerCase().includes(searchLower) ||
        song.lyrics?.toLowerCase().includes(searchLower)
      );
    }

    // Genre filter
    if (filters.genre !== 'all') {
      filtered = filtered.filter(song => song.genre === filters.genre);
    }

    // Year filter
    if (filters.year !== 'all') {
      const yearRange = filters.year.split('-');
      if (yearRange.length === 2) {
        const startYear = parseInt(yearRange[0]);
        const endYear = parseInt(yearRange[1]);
        filtered = filtered.filter(song => {
          const songYear = song.year || new Date(song.createdAt).getFullYear();
          return songYear >= startYear && songYear <= endYear;
        });
      }
    }

    // Duration filter
    if (filters.duration !== 'all') {
      const [min, max] = filters.duration.split('-').map(Number);
      filtered = filtered.filter(song => {
        const minutes = song.duration / 60;
        return minutes >= min && minutes <= max;
      });
    }

    // Rating filter
    if (filters.rating !== 'all') {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(song => (song.averageRating || 0) >= minRating);
    }

    // Mood filter
    if (filters.mood !== 'all') {
      filtered = filtered.filter(song => song.mood?.includes(filters.mood));
    }

    // Tempo filter
    if (filters.tempo !== 'all') {
      const [min, max] = filters.tempo.split('-').map(Number);
      filtered = filtered.filter(song => {
        const tempo = song.tempo || 120;
        return tempo >= min && tempo <= max;
      });
    }

    // Sort results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'plays':
          return (b.playCount || 0) - (a.playCount || 0);
        case 'duration':
          return a.duration - b.duration;
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default: // relevance
          return 0;
      }
    });
  }, [songs, debouncedSearchTerm, filters, sortBy]);

  const availableGenres = useMemo(() => {
    return [...new Set(songs.map(song => song.genre).filter(Boolean))].sort();
  }, [songs]);

  const availableMoods = useMemo(() => {
    const moods = new Set<string>();
    songs.forEach(song => {
      song.mood?.forEach(mood => moods.add(mood));
    });
    return Array.from(moods).sort();
  }, [songs]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genre: 'all',
      year: 'all',
      duration: 'all',
      rating: 'all',
      mood: 'all',
      tempo: 'all'
    });
    setSearchTerm('');
  };

  const activeFilterCount = Object.values(filters).filter(value => value !== 'all').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Advanced Search</h1>
        <p className="text-gray-400">Find exactly what you're looking for</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs, artists, albums, lyrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Music className="w-4 h-4 inline mr-1" />
              Genre
            </label>
            <select
              value={filters.genre}
              onChange={(e) => updateFilter('genre', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">All Genres</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => updateFilter('year', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">All Years</option>
              <option value="2020-2024">2020-2024</option>
              <option value="2015-2019">2015-2019</option>
              <option value="2010-2014">2010-2014</option>
              <option value="2000-2009">2000s</option>
              <option value="1990-1999">90s</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration
            </label>
            <select
              value={filters.duration}
              onChange={(e) => updateFilter('duration', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">Any Length</option>
              <option value="0-2">Under 2 min</option>
              <option value="2-4">2-4 min</option>
              <option value="4-6">4-6 min</option>
              <option value="6-999">Over 6 min</option>
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => updateFilter('rating', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-lg mr-1">😊</span>
              Mood
            </label>
            <select
              value={filters.mood}
              onChange={(e) => updateFilter('mood', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">All Moods</option>
              {availableMoods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <span className="text-lg mr-1">🎵</span>
              Tempo
            </label>
            <select
              value={filters.tempo}
              onChange={(e) => updateFilter('tempo', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">Any Tempo</option>
              <option value="0-90">Slow (0-90 BPM)</option>
              <option value="90-120">Medium (90-120 BPM)</option>
              <option value="120-140">Fast (120-140 BPM)</option>
              <option value="140-999">Very Fast (140+ BPM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-white font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-all"
          >
            <option value="relevance">Relevance</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="rating">Rating</option>
            <option value="plays">Most Played</option>
            <option value="duration">Duration</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
        <span className="text-gray-400 text-sm">
          {filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
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
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;