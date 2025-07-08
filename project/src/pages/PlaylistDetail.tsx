import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock, Music, ArrowLeft, Shuffle } from 'lucide-react';
import SongCard from '../components/SongCard';
import { useMusic } from '../contexts/MusicContext';
import { mockPlaylists } from '../utils/mockData';
import { playlistGenerator } from '../utils/playlistGenerator';
import { Playlist } from '../types';

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { songs, setQueue, play } = useMusic();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Check for mock playlists first
    const mockPlaylist = mockPlaylists.find(p => p.id === id);
    if (mockPlaylist) {
      setPlaylist(mockPlaylist);
      return;
    }

    // Check for weekend special
    if (id === 'weekend_special') {
      const habits = playlistGenerator.getListeningHabits();
      if (habits && songs.length > 0) {
        const weekendSpecial = playlistGenerator.generateWeekendSpecial(songs, habits);
        setPlaylist(weekendSpecial);
      }
      return;
    }

    // If no playlist found, redirect to 404
    navigate('/404');
  }, [id, songs, navigate]);

  const totalDuration = useMemo(() => {
    if (!playlist) return 0;
    return playlist.songs.reduce((total, song) => total + song.duration, 0);
  }, [playlist]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      setQueue(playlist.songs);
      play(playlist.songs[0]);
    }
  };

  const handleShuffle = () => {
    if (playlist && playlist.songs.length > 0) {
      const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      play(shuffled[0]);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement actual like functionality
  };

  if (!playlist) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="bg-gradient-to-b from-purple-600/80 to-transparent p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-end space-x-6">
            {/* Playlist Cover */}
            <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
              {playlist.coverArt ? (
                <img
                  src={playlist.coverArt}
                  alt={playlist.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-white text-6xl">
                  {playlist.id === 'weekend_special' ? '🐱' : '🎵'}
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="flex-1 text-white">
              <p className="text-sm font-medium mb-2 opacity-80">
                {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
              </p>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-lg opacity-80 mb-4 max-w-2xl">{playlist.description}</p>
              )}
              <div className="flex items-center space-x-2 text-sm opacity-80">
                <span className="font-medium">Meow-Play</span>
                <span>•</span>
                <span>{playlist.songs.length} songs</span>
                <span>•</span>
                <span>{formatDuration(totalDuration)}</span>
                {playlist.followers && (
                  <>
                    <span>•</span>
                    <span>{playlist.followers.toLocaleString()} followers</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayAll}
            disabled={playlist.songs.length === 0}
            className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6 text-black ml-1" />
          </button>
          
          <button
            onClick={handleShuffle}
            disabled={playlist.songs.length === 0}
            className="w-12 h-12 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Shuffle play"
          >
            <Shuffle className="w-6 h-6" />
          </button>

          <button
            onClick={toggleLike}
            className={`w-12 h-12 transition-colors ${
              isLiked ? 'text-green-400' : 'text-gray-400 hover:text-white'
            }`}
            title={isLiked ? 'Remove from library' : 'Add to library'}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button className="w-12 h-12 text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Songs List */}
      <div className="px-8 pb-8">
        {playlist.songs.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-gray-400 text-sm font-medium border-b border-white/10 mb-4">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-3 hidden md:block">Album</div>
              <div className="col-span-2 hidden lg:block">Date added</div>
              <div className="col-span-1 text-right">
                <Clock className="w-4 h-4 ml-auto" />
              </div>
            </div>

            {/* Songs */}
            <div className="space-y-1">
              {playlist.songs.map((song, index) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={index}
                  showIndex={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-12 text-center">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No songs in this playlist</h3>
            <p className="text-gray-500">Add some songs to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;