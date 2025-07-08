import React, { useState, useEffect } from 'react';
import { Clock, Play, Filter, Music } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';
import { Song } from '../types';
import { db } from '../utils/indexedDB';

const RecentlyPlayed: React.FC = () => {
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const { setQueue, play } = useMusic();

  useEffect(() => {
    const loadRecentSongs = async () => {
      try {
        const recent = await db.getRecentlyPlayed();
        setRecentSongs(recent);
      } catch (error) {
        console.error('Failed to load recently played songs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentSongs();
  }, []);

  const sortedSongs = React.useMemo(() => {
    return [...recentSongs].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [recentSongs, sortBy]);

  const handlePlayAll = () => {
    if (sortedSongs.length > 0) {
      setQueue(sortedSongs);
      play(sortedSongs[0]);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your listening history?')) {
      try {
        await db.clearCache();
        setRecentSongs([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Recently Played</h1>
            <p className="text-gray-400">Loading your listening history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Recently Played</h1>
            <p className="text-gray-400">{recentSongs.length} songs in your history</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {recentSongs.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Play All</span>
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
              >
                Clear History
              </button>
            </>
          )}
        </div>
      </div>

      {recentSongs.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="recent">Recently Played</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        {sortedSongs.length > 0 ? (
          <div className="space-y-2">
            {sortedSongs.map((song, index) => (
              <SongCard
                key={`${song.id}-${index}`}
                song={song}
                index={index}
                showIndex={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No listening history</h3>
            <p className="text-gray-500">
              Start playing some music to see your recently played songs here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyPlayed;