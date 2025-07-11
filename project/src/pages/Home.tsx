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

  const recentSongs = songs.slice(0, 12);
  const popularSongs = songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 12);

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
      .slice(0, 12)
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

  // Mood playlists data
  const moodPlaylists = [
    {
      id: 'mood-1',
      name: 'Chill Out',
      description: 'Perfect for unwinding',
      color: 'from-blue-500 to-cyan-500',
      icon: '🌊',
      songs: songs.filter(s => s.mood?.includes('chill')).slice(0, 20)
    },
    {
      id: 'mood-2',
      name: 'Energy Boost',
      description: 'High-energy tracks',
      color: 'from-orange-500 to-red-500',
      icon: '⚡',
      songs: songs.filter(s => s.mood?.includes('energetic')).slice(0, 20)
    },
    {
      id: 'mood-3',
      name: 'Focus Flow',
      description: 'Instrumental focus music',
      color: 'from-green-500 to-emerald-500',
      icon: '🎯',
      songs: songs.filter(s => s.genre === 'Ambient' || s.genre === 'Classical').slice(0, 20)
    },
    {
      id: 'mood-4',
      name: 'Happy Vibes',
      description: 'Uplifting songs',
      color: 'from-yellow-500 to-orange-500',
      icon: '😊',
      songs: songs.filter(s => s.mood?.includes('happy')).slice(0, 20)
    },
    {
      id: 'mood-5',
      name: 'Late Night',
      description: 'Perfect for evening',
      color: 'from-purple-500 to-indigo-500',
      icon: '🌙',
      songs: songs.filter(s => s.mood?.includes('dreamy')).slice(0, 20)
    },
    {
      id: 'mood-6',
      name: 'Workout',
      description: 'Pump up your exercise',
      color: 'from-red-500 to-pink-500',
      icon: '💪',
      songs: songs.filter(s => s.genre === 'Hip Hop' || s.genre === 'Electronic').slice(0, 20)
    }
  ];

  const handlePlayMoodPlaylist = (playlist: typeof moodPlaylists[0]) => {
    if (playlist.songs.length > 0) {
      setQueue(playlist.songs);
      play(playlist.songs[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="text-center mb-8">
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
      </div>

      {/* Content Sections */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-8 pb-8">
        
        {/* Mood Playlists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Made for You</h2>
            <Link
              to="/library?tab=suggestions"
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <span>Show all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {moodPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => handlePlayMoodPlaylist(playlist)}
                className="group bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer"
              >
                <div className="relative mb-4">
                  <div className={`w-full aspect-square bg-gradient-to-br ${playlist.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <span className="text-3xl">{playlist.icon}</span>
                  </div>
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 shadow-lg">
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  </button>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{playlist.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-1">{playlist.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Suggested Playlists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
            <Link
              to="/library"
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <span>Show all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mockPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="group bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300"
              >
                <div className="relative mb-4">
                  {playlist.coverArt ? (
                    <img
                      src={playlist.coverArt}
                      alt={playlist.name}
                      className="w-full aspect-square object-cover rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg" style={{ display: playlist.coverArt ? 'none' : 'flex' }}>
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handlePlayAll(playlist.songs);
                    }}
                    className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  </button>
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{playlist.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-1">{playlist.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Your Top Artists */}
        {suggestedArtists.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Top Artists</h2>
              <Link
                to="/library"
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <span>Show all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {suggestedArtists.slice(0, 12).map((artist) => (
                <div
                  key={artist.name}
                  onClick={() => handlePlayArtist(artist.name)}
                  className="group bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300 cursor-pointer"
                >
                  <div className="relative mb-4">
                    {artist.coverArt ? (
                      <img
                        src={artist.coverArt}
                        alt={artist.name}
                        className="w-full aspect-square object-cover rounded-full shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg" style={{ display: artist.coverArt ? 'none' : 'flex' }}>
                      <span className="text-2xl">🎤</span>
                    </div>
                    <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 shadow-lg">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </button>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 text-center">{artist.name}</h3>
                  <p className="text-gray-400 text-xs text-center line-clamp-1">
                    {artist.songCount} song{artist.songCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently Added</h2>
            <button
              onClick={() => handlePlayAll(recentSongs)}
              disabled={recentSongs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1db954] text-black rounded-full hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
            >
              <Play className="w-4 h-4" />
              <span>Play All</span>
            </button>
          </div>
          
          {recentSongs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recentSongs.map((song) => (
                <div key={song.id} className="group bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300">
                  <div className="relative mb-4">
                    {song.coverArt ? (
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-full aspect-square object-cover rounded-lg shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg" style={{ display: song.coverArt ? 'none' : 'flex' }}>
                      <div className="text-white text-2xl">
                        {song.uploadedBy === 'community' ? '🌍' : '🎵'}
                      </div>
                    </div>
                    <button
                      onClick={() => play(song)}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 shadow-lg"
                      aria-label={`Play ${song.title}`}
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </button>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{song.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-1">{song.artist}</p>
                  {song.averageRating && (
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-gray-400 text-xs">{song.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#181818] rounded-lg p-12 text-center">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No songs yet</h3>
              <p className="text-gray-500">Start by uploading some music!</p>
            </div>
          )}
        </section>

        {/* Popular Songs */}
        {popularSongs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-[#1db954]" />
                <h2 className="text-2xl font-bold text-white">Trending Now</h2>
              </div>
              <button
                onClick={() => handlePlayAll(popularSongs)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#1db954] text-black rounded-full hover:bg-[#1ed760] transition-all text-sm font-semibold"
              >
                <Play className="w-4 h-4" />
                <span>Play All</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {popularSongs.map((song) => (
                <div key={song.id} className="group bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-all duration-300">
                  <div className="relative mb-4">
                    {song.coverArt ? (
                      <img
                        src={song.coverArt}
                        alt={song.title}
                        className="w-full aspect-square object-cover rounded-lg shadow-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg" style={{ display: song.coverArt ? 'none' : 'flex' }}>
                      <div className="text-white text-2xl">
                        {song.uploadedBy === 'community' ? '🌍' : '🎵'}
                      </div>
                    </div>
                    <button
                      onClick={() => play(song)}
                      className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 shadow-lg"
                      aria-label={`Play ${song.title}`}
                    >
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </button>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{song.title}</h3>
                  <p className="text-gray-400 text-xs line-clamp-1">{song.artist}</p>
                  {song.playCount && (
                    <p className="text-gray-500 text-xs mt-1">{song.playCount.toLocaleString()} plays</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;