import React, { useState, useEffect } from 'react';
import { Music, X } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

interface LyricsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ isOpen, onClose }) => {
  const { currentSong, currentTime } = useMusic();
  const [activeLine, setActiveLine] = useState(0);

  const parseLyrics = (lyrics: string) => {
    if (!lyrics) return [];
    
    return lyrics.split('\n').map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\]\s*(.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const time = minutes * 60 + seconds;
        const text = match[3];
        return { time, text };
      }
      return { time: 0, text: line };
    }).filter(line => line.text.trim());
  };

  const lyricsLines = currentSong?.lyrics ? parseLyrics(currentSong.lyrics) : [];

  useEffect(() => {
    if (lyricsLines.length > 0) {
      const currentLineIndex = lyricsLines.findIndex((line, index) => {
        const nextLine = lyricsLines[index + 1];
        return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
      });
      
      if (currentLineIndex !== -1) {
        setActiveLine(currentLineIndex);
      }
    }
  }, [currentTime, lyricsLines]);

  if (!isOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              {currentSong.coverArt ? (
                <img src={currentSong.coverArt} alt={currentSong.title} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Music className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{currentSong.title}</h2>
              <p className="text-gray-400">{currentSong.artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Lyrics */}
        <div className="flex-1 overflow-y-auto p-6">
          {lyricsLines.length > 0 ? (
            <div className="space-y-4 text-center">
              {lyricsLines.map((line, index) => (
                <p
                  key={index}
                  className={`text-lg transition-all duration-300 ${
                    index === activeLine
                      ? 'text-white font-semibold scale-105'
                      : index < activeLine
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No lyrics available</h3>
              <p className="text-gray-500">
                Lyrics for this song haven't been added yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsDisplay;