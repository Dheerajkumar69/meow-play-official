import React from 'react';
import { Activity as ActivityIcon, Heart, Music, Users, Upload } from 'lucide-react';
import { Activity } from '../types';
import { mockActivities } from '../utils/mockData';

const ActivityFeed: React.FC = () => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'play':
        return <Music className="w-4 h-4 text-green-400" />;
      case 'playlist_create':
        return <Music className="w-4 h-4 text-blue-400" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-purple-400" />;
      case 'follow':
        return <Users className="w-4 h-4 text-yellow-400" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <ActivityIcon className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
      </div>

      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              {activity.avatar ? (
                <img src={activity.avatar} alt={activity.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {activity.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getActivityIcon(activity.type)}
                <span className="text-white font-medium">{activity.username}</span>
                <span className="text-gray-400">{activity.content}</span>
              </div>
              <span className="text-gray-500 text-sm">{formatTimeAgo(activity.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 py-2 text-purple-400 hover:text-purple-300 transition-colors text-sm">
        View all activity
      </button>
    </div>
  );
};

export default ActivityFeed;