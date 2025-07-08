import React, { useState } from 'react';
import { ListMusic, X, Play, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import { Song } from '../types';

interface QueueManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueueManager: React.FC<QueueManagerProps> = ({ isOpen, onClose }) => {
  const { queue, currentIndex, currentSong, removeFromQueue, play, setQueue } = useMusic();

  const moveUp = (index: number) => {
    if (index > 0) {
      const newQueue = [...queue];
      [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const moveDown = (index: number) => {
    if (index < queue.length - 1) {
      const newQueue = [...queue];
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const clearQueue = () => {
    if (confirm('Are you sure you want to clear the queue?')) {
      setQueue([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Queue</h2>
            <span className="text-gray-400">({queue.length} songs)</span>
          </div>
          <div className="flex items-center space-x-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-6">
          {queue.length > 0 ? (
            <div className="space-y-2">
              {queue.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    index === currentIndex
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 flex items-center justify-center">
                    <span className={`text-sm ${
                      index === currentIndex ? 'text-purple-400 font-bold' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {song.coverArt ? (
                      <img 
                        src={song.coverArt} 
                        alt={song.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-white text-lg">🎵</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${
                      index === currentIndex ? 'text-purple-400' : 'text-white'
                    }`}>
                      {song.title}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === queue.length - 1}
                      className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => play(song)}
                      className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                      title="Play now"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListMusic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Queue is empty</h3>
              <p className="text-gray-500">Add songs to your queue to see them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueManager;