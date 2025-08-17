/**
 * Collaborative Music Player Component
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Users, Crown, MessageCircle, Heart, SkipForward, Settings, UserX } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { WebSocketService } from '../services/websocket';
import { playSong, setCurrentTime } from '../store/slices/musicSlice';
import { addToQueue } from '../store/slices/queueSlice';

interface Participant {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  isOnline: boolean;
  joinedAt: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'message' | 'system';
}

interface CollaborativePlayerProps {
  sessionId: string;
  onLeave: () => void;
}

export const CollaborativePlayer: React.FC<CollaborativePlayerProps> = ({
  sessionId,
  onLeave
}) => {
  const dispatch = useAppDispatch();
  const { currentSong, isPlaying, currentTime } = useAppSelector(state => state.music);
  const { currentUser } = useAppSelector(state => state.user);
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [skipVotes, setSkipVotes] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [reactions, setReactions] = useState<Array<{ emoji: string; userId: string; timestamp: number }>>([]);

  const ws = WebSocketService.getInstance();

  // Initialize WebSocket connection
  useEffect(() => {
    if (currentUser) {
      ws.connect(currentUser.id).then(() => {
        ws.joinSession(sessionId);
      });

      // Set up event listeners
      ws.on('userJoined', handleUserJoined);
      ws.on('userLeft', handleUserLeft);
      ws.on('songChanged', handleSongChanged);
      ws.on('playbackSync', handlePlaybackSync);
      ws.on('queueUpdated', handleQueueUpdated);
      ws.on('chatMessage', handleChatMessage);
      ws.on('reaction', handleReaction);
      ws.on('voteSkip', handleVoteSkip);
      ws.on('participantsList', handleParticipantsList);
      ws.on('hostTransferred', handleHostTransferred);
      ws.on('sessionUpdated', handleSessionUpdated);

      return () => {
        ws.removeAllListeners();
        ws.leaveSession(sessionId);
      };
    }
  }, [currentUser, sessionId]);

  // Sync playback state
  useEffect(() => {
    if (isHost && currentSong && isPlaying) {
      ws.syncPlayback({
        songId: currentSong.id,
        currentTime,
        isPlaying,
        timestamp: Date.now()
      });
    }
  }, [currentSong, isPlaying, currentTime, isHost]);

  const handleUserJoined = useCallback((data: { user: Participant }) => {
    setParticipants(prev => [...prev, data.user]);
    setTotalParticipants(prev => prev + 1);
    
    setChatMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${data.user.username} joined the session`,
      timestamp: Date.now(),
      type: 'system'
    }]);
  }, []);

  const handleUserLeft = useCallback((data: { userId: string; username: string }) => {
    setParticipants(prev => prev.filter(p => p.id !== data.userId));
    setTotalParticipants(prev => prev - 1);
    
    setChatMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${data.username} left the session`,
      timestamp: Date.now(),
      type: 'system'
    }]);
  }, []);

  const handleSongChanged = useCallback((data: { song: any; startTime: number }) => {
    dispatch(playSong(data.song));
    dispatch(setCurrentTime(data.startTime));
  }, [dispatch]);

  const handlePlaybackSync = useCallback((data: { 
    songId: string; 
    currentTime: number; 
    isPlaying: boolean; 
    timestamp: number;
  }) => {
    if (!isHost) {
      // Calculate time drift and adjust
      const networkDelay = (Date.now() - data.timestamp) / 1000;
      const adjustedTime = data.currentTime + (data.isPlaying ? networkDelay : 0);
      
      dispatch(setCurrentTime(adjustedTime));
      
      if (data.isPlaying !== isPlaying) {
        // Sync play/pause state
        if (data.isPlaying) {
          // dispatch(resumeSong());
        } else {
          // dispatch(pauseSong());
        }
      }
    }
  }, [isHost, isPlaying, dispatch]);

  const handleQueueUpdated = useCallback((data: { queue: any[] }) => {
    // Update local queue to match collaborative queue
    data.queue.forEach(song => {
      dispatch(addToQueue({ song, position: 'end' }));
    });
  }, [dispatch]);

  const handleChatMessage = useCallback((data: ChatMessage) => {
    setChatMessages(prev => [...prev, data].slice(-100)); // Keep last 100 messages
  }, []);

  const handleReaction = useCallback((data: { emoji: string; userId: string; username: string }) => {
    setReactions(prev => [...prev, {
      emoji: data.emoji,
      userId: data.userId,
      timestamp: Date.now()
    }].slice(-10)); // Keep last 10 reactions
    
    // Remove reaction after 3 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.timestamp > Date.now() - 3000));
    }, 3000);
  }, []);

  const handleVoteSkip = useCallback((data: { votes: number; total: number; hasVoted: string[] }) => {
    setSkipVotes(data.votes);
    setTotalParticipants(data.total);
    setHasVoted(data.hasVoted.includes(currentUser?.id || ''));
  }, [currentUser]);

  const handleParticipantsList = useCallback((data: { participants: Participant[] }) => {
    setParticipants(data.participants);
    setTotalParticipants(data.participants.length);
    setIsHost(data.participants.find(p => p.id === currentUser?.id)?.isHost || false);
  }, [currentUser]);

  const handleHostTransferred = useCallback((data: { newHostId: string; newHostName: string }) => {
    setIsHost(data.newHostId === currentUser?.id);
    
    setChatMessages(prev => [...prev, {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'System',
      message: `${data.newHostName} is now the host`,
      timestamp: Date.now(),
      type: 'system'
    }]);
  }, [currentUser]);

  const handleSessionUpdated = useCallback((data: any) => {
    // Handle session settings updates
    console.log('Session updated:', data);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (chatInput.trim() && currentUser) {
      ws.sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  }, [chatInput, currentUser]);

  const sendReaction = useCallback((emoji: string) => {
    ws.sendReaction(emoji);
  }, []);

  const voteToSkip = useCallback(() => {
    if (!hasVoted) {
      ws.voteSkip();
      setHasVoted(true);
    }
  }, [hasVoted]);

  const transferHost = useCallback((newHostId: string) => {
    if (isHost) {
      ws.transferHost(newHostId);
    }
  }, [isHost]);

  const kickUser = useCallback((userId: string) => {
    if (isHost) {
      ws.kickUser(userId);
    }
  }, [isHost]);

  return (
    <div className="collaborative-player bg-gray-900 text-white p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-purple-400" />
          <span className="font-semibold">Collaborative Session</span>
          {isHost && <Crown className="w-4 h-4 text-yellow-400" />}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            <Users className="w-4 h-4" />
            <span>{totalParticipants}</span>
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-700 rounded-full hover:bg-gray-600"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          
          <button
            onClick={onLeave}
            className="px-3 py-1 bg-red-600 rounded-full hover:bg-red-700"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Current Song Info */}
      {currentSong && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={currentSong.coverArt || '/default-cover.jpg'}
              alt={currentSong.title}
              className="w-16 h-16 rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{currentSong.title}</h3>
              <p className="text-gray-400">{currentSong.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reactions Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {reactions.map((reaction, index) => (
          <div
            key={`${reaction.timestamp}-${index}`}
            className="absolute animate-bounce text-4xl"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDuration: '3s',
              animationFillMode: 'forwards'
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Quick Reactions */}
      <div className="flex justify-center space-x-2 mb-4">
        {['❤️', '🔥', '👍', '🎵', '🕺', '🎉'].map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-2xl hover:scale-110 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Skip Vote */}
      {currentSong && totalParticipants > 1 && (
        <div className="bg-gray-800 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Skip votes: {skipVotes}/{Math.ceil(totalParticipants / 2)}
            </span>
            <button
              onClick={voteToSkip}
              disabled={hasVoted}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                hasVoted 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <SkipForward className="w-4 h-4" />
              <span>{hasVoted ? 'Voted' : 'Skip'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants Panel */}
      {showParticipants && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-3">Participants ({totalParticipants})</h4>
          <div className="space-y-2">
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={participant.avatar || '/default-avatar.jpg'}
                    alt={participant.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{participant.username}</span>
                  {participant.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                  <div className={`w-2 h-2 rounded-full ${
                    participant.isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                </div>
                
                {isHost && participant.id !== currentUser?.id && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => transferHost(participant.id)}
                      className="p-1 text-yellow-400 hover:bg-gray-700 rounded"
                      title="Transfer host"
                    >
                      <Crown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => kickUser(participant.id)}
                      className="p-1 text-red-400 hover:bg-gray-700 rounded"
                      title="Kick user"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Chat</h4>
          
          <div className="h-48 overflow-y-auto mb-3 space-y-2">
            {chatMessages.map(message => (
              <div key={message.id} className={`text-sm ${
                message.type === 'system' ? 'text-gray-400 italic' : 'text-white'
              }`}>
                {message.type === 'message' && (
                  <span className="font-medium text-purple-400">
                    {message.username}:{' '}
                  </span>
                )}
                {message.message}
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={sendChatMessage}
              className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativePlayer;
