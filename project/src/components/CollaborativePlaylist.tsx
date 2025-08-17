import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Crown, Share2, Settings } from 'lucide-react';
import { Playlist, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CollaborativePlaylistProps {
  playlist: Playlist;
}

interface Collaborator extends User {
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

const CollaborativePlaylist: React.FC<CollaborativePlaylistProps> = ({ playlist }) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  useEffect(() => {
    loadCollaborators();
  }, [playlist.id]);

  const loadCollaborators = () => {
    // Mock collaborators data
    setCollaborators([
      {
        id: playlist.userId,
        email: 'owner@example.com',
        username: 'PlaylistOwner',
        createdAt: new Date(),
        role: 'owner',
        joinedAt: new Date(playlist.createdAt)
      },
      {
        id: '2',
        email: 'editor@example.com',
        username: 'MusicEditor',
        createdAt: new Date(),
        role: 'editor',
        joinedAt: new Date()
      },
      {
        id: '3',
        email: 'viewer@example.com',
        username: 'MusicFan',
        createdAt: new Date(),
        role: 'viewer',
        joinedAt: new Date()
      }
    ]);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      // Simulate invite process
      setPendingInvites(prev => [...prev, inviteEmail]);
      setInviteEmail('');
      setShowInvite(false);
      
      // In real implementation, send email invitation
      console.log('Invitation sent to:', inviteEmail);
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  };

  const updateCollaboratorRole = (collaboratorId: string, newRole: 'editor' | 'viewer') => {
    setCollaborators(prev => 
      prev.map(collab => 
        collab.id === collaboratorId 
          ? { ...collab, role: newRole }
          : collab
      )
    );
  };

  const removeCollaborator = (collaboratorId: string) => {
    if (confirm('Remove this collaborator from the playlist?')) {
      setCollaborators(prev => prev.filter(collab => collab.id !== collaboratorId));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'editor': return <Settings className="w-4 h-4 text-green-400" />;
      case 'viewer': return <Users className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };


  const canEdit = user?.id === playlist.userId || collaborators.find(c => c.id === user?.id)?.role === 'editor';

  return (
    <div className="space-y-6">
      {/* Collaboration Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Collaborative Playlist</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigator.share?.({ 
                title: playlist.name, 
                url: window.location.href 
              })}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            {canEdit && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-300 text-sm">
          {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} • 
          Anyone with access can add and remove songs
        </p>
      </div>

      {/* Collaborators List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Collaborators</h3>
        
        <div className="space-y-3">
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {collaborator.avatar ? (
                    <img src={collaborator.avatar} alt={collaborator.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-semibold">
                      {collaborator.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{collaborator.username}</span>
                    {getRoleIcon(collaborator.role)}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {collaborator.role} • Joined {collaborator.joinedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {user?.id === playlist.userId && collaborator.role !== 'owner' && (
                <div className="flex items-center space-x-2">
                  <select
                    value={collaborator.role}
                    onChange={(e) => updateCollaboratorRole(collaborator.id, e.target.value as any)}
                    className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => removeCollaborator(collaborator.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-white font-medium mb-2">Pending Invites</h4>
            <div className="space-y-2">
              {pendingInvites.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <span className="text-yellow-300 text-sm">{email}</span>
                  <span className="text-yellow-400 text-xs">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Invite Collaborator</h3>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativePlaylist;