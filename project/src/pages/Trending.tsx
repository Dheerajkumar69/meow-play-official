import React, { useMemo } from 'react';
import { TrendingUp, Play, Siren as Fire, Music } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';

const Trending: React.FC = () => {
  const { songs, setQueue, play } = useMusic();

  const trendingSongs = useMemo(() => {
    return [...songs]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 20);
  }, [songs]);

  const topGenres = useMemo(() => {
    const genreCount = songs.reduce((acc, song) => {
      if (song.genre) {
        acc[song.genre] = (acc[song.genre] || 0) + (song.playCount || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, plays]) => ({ genre, plays }));
  }, [songs]);

  const handlePlayAll = () => {
    if (trendingSongs.length > 0) {
      setQueue(trendingSongs);
      play(trendingSongs[0]);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Trending Now</h1>
            <p className="text-gray-400">Most popular songs right now</p>
          </div>
        </div>
        {trendingSongs.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Play All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main trending list */}
        <div className="xl:col-span-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Fire className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-semibold text-white">Top Tracks</h2>
            </div>
            
            {trendingSongs.length > 0 ? (
              <div className="space-y-2">
                {trendingSongs.map((song, index) => (
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
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No trending songs</h3>
                <p className="text-gray-500">Check back later for trending music!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with trending genres */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Trending Genres</h3>
            </div>
            
            {topGenres.length > 0 ? (
              <div className="space-y-3">
                {topGenres.map((item, index) => (
                  <div key={item.genre} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{item.genre}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{item.plays.toLocaleString()} plays</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No genre data available</p>
            )}
          </div>

          {/* Trending stats */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Songs</span>
                <span className="text-white font-semibold">{songs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Plays</span>
                <span className="text-white font-semibold">
                  {songs.reduce((acc, song) => acc + (song.playCount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Top Song</span>
                <span className="text-white font-semibold text-sm truncate max-w-24">
                  {trendingSongs[0]?.title || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trending;