import { supabase } from './supabase';
import { User } from '../types';

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: User;
  following?: User;
}

export interface ActivityFeedItem {
  id: string;
  user_id: string;
  activity_type: 'song_play' | 'song_like' | 'song_upload' | 'playlist_create' | 'user_follow';
  activity_data: Record<string, any>;
  created_at: string;
  user?: User;
}

export class SocialService {
  // User Following System
  static async followUser(followingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: followingId
      });

    if (error) throw error;

    // Add activity to feed
    await this.addActivityToFeed(user.id, 'user_follow', {
      following_id: followingId
    });
  }

  static async unfollowUser(followingId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId);

    if (error) throw error;
  }

  static async getFollowers(userId: string): Promise<UserFollow[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        *,
        follower:users!follower_id(*)
      `)
      .eq('following_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async getFollowing(userId: string): Promise<UserFollow[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        *,
        following:users!following_id(*)
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data || [];
  }

  static async isFollowing(followingId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single();

    return !error && !!data;
  }

  static async getFollowStats(userId: string): Promise<{
    followers: number;
    following: number;
  }> {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact' })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId)
    ]);

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0
    };
  }

  // Activity Feed System
  static async addActivityToFeed(
    userId: string,
    activityType: ActivityFeedItem['activity_type'],
    activityData: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('activity_feed')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData
      });

    if (error) throw error;
  }

  static async getActivityFeed(userId: string, limit: number = 20): Promise<ActivityFeedItem[]> {
    // Get activities from users that the current user follows
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        user:users(*)
      `)
      .in('user_id', [
        userId, // Include own activities
        ...(await this.getFollowing(userId)).map(f => f.following_id)
      ])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getUserActivity(userId: string, limit: number = 10): Promise<ActivityFeedItem[]> {
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        user:users(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Social Discovery
  static async getSuggestedUsers(limit: number = 10): Promise<User[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get users with most followers that current user doesn't follow
    const following = await this.getFollowing(user.id);
    const followingIds = following.map(f => f.following_id);

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        followers:user_follows!following_id(count)
      `)
      .not('id', 'in', `(${[user.id, ...followingIds].join(',')})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Real-time subscriptions
  static subscribeToActivityFeed(
    userId: string,
    callback: (activity: ActivityFeedItem) => void
  ) {
    return supabase
      .channel('activity_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed'
        },
        (payload) => {
          callback(payload.new as ActivityFeedItem);
        }
      )
      .subscribe();
  }

  static subscribeToFollows(
    userId: string,
    callback: (follow: UserFollow) => void
  ) {
    return supabase
      .channel('user_follows')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `following_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as UserFollow);
        }
      )
      .subscribe();
  }
}
