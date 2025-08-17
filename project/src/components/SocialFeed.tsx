import React, { useState, useEffect } from 'react';
import { Heart, Music, User, Clock, Play, Users, Upload } from 'lucide-react';
import { SocialService, ActivityFeedItem } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const SocialFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadFeed = async () => {
      try {
        const feed = await SocialService.getActivityFeed(user.id);
        setActivities(feed);
      } catch (error) {
        console.error('Error loading activity feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();

    // Subscribe to real-time updates
    const subscription = SocialService.subscribeToActivityFeed(user.id, (newActivity) => {
      setActivities(prev => [newActivity, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'song_play':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'song_like':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'song_upload':
        return <Upload className="w-4 h-4 text-blue-400" />;
      case 'playlist_create':
        return <Music className="w-4 h-4 text-purple-400" />;
      case 'user_follow':
        return <Users className="w-4 h-4 text-yellow-400" />;
      default:
        return <Music className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: ActivityFeedItem) => {
    const { activity_type, activity_data, user: activityUser } = activity;
    const username = activityUser?.username || 'Someone';

    switch (activity_type) {
      case 'song_play':
        return `${username} played "${activity_data.song_title}"`;
      case 'song_like':
        return `${username} liked "${activity_data.song_title}"`;
      case 'song_upload':
        return `${username} uploaded a new song "${activity_data.song_title}"`;
      case 'playlist_create':
        return `${username} created playlist "${activity_data.playlist_name}"`;
      case 'user_follow':
        return `${username} started following someone`;
      default:
        return `${username} did something`;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Activity Feed
      </h2>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No activities yet</p>
          <p className="text-gray-500 text-sm">Follow some users to see their activities here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                {activity.user?.avatar_url ? (
                  <img
                    src={activity.user.avatar_url}
                    alt={activity.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getActivityIcon(activity.activity_type)}
                  <p className="text-white text-sm">
                    {getActivityText(activity)}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Additional activity data */}
                {activity.activity_data.song_title && activity.activity_type !== 'song_play' && (
                  <div className="mt-2 p-2 bg-gray-600/50 rounded text-xs text-gray-300">
                    🎵 {activity.activity_data.song_title}
                    {activity.activity_data.artist && ` by ${activity.activity_data.artist}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
