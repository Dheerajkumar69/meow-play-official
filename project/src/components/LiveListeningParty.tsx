import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Users, Volume2, MessageCircle, Share2, Crown, Music } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Song } from '../types';

interface ListeningParty {
  id: string;
  name: string;
  host_id: string;
  current_song_id?: string;
  current_position: number;
  is_playing: boolean;
  created_at: string;
  participants: string[];
  host?: {
    username: string;
    avatar_url?: string;
  };
  current_song?: Song;
}

interface PartyMessage {
  id: string;
  party_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

const LiveListeningParty: React.FC = () => {
  const [parties, setParties] = useState<ListeningParty[]>([]);
  const [currentParty, setCurrentParty] = useState<ListeningParty | null>(null);
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    if (currentParty) {
      loadMessages(currentParty.id);
      subscribeToParty(currentParty.id);
    }
  }, [currentParty]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadParties = async () => {
    try {
      const { data, error } = await supabase
        .from('listening_parties')
        .select(`
          *,
          host:users!host_id(username, avatar_url),
          current_song:songs(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadMessages = async (partyId: string) => {
    try {
      const { data, error } = await supabase
        .from('party_messages')
        .select(`
          *,
          user:users(username, avatar_url)
        `)
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToParty = (partyId: string) => {
    // Subscribe to party updates
    const partyChannel = supabase
      .channel(`party-${partyId}`)
      .on('broadcast', { event: 'song-change' }, (payload) => {
        syncPlayback(payload.song, payload.position, payload.isPlaying);
      })
      .on('broadcast', { event: 'play-pause' }, (payload) => {
        if (audioRef.current) {
          if (payload.isPlaying) {
            audioRef.current.currentTime = payload.position;
            audioRef.current.play();
          } else {
            audioRef.current.pause();
          }
        }
      })
      .subscribe();

    // Subscribe to messages
    const messageChannel = supabase
      .channel(`messages-${partyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'party_messages',
          filter: `party_id=eq.${partyId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as PartyMessage]);
        }
      )
      .subscribe();

    return () => {
      partyChannel.unsubscribe();
      messageChannel.unsubscribe();
    };
  };

  const syncPlayback = (song: Song, position: number, isPlaying: boolean) => {
    if (audioRef.current && song) {
      audioRef.current.src = song.file_url;
      audioRef.current.currentTime = position;
      
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const createParty = async () => {
    if (!user || !newPartyName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('listening_parties')
        .insert({
          name: newPartyName,
          host_id: user.id,
          participants: [user.id]
        })
        .select()
        .single();

      if (error) throw error;

      setNewPartyName('');
      setIsCreating(false);
      loadParties();
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  const joinParty = async (party: ListeningParty) => {
    if (!user) return;

    try {
      // Add user to participants
      const updatedParticipants = [...party.participants, user.id];
      
      const { error } = await supabase
        .from('listening_parties')
        .update({ participants: updatedParticipants })
        .eq('id', party.id);

      if (error) throw error;

      setCurrentParty({ ...party, participants: updatedParticipants });
    } catch (error) {
      console.error('Error joining party:', error);
    }
  };

  const leaveParty = async () => {
    if (!user || !currentParty) return;

    try {
      const updatedParticipants = currentParty.participants.filter(id => id !== user.id);
      
      const { error } = await supabase
        .from('listening_parties')
        .update({ participants: updatedParticipants })
        .eq('id', currentParty.id);

      if (error) throw error;

      setCurrentParty(null);
      setMessages([]);
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !currentParty || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('party_messages')
        .insert({
          party_id: currentParty.id,
          user_id: user.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const broadcastSongChange = async (song: Song) => {
    if (!currentParty || currentParty.host_id !== user?.id) return;

    const channel = supabase.channel(`party-${currentParty.id}`);
    await channel.send({
      type: 'broadcast',
      event: 'song-change',
      payload: {
        song,
        position: 0,
        isPlaying: true
      }
    });
  };

  if (!currentParty) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Live Listening Parties
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Create Party
          </button>
        </div>

        {isCreating && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Create New Party</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                placeholder="Party name..."
                className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={createParty}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {parties.length === 0 ? (
            <div className="text-center py-8">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No active parties</p>
              <p className="text-gray-500 text-sm">Create a party to listen to music with friends</p>
            </div>
          ) : (
            parties.map((party) => (
              <div
                key={party.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold flex items-center">
                      <Crown className="w-4 h-4 text-yellow-400 mr-2" />
                      {party.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Hosted by {party.host?.username}
                    </p>
                  </div>
                  <button
                    onClick={() => joinParty(party)}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
                  >
                    Join
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{party.participants.length} participants</span>
                  {party.current_song && (
                    <span className="flex items-center">
                      <Music className="w-3 h-3 mr-1" />
                      {party.current_song.title}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Crown className="w-5 h-5 text-yellow-400 mr-2" />
          {currentParty.name}
        </h2>
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm">
            {currentParty.participants.length} listening
          </span>
          <button
            onClick={leaveParty}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Now Playing */}
        <div className="lg:col-span-2 bg-gray-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <Music className="w-4 h-4 mr-2" />
            Now Playing
          </h3>
          
          {currentParty.current_song ? (
            <div className="flex items-center space-x-4">
              <img
                src={currentParty.current_song.cover_url || '/default-cover.jpg'}
                alt={currentParty.current_song.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="text-white font-medium">{currentParty.current_song.title}</h4>
                <p className="text-gray-400 text-sm">{currentParty.current_song.artist}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {currentParty.is_playing ? (
                    <Pause className="w-4 h-4 text-green-400" />
                  ) : (
                    <Play className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-xs text-gray-500">
                    {currentParty.is_playing ? 'Playing' : 'Paused'}
                  </span>
                </div>
              </div>
              <Volume2 className="w-5 h-5 text-gray-400" />
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">No song playing</p>
            </div>
          )}

          <audio ref={audioRef} />
        </div>

        {/* Chat */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </h3>
          
          <div className="h-64 overflow-y-auto mb-4 space-y-2">
            {messages.map((message) => (
              <div key={message.id} className="text-sm">
                <span className="text-purple-400 font-medium">
                  {message.user?.username}:
                </span>
                <span className="text-gray-300 ml-2">{message.message}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={sendMessage}
              className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveListeningParty;
