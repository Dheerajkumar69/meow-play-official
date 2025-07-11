import React, { useState } from 'react';
import { Shield, Users, Trash2, Eye, EyeOff, Database, Music, AlertTriangle, CheckSquare, Square, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { offlineAuth, MASTER_ADMIN } from '../utils/offlineAuth';
import { sharedDatabase, SharedSong } from '../utils/sharedDatabase';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(() => {
    try {
      return offlineAuth.getAllUsers();
    } catch {
      return [];
    }
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'songs'>('users');
  const [sharedSongs, setSharedSongs] = useState<SharedSong[]>(() => {
    try {
      return sharedDatabase.getAllSharedSongs();
    } catch {
      return [];
    }
  });
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Update selectAll state when selectedSongs changes
  React.useEffect(() => {
    const activeSongIds = sharedSongs
      .filter(song => song.status === 'active')
      .map(song => song.id);
    
    // Check if all active songs are selected
    const allActiveSelected = 
      activeSongIds.length > 0 && 
      activeSongIds.every(id => selectedSongs.includes(id));
    
    setSelectAll(allActiveSelected);
  }, [selectedSongs, sharedSongs]);

  if (!user?.isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-400">Access Denied</h2>
        <p className="text-gray-500">Admin privileges required</p>
      </div>
    );
  }

  const handleDeleteUser = (userId: string) => {
    if (userId === MASTER_ADMIN.id) {
      alert('Cannot delete master admin account');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      try {
        offlineAuth.deleteUser(userId);
        setUsers(offlineAuth.getAllUsers());
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleDeleteSharedSong = async (songId: string) => {
    if (confirm('Are you sure you want to remove this song from the community database?')) {
      try {
        await sharedDatabase.deleteSong(songId, user!.id);
        setSharedSongs(sharedDatabase.getAllSharedSongs());
      } catch (error) {
        alert('Failed to delete song');
      }
    }
  };

  const refreshUsers = () => {
    try {
      setUsers(offlineAuth.getAllUsers());
    } catch (error) {
      alert('Failed to refresh users');
    }
  };

  const refreshSharedSongs = () => {
    try {
      setSharedSongs(sharedDatabase.getAllSharedSongs());
      setSelectedSongs([]);
      setSelectAll(false);
    } catch (error) {
      alert('Failed to refresh songs');
    }
  };
  
  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedSongs([]);
    } else {
      const activeSongIds = sharedSongs
        .filter(song => song.status === 'active')
        .map(song => song.id);
      setSelectedSongs(activeSongIds);
    }
    setSelectAll(!selectAll);
  };
  
  const handleToggleSelectSong = (songId: string) => {
    setSelectedSongs(prev => {
      if (prev.includes(songId)) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };
  
  const handleBulkDeleteSongs = async () => {
    if (selectedSongs.length === 0) {
      alert('No songs selected');
      return;
    }
    
    if (confirm(`Are you sure you want to remove ${selectedSongs.length} song(s) from the community database?`)) {
      try {
        // Use the bulk delete method for better efficiency
        const result = await sharedDatabase.bulkDeleteSongs(selectedSongs, user!.id);
        
        // Refresh the song list
        setSharedSongs(sharedDatabase.getAllSharedSongs());
        setSelectedSongs([]);
        setSelectAll(false);
        
        if (result.failed > 0) {
          alert(`Successfully removed ${result.success} song(s). Failed to remove ${result.failed} song(s).`);
        } else {
          alert(`Successfully removed ${result.success} song(s)`);
        }
      } catch (error) {
        alert('Failed to delete songs');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'removed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage users and system settings</p>
          </div>
        </div>
        <button
          onClick={refreshUsers}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all flex-1 justify-center ${
            activeTab === 'users'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all flex-1 justify-center ${
            activeTab === 'songs'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Community Songs</span>
        </button>
      </div>

      {/* Master Admin Credentials */}
      {activeTab === 'users' && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Master Admin Credentials</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Email:</span>
              <span className="text-white font-mono ml-2">{MASTER_ADMIN.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Password:</span>
              <span className="text-white font-mono ml-2">{MASTER_ADMIN.password}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ Keep these credentials secure. Use this account for testing and administration.
            </p>
          </div>
        </div>
      )}

      {/* Community Database Stats */}
      {activeTab === 'songs' && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Community Database Overview</span>
          </h2>
          {(() => {
            const stats = sharedDatabase.getDatabaseStats();
            const activeSongs = sharedSongs.filter(s => s.status === 'active').length;
            const removedSongs = sharedSongs.filter(s => s.status === 'removed').length;
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">{activeSongs}</div>
                  <div className="text-gray-300 text-sm">Active Songs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{removedSongs}</div>
                  <div className="text-gray-300 text-sm">Removed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{stats.totalDownloads}</div>
                  <div className="text-gray-300 text-sm">Downloads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{stats.totalLikes}</div>
                  <div className="text-gray-300 text-sm">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.recentUploads}</div>
                  <div className="text-gray-300 text-sm">This Week</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <span className="text-gray-400">({users.length} users)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-gray-300 font-medium">User</th>
                  <th className="pb-3 text-gray-300 font-medium">Email</th>
                  {showPasswords && <th className="pb-3 text-gray-300 font-medium">Password</th>}
                  <th className="pb-3 text-gray-300 font-medium">Created</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          {user.isAdmin && (
                            <span className="text-xs text-purple-400">Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300 font-mono text-sm">{user.email}</td>
                    {showPasswords && (
                      <td className="py-4 text-gray-300 font-mono text-sm">
                        {user.password || 'N/A'}
                      </td>
                    )}
                    <td className="py-4 text-gray-400 text-sm">
                      {user.createdAt.toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {user.needsSync ? (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                            Needs Sync
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                            Synced
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {user.id !== MASTER_ADMIN.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Community Songs Management */}
      {activeTab === 'songs' && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Music className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Community Songs Management</h2>
              <span className="text-gray-400">({sharedSongs.length} total)</span>
            </div>
            <div className="flex items-center space-x-3">
              {selectedSongs.length > 0 && (
                <button
                  onClick={handleBulkDeleteSongs}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedSongs.length})</span>
                </button>
              )}
              <button
                onClick={refreshSharedSongs}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-gray-300 font-medium">
                    <button 
                      onClick={handleToggleSelectAll}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title={selectAll ? "Deselect all" : "Select all active songs"}
                    >
                      {selectAll ? (
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 text-gray-300 font-medium">Song</th>
                  <th className="pb-3 text-gray-300 font-medium">Uploader</th>
                  <th className="pb-3 text-gray-300 font-medium">Uploaded</th>
                  <th className="pb-3 text-gray-300 font-medium">Stats</th>
                  <th className="pb-3 text-gray-300 font-medium">Status</th>
                  <th className="pb-3 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sharedSongs.map((song) => (
                  <tr key={song.id} className="border-b border-white/5">
                    <td className="py-4">
                      {song.status === 'active' ? (
                        <button 
                          onClick={() => handleToggleSelectSong(song.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title={selectedSongs.includes(song.id) ? "Deselect" : "Select"}
                        >
                          {selectedSongs.includes(song.id) ? (
                            <CheckSquare className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-600 opacity-50" />
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center overflow-hidden">
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
                            <Music className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{song.title}</p>
                          <p className="text-gray-400 text-sm">{song.artist}</p>
                          {song.genre && (
                            <span className="text-xs text-purple-400">{song.genre}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300 text-sm">{song.uploaderUsername}</td>
                    <td className="py-4 text-gray-400 text-sm">
                      {song.uploadedAt.toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-gray-400">
                        <div>❤️ {song.likes}</div>
                        <div>⬇️ {song.downloadCount}</div>
                        <div>▶️ {song.playCount || 0}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        song.status === 'active' ? 'bg-green-500/20 text-green-300' :
                        song.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {song.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {song.status === 'active' && (
                        <button
                          onClick={() => handleDeleteSharedSong(song.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove from community database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {song.status === 'removed' && (
                        <div className="flex items-center space-x-1 text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">Removed</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sharedSongs.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No community songs</h3>
              <p className="text-gray-500">Songs uploaded by users will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;