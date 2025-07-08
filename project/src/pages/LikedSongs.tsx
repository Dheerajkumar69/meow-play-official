import React, { useState, useMemo } from 'react';
import { Heart, Play, Filter, Music } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';

const LikedSongs: React.FC = () => {
  const [sortBy, setSortBy] = useState('recent');
  const { songs, setQueue, play } = useMusic();

  // Mock liked songs - in a real app, this would come from user preferences
  const likedSongs = useMemo(() => {
    return songs.filter(song => song.liked).sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });
  }, [songs, sortBy]);

  const handlePlayAll = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      play(likedSongs[0]);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Liked Songs</h1>
            <p className="text-gray-400">{likedSongs.length} songs you've liked</p>
          </div>
        </div>
        {likedSongs.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Play All</span>
          </button>
        )}
      </div>

      {likedSongs.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="recent">Recently Liked</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
        {likedSongs.length > 0 ? (
          <div className="space-y-2">
            {likedSongs.map((song, index) => (
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
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No liked songs yet</h3>
            <p className="text-gray-500">
              Start liking songs to build your collection!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;