import React from 'react';
import { Play, TrendingUp, Music, Users, Sparkles, ArrowRight } from 'lucide-react';
import SongCard from '../components/SongCard';
import ActivityFeed from '../components/ActivityFeed';
import MoodPlaylists from '../components/MoodPlaylists';
import { mockPlaylists } from '../utils/mockData';
import { Link } from 'react-router-dom';
import { useMusic } from '../contexts/MusicContext';

const Home: React.FC = () => {
  const { songs, setQueue, play } = useMusic();

  const recentSongs = songs.slice(0, 5);
  const popularSongs = songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 5);

  // Suggested artists based on user's library
  const suggestedArtists = React.useMemo(() => {
    const artistCount: Record<string, { count: number; songs: typeof songs }> = {};
    
    songs.forEach(song => {
      if (!artistCount[song.artist]) {
        artistCount[song.artist] = { count: 0, songs: [] };
      }
      artistCount[song.artist].count += (song.playCount || 0) + 1;
      artistCount[song.artist].songs.push(song);
    });

    return Object.entries(artistCount)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6)
      .map(([artist, data]) => ({
        name: artist,
        songCount: data.songs.length,
        totalPlays: data.count,
        coverArt: data.songs[0]?.coverArt,
        topSong: data.songs.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0]
      }));
  }, [songs]);

  const handlePlayAll = (songList: typeof songs) => {
    if (songList.length > 0) {
      setQueue(songList);
      play(songList[0]);
    }
  };

  const handlePlayArtist = (artistName: string) => {
    const artistSongs = songs.filter(song => song.artist === artistName);
    if (artistSongs.length > 0) {
      setQueue(artistSongs);
      play(artistSongs[0]);
    }
  };
  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <span className="text-4xl">🐱</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Welcome to Meow-Play
          </h1>
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-gray-400">
          Your purr-fect music streaming companion
        </p>
      </div>

      {/* Mood Playlists */}
      <MoodPlaylists />

      {/* Suggested Playlists */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Made for You</h2>
            <span className="text-2xl">🐱</span>
          </div>
          <Link
            to="/library?tab=suggestions"
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span className="text-sm">See all</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPlaylists.map((playlist) => (
            <Link
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-all"
            >
              <div className="relative mb-4">
                {playlist.coverArt ? (
                  <img
                    src={playlist.coverArt}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Music className="w-12 h-12 text-white" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handlePlayAll(playlist.songs);
                  }}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-5 h-5 text-black ml-0.5" />
                </button>
              </div>
              <h3 className="text-white font-semibold truncate mb-1">{playlist.name}</h3>
              <p className="text-gray-400 text-sm truncate">{playlist.description}</p>
              <p className="text-gray-500 text-xs mt-1">{playlist.songs.length} songs</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Suggested Artists */}
      {suggestedArtists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Your Top Artists</h2>
              <span className="text-2xl">🎤</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {suggestedArtists.map((artist) => (
              <div
                key={artist.name}
                className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => handlePlayArtist(artist.name)}
              >
                <div className="relative mb-3">
                  {artist.coverArt ? (
                    <img
                      src={artist.coverArt}
                      alt={artist.name}
                      className="w-full aspect-square object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl">🎤</span>
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105">
                    <Play className="w-4 h-4 text-black ml-0.5" />
                  </button>
                </div>
                <h3 className="text-white font-semibold text-sm truncate text-center">{artist.name}</h3>
                <p className="text-gray-400 text-xs text-center mt-1">
                  {artist.songCount} song{artist.songCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {/* Recently Added */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Recently Added</h2>
              <button
                onClick={() => handlePlayAll(recentSongs)}
                disabled={recentSongs.length === 0}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Play All</span>
              </button>
            </div>
            
            {recentSongs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {recentSongs.map((song) => (
                  <div key={song.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 hover:bg-white/10 transition-all group">
                    <div className="relative mb-3 sm:mb-4">
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
                          <Music className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                        </div>
                      )}
                      <button
                        onClick={() => play(song)}
                        className="absolute bottom-2 right-2 w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                        aria-label={`Play ${song.title}`}
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                      </button>
                    </div>
                    <h3 className="text-white font-semibold truncate text-sm sm:text-base">{song.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{song.artist}</p>
                    {song.averageRating && (
                      <div className="flex items-center space-x-1 mt-2">
                        <span className="text-yellow-400 text-xs sm:text-sm">★</span>
                        <span className="text-gray-400 text-xs sm:text-sm">{song.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 sm:p-12 text-center">
                <Music className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No songs yet</h3>
                <p className="text-gray-500 text-sm sm:text-base">Start by uploading some music!</p>
              </div>
            )}
          </section>

          {/* Popular Songs */}
          {popularSongs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Now</h2>
                </div>
                <button
                  onClick={() => handlePlayAll(popularSongs)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all text-sm sm:text-base"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Play All</span>
                </button>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                <div className="space-y-2">
                  {popularSongs.map((song, index) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={index}
                      showIndex={true}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Home;