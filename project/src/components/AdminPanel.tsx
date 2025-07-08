import React, { useState } from 'react';
import { Shield, Users, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { offlineAuth, MASTER_ADMIN } from '../utils/offlineAuth';

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

  const refreshUsers = () => {
    try {
      setUsers(offlineAuth.getAllUsers());
    } catch (error) {
      alert('Failed to refresh users');
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

      {/* Master Admin Credentials */}
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

      {/* Users Management */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            <span className="text-gray-400">({users.length} users)</span>
          </div>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
          </button>
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
    </div>
  );
};

export default AdminPanel;