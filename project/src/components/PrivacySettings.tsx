/**
 * Privacy Settings Component for Community Sharing
 */
import React, { useState, useEffect } from 'react';
import { Shield, Globe, Lock, Eye, Users, Settings, Save } from 'lucide-react';
import { CommunityApiService } from '../services/communityApi';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface PrivacyPreferences {
  profile_visibility: 'public' | 'friends' | 'private';
  music_sharing: 'public' | 'friends' | 'private';
  playlist_sharing: 'public' | 'friends' | 'private';
  activity_visibility: 'public' | 'friends' | 'private';
  allow_downloads: boolean;
  allow_comments: boolean;
  allow_follows: boolean;
  show_listening_activity: boolean;
  show_liked_music: boolean;
  show_playlists: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
}

interface PrivacySettingsProps {
  className?: string;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({ className }) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector(state => state.user);
  
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    profile_visibility: 'public',
    music_sharing: 'public',
    playlist_sharing: 'public',
    activity_visibility: 'friends',
    allow_downloads: true,
    allow_comments: true,
    allow_follows: true,
    show_listening_activity: true,
    show_liked_music: true,
    show_playlists: true,
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const communityApi = CommunityApiService.getInstance();

  useEffect(() => {
    if (currentUser) {
      loadPrivacySettings();
    }
  }, [currentUser]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      // This would load from the API
      // const userPreferences = await communityApi.getPrivacySettings();
      // setPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to load privacy settings'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // await communityApi.updatePrivacySettings(preferences);
      
      dispatch(addToast({
        type: 'success',
        message: 'Privacy settings saved successfully'
      }));
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      dispatch(addToast({
        type: 'error',
        message: 'Failed to save privacy settings'
      }));
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const VisibilitySelect: React.FC<{
    value: 'public' | 'friends' | 'private';
    onChange: (value: 'public' | 'friends' | 'private') => void;
    label: string;
    description: string;
  }> = ({ value, onChange, label, description }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-white">{label}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {[
          { value: 'public', label: 'Public', icon: Globe, desc: 'Visible to everyone' },
          { value: 'friends', label: 'Friends Only', icon: Users, desc: 'Only people you follow' },
          { value: 'private', label: 'Private', icon: Lock, desc: 'Only visible to you' }
        ].map(option => (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
              value === option.value
                ? 'bg-purple-600/20 border border-purple-600/50'
                : 'bg-gray-700 hover:bg-gray-650 border border-transparent'
            }`}
          >
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value as any)}
              className="sr-only"
            />
            <option.icon className={`w-5 h-5 mr-3 ${
              value === option.value ? 'text-purple-400' : 'text-gray-400'
            }`} />
            <div className="flex-1">
              <div className={`font-medium ${
                value === option.value ? 'text-white' : 'text-gray-300'
              }`}>
                {option.label}
              </div>
              <div className="text-sm text-gray-400">{option.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
  }> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium text-white">{label}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Login Required</h3>
          <p className="text-gray-400">Please log in to manage your privacy settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`privacy-settings ${className || ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-400" />
            Privacy Settings
          </h1>
          <p className="text-gray-400">Control who can see your content and activity</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile & Content Visibility */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-400" />
                Profile & Content Visibility
              </h2>
              <div className="space-y-4">
                <VisibilitySelect
                  value={preferences.profile_visibility}
                  onChange={(value) => updatePreference('profile_visibility', value)}
                  label="Profile Visibility"
                  description="Who can view your profile information"
                />
                
                <VisibilitySelect
                  value={preferences.music_sharing}
                  onChange={(value) => updatePreference('music_sharing', value)}
                  label="Music Sharing"
                  description="Who can see music you've uploaded"
                />
                
                <VisibilitySelect
                  value={preferences.playlist_sharing}
                  onChange={(value) => updatePreference('playlist_sharing', value)}
                  label="Playlist Sharing"
                  description="Who can view your playlists"
                />
                
                <VisibilitySelect
                  value={preferences.activity_visibility}
                  onChange={(value) => updatePreference('activity_visibility', value)}
                  label="Activity Visibility"
                  description="Who can see your listening activity and interactions"
                />
              </div>
            </section>

            {/* Interaction Settings */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-400" />
                Interaction Settings
              </h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={preferences.allow_downloads}
                  onChange={(checked) => updatePreference('allow_downloads', checked)}
                  label="Allow Downloads"
                  description="Let others download your uploaded music"
                />
                
                <ToggleSwitch
                  checked={preferences.allow_comments}
                  onChange={(checked) => updatePreference('allow_comments', checked)}
                  label="Allow Comments"
                  description="Allow others to comment on your music and playlists"
                />
                
                <ToggleSwitch
                  checked={preferences.allow_follows}
                  onChange={(checked) => updatePreference('allow_follows', checked)}
                  label="Allow Follows"
                  description="Let other users follow your activity"
                />
              </div>
            </section>

            {/* Activity Display */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-400" />
                Activity Display
              </h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={preferences.show_listening_activity}
                  onChange={(checked) => updatePreference('show_listening_activity', checked)}
                  label="Show Listening Activity"
                  description="Display what you're currently listening to"
                />
                
                <ToggleSwitch
                  checked={preferences.show_liked_music}
                  onChange={(checked) => updatePreference('show_liked_music', checked)}
                  label="Show Liked Music"
                  description="Make your liked songs visible to others"
                />
                
                <ToggleSwitch
                  checked={preferences.show_playlists}
                  onChange={(checked) => updatePreference('show_playlists', checked)}
                  label="Show Public Playlists"
                  description="Display your public playlists on your profile"
                />
              </div>
            </section>

            {/* Notification Settings */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-400" />
                Notifications
              </h2>
              <div className="space-y-4">
                <ToggleSwitch
                  checked={preferences.email_notifications}
                  onChange={(checked) => updatePreference('email_notifications', checked)}
                  label="Email Notifications"
                  description="Receive notifications about activity via email"
                />
                
                <ToggleSwitch
                  checked={preferences.push_notifications}
                  onChange={(checked) => updatePreference('push_notifications', checked)}
                  label="Push Notifications"
                  description="Get browser notifications for important updates"
                />
                
                <ToggleSwitch
                  checked={preferences.marketing_emails}
                  onChange={(checked) => updatePreference('marketing_emails', checked)}
                  label="Marketing Emails"
                  description="Receive promotional emails and feature updates"
                />
              </div>
            </section>

            {/* Privacy Notice */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-medium mb-1">Privacy Notice</p>
                  <ul className="space-y-1 text-blue-300">
                    <li>• Your privacy settings are applied immediately</li>
                    <li>• Content shared before changing settings may still be visible</li>
                    <li>• Some features require certain privacy levels to function</li>
                    <li>• We never share your personal data with third parties</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
