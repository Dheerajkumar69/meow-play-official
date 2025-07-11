import React, { useState, useEffect } from 'react';
import { Cloud, Music, Play, Trash2, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../contexts/MusicContext';
import { songsAPI } from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

interface ServerSong {
  _id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  filePath: string;
  coverPath?: string;
  uploadedBy: string;
  createdAt: string;
  playCount: number;
  year?: number;
}

const ServerSongs: React.FC = () => {
  const [serverSongs, setServerSongs] = useState<ServerSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { addSong, playSong } = useMusic();

  const fetchServerSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      let songs;
      if (user) {
        // Get songs uploaded by the current user
        songs = await songsAPI.getSongsByUser(user.id);
      } else {
        // Get all songs if no user is logged in
        songs = await songsAPI.getAllSongs();
      }
      setServerSongs(songs);
    } catch (err) {
      console.error('Failed to fetch server songs:', err);
      setError('Failed to load songs from server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerSongs();
  }, [user]);

  const handlePlaySong = async (song: ServerSong) => {
    try {
      // Get the streaming URL for the song
      const streamUrl = songsAPI.getStreamUrl(song);
      
      // Create a local song object for the player
      const localSong = {
        id: uuidv4(),
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
        duration: song.duration,
        filePath: streamUrl,
        coverArt: song.coverPath ? `http://localhost:5000${song.coverPath}` : '/assets/default-cover.svg',
        uploadedBy: song.uploadedBy,
        createdAt: new Date(song.createdAt),
        playCount: song.playCount,
        year: song.year,
        isServerSong: true,
        serverId: song._id
      };
      
      // Add to the local songs list and play it
      addSong(localSong);
      playSong(localSong.id);
    } catch (err) {
      console.error('Failed to play song:', err);
      setError('Failed to play song. Please try again.');
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!window.confirm('Are you sure you want to delete this song from the server?')) {
      return;
    }
    
    try {
      await songsAPI.deleteSong(songId);
      // Remove the song from the list
      setServerSongs(prev => prev.filter(song => song._id !== songId));
    } catch (err) {
      console.error('Failed to delete song:', err);
      setError('Failed to delete song. Please try again.');
    }
  };

  const handleDownloadSong = async (song: ServerSong) => {
    try {
      const streamUrl = songsAPI.getStreamUrl(song);
      
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = streamUrl;
      a.download = `${song.title} - ${song.artist}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download song:', err);
      setError('Failed to download song. Please try again.');
    }
  };

  const filteredSongs = serverSongs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      (song.album && song.album.toLowerCase().includes(query)) ||
      (song.genre && song.genre.toLowerCase().includes(query))
    );
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Cloud className="w-10 h-10 text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Your Server Songs</h1>
          <span className="text-4xl">🎵</span>
        </div>
        <p className="text-gray-400">
          Access your music from anywhere with cross-device streaming
        </p>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title, artist, album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <button
          onClick={fetchServerSongs}
          className="flex items-center space-x-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading your server songs...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 text-center">
          <Cloud className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No songs match your search' : 'No songs found on server'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery 
              ? 'Try a different search term or clear your search'
              : 'Upload songs to access them from any device'}
          </p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="pb-3 pl-4">Song</th>
                  <th className="pb-3 hidden sm:table-cell">Album</th>
                  <th className="pb-3 hidden md:table-cell">Genre</th>
                  <th className="pb-3 hidden sm:table-cell">Duration</th>
                  <th className="pb-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song) => (
                  <tr 
                    key={song._id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 pl-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer"
                          onClick={() => handlePlaySong(song)}
                        >
                          {song.coverPath ? (
                            <img 
                              src={`http://localhost:5000${song.coverPath}`} 
                              alt={song.title} 
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Music className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-medium truncate max-w-[200px]">{song.title}</h4>
                          <p className="text-gray-400 text-sm truncate max-w-[200px]">{song.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell text-gray-400">
                      {song.album || '-'}
                    </td>
                    <td className="py-4 hidden md:table-cell">
                      {song.genre ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {song.genre}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-4 hidden sm:table-cell text-gray-400">
                      {formatDuration(song.duration)}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePlaySong(song)}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Play"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadSong(song)}
                          className="p-2 text-green-400 hover:text-green-300 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {user && song.uploadedBy === user.id && (
                          <button
                            onClick={() => handleDeleteSong(song)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSongs;