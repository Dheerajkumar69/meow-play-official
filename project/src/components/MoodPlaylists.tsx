import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { MoodPlaylist } from '../types';
import { mockMoodPlaylists } from '../utils/mockData';
import { useMusic } from '../contexts/MusicContext';

const MoodPlaylists: React.FC = () => {
  const { setQueue, play } = useMusic();

  const handlePlayMoodPlaylist = (playlist: MoodPlaylist) => {
    setQueue(playlist.songs);
    play(playlist.songs[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Mood Playlists</h2>
        <span className="text-gray-400 text-sm">AI-curated for your vibe</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMoodPlaylists.map((playlist) => (
          <div
            key={playlist.id}
            className="group relative bg-white/5 backdrop-blur-sm rounded-lg p-6 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => handlePlayMoodPlaylist(playlist)}
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${playlist.color} rounded-lg flex items-center justify-center mb-4`}>
              <span className="text-2xl">{playlist.icon}</span>
            </div>
            
            <h3 className="text-white font-semibold mb-1">{playlist.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{playlist.description}</p>
            <p className="text-gray-500 text-xs">{playlist.songs.length} songs</p>

            <button className="absolute bottom-4 right-4 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodPlaylists;