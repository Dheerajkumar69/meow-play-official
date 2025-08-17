/**
 * Admin Moderation Dashboard for Community Content
 */
import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, XCircle, Flag, User, Music, MessageSquare, Search, Filter } from 'lucide-react';
import { CommunityApiService, CommunityMusic } from '../services/communityApi';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface ModerationItem {
  id: string;
  type: 'music' | 'playlist' | 'comment' | 'report';
  content: any;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reported_by?: string;
  reason?: string;
  description?: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

interface AdminModerationProps {
  className?: string;
}

export const AdminModeration: React.FC<AdminModerationProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector(state => state.user);
  
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'reports' | 'flagged' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'music' | 'playlist' | 'comment'>('all');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  const communityApi = CommunityApiService.getInstance();

  // Check if user is admin
  const isAdmin = currentUser?.email?.includes('admin') || currentUser?.id === 'admin'; // Simplified check

  useEffect(() => {
    if (isAdmin) {
      loadModerationQueue();
    }
  }, [selectedTab, isAdmin]);

  const loadModerationQueue = async () => {
    try {
      setLoading(true);
      // This would be implemented in the API service
      // const items = await communityApi.getModerationQueue(selectedTab);
      
      // Mock data for demonstration
      const mockItems: ModerationItem[] = [
        {
          id: '1',
          type: 'music',
          content: {
            id: 'music-1',
            title: 'New Song Upload',
            artist: 'Unknown Artist',
            genre: 'Pop',
            uploaded_by: 'user-123',
            file_url: '/uploads/song1.mp3'
          },
          status: 'pending',
          created_at: new Date().toISOString(),
          priority: 'medium'
        },
        {
          id: '2',
          type: 'music',
          content: {
            id: 'music-2',
            title: 'Reported Song',
            artist: 'Controversial Artist',
            genre: 'Rock'
          },
          status: 'flagged',
          reported_by: 'user-456',
          reason: 'copyright',
          description: 'This song appears to be copyrighted material',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          priority: 'high'
        }
      ];
      
      setModerationQueue(mockItems);
    } catch (error) {
      console.error('Failed to load moderation queue:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to load moderation queue'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ModerationItem) => {
    try {
      // await communityApi.moderateContent(item.id, 'approved');
      
      setModerationQueue(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'approved' } : i)
      );
      
      dispatch(addToast({
        type: 'success',
        message: 'Content approved successfully'
      }));
    } catch (error) {
      console.error('Failed to approve content:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to approve content'
      }));
    }
  };

  const handleReject = async (item: ModerationItem, reason?: string) => {
    try {
      // await communityApi.moderateContent(item.id, 'rejected', reason);
      
      setModerationQueue(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'rejected' } : i)
      );
      
      dispatch(addToast({
        type: 'success',
        message: 'Content rejected successfully'
      }));
    } catch (error) {
      console.error('Failed to reject content:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to reject content'
      }));
    }
  };

  const handleFlag = async (item: ModerationItem) => {
    try {
      // await communityApi.flagContent(item.id);
      
      setModerationQueue(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'flagged' } : i)
      );
      
      dispatch(addToast({
        type: 'success',
        message: 'Content flagged for review'
      }));
    } catch (error) {
      console.error('Failed to flag content:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to flag content'
      }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'approved': return 'text-green-400 bg-green-900/20';
      case 'rejected': return 'text-red-400 bg-red-900/20';
      case 'flagged': return 'text-orange-400 bg-orange-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const filteredItems = moderationQueue.filter(item => {
    const matchesSearch = !searchQuery || 
      item.content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.artist?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || item.type === filterType;
    
    const matchesTab = selectedTab === 'pending' ? item.status === 'pending' :
                      selectedTab === 'reports' ? item.reported_by :
                      selectedTab === 'flagged' ? item.status === 'flagged' :
                      true; // history shows all
    
    return matchesSearch && matchesType && matchesTab;
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to access the moderation dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-moderation ${className || ''}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-purple-400" />
          Admin Moderation
        </h1>
        <p className="text-gray-400">Review and moderate community content</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'pending', label: 'Pending Review', icon: Eye },
          { id: 'reports', label: 'Reports', icon: Flag },
          { id: 'flagged', label: 'Flagged', icon: XCircle },
          { id: 'history', label: 'History', icon: CheckCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              selectedTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Types</option>
          <option value="music">Music</option>
          <option value="playlist">Playlists</option>
          <option value="comment">Comments</option>
        </select>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div key={item.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    {item.type === 'music' && <Music className="w-6 h-6 text-purple-400" />}
                    {item.type === 'playlist' && <Music className="w-6 h-6 text-blue-400" />}
                    {item.type === 'comment' && <MessageSquare className="w-6 h-6 text-green-400" />}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white truncate">
                        {item.content.title || item.content.name || 'Untitled'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">
                      {item.type === 'music' && `${item.content.artist} • ${item.content.genre}`}
                      {item.type === 'playlist' && `${item.content.song_count || 0} songs`}
                      {item.type === 'comment' && item.content.content}
                    </p>

                    {item.reported_by && (
                      <div className="bg-red-900/20 border border-red-600/30 rounded p-2 mb-2">
                        <p className="text-red-400 text-sm font-medium">
                          Reported for: {item.reason}
                        </p>
                        {item.description && (
                          <p className="text-red-300 text-sm mt-1">{item.description}</p>
                        )}
                      </div>
                    )}

                    <p className="text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(item)}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(item)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {item.status !== 'flagged' && (
                    <button
                      onClick={() => handleFlag(item)}
                      className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 rounded"
                      title="Flag"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No items found for moderation</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Content Details</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">
                    {selectedItem.content.title || selectedItem.content.name}
                  </h3>
                  <p className="text-gray-400">
                    Type: {selectedItem.type} • Status: {selectedItem.status}
                  </p>
                </div>

                {selectedItem.type === 'music' && (
                  <div className="bg-gray-800 rounded p-4">
                    <h4 className="font-medium text-white mb-2">Music Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Artist:</span>
                        <span className="text-white ml-2">{selectedItem.content.artist}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-white ml-2">{selectedItem.content.genre}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white ml-2">{selectedItem.content.duration}s</span>
                      </div>
                      <div>
                        <span className="text-gray-400">File Size:</span>
                        <span className="text-white ml-2">{selectedItem.content.file_size || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.reported_by && (
                  <div className="bg-red-900/20 border border-red-600/30 rounded p-4">
                    <h4 className="font-medium text-red-400 mb-2">Report Details</h4>
                    <p className="text-red-300 text-sm">
                      <strong>Reason:</strong> {selectedItem.reason}
                    </p>
                    {selectedItem.description && (
                      <p className="text-red-300 text-sm mt-2">
                        <strong>Description:</strong> {selectedItem.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-800"
                  >
                    Close
                  </button>
                  {selectedItem.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedItem);
                          setSelectedItem(null);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedItem);
                          setSelectedItem(null);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
