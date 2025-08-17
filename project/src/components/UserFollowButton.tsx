import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { SocialService } from '../services/socialService';
import { useAuth } from '../contexts/AuthContext';

interface UserFollowButtonProps {
  userId: string;
  username?: string;
  className?: string;
}

const UserFollowButton: React.FC<UserFollowButtonProps> = ({ 
  userId, 
  username, 
  className = '' 
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (!user || userId === user.id) return;

    const checkFollowStatus = async () => {
      try {
        const [following, stats] = await Promise.all([
          SocialService.isFollowing(userId),
          SocialService.getFollowStats(userId)
        ]);
        setIsFollowing(following);
        setFollowStats(stats);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, userId]);

  const handleFollowToggle = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await SocialService.unfollowUser(userId);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await SocialService.followUser(userId);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (!user || userId === user.id) {
    return (
      <div className="flex items-center space-x-4 text-gray-400 text-sm">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{followStats.followers} followers</span>
        </div>
        <span>{followStats.following} following</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${isFollowing 
            ? 'bg-gray-600 hover:bg-red-600 text-white' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        <span className="text-sm">
          {loading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </span>
      </button>

      <div className="flex items-center space-x-4 text-gray-400 text-sm">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{followStats.followers} followers</span>
        </div>
        <span>{followStats.following} following</span>
      </div>
    </div>
  );
};

export default UserFollowButton;
