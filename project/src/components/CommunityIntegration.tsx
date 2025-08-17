/**
 * Community Integration Component - Integrates community sharing with existing upload flow
 */
import React, { useState, useEffect } from 'react';
import { Globe, Users, Lock, Upload, Music, Share2, CheckCircle, AlertCircle } from 'lucide-react';
import { CommunityApiService } from '../services/communityApi';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface CommunityIntegrationProps {
  onUploadComplete?: (musicId: string, isShared: boolean) => void;
  className?: string;
}

interface UploadSettings {
  shareToGlobal: boolean;
  visibility: 'public' | 'friends' | 'private';
  allowDownloads: boolean;
  allowComments: boolean;
  autoDetectDuplicates: boolean;
}

export const CommunityIntegration: React.FC<CommunityIntegrationProps> = ({ 
  onUploadComplete,
  className 
}) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state: any) => state.user);
  
  const [settings, setSettings] = useState<UploadSettings>({
    shareToGlobal: true,
    visibility: 'public',
    allowDownloads: true,
    allowComments: true,
    autoDetectDuplicates: true
  });

  const [globalStats, setGlobalStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    songsToday: 0,
    trending: []
  });

  const [loading, setLoading] = useState(false);

  const communityApi = CommunityApiService.getInstance();

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      // Mock data - would be loaded from API
      setGlobalStats({
        totalSongs: 15420,
        totalUsers: 3280,
        songsToday: 47,
        trending: ['Pop', 'Electronic', 'Hip Hop']
      });
    } catch (error) {
      console.error('Failed to load global stats:', error);
    }
  };

  const handleSettingChange = <K extends keyof UploadSettings>(
    key: K,
    value: UploadSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return Globe;
      case 'friends': return Users;
      case 'private': return Lock;
      default: return Globe;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'text-green-400';
      case 'friends': return 'text-blue-400';
      case 'private': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className={`community-integration ${className || ''}`}>
      {/* Global Database Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">🌍 Global Database</h2>
              <p className="text-purple-200">Share your music with the entire Meow-Play community</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{globalStats.totalSongs.toLocaleString()}</div>
            <div className="text-sm text-purple-200">Total Songs</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{globalStats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-purple-200">Active Users</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{globalStats.songsToday}</div>
            <div className="text-xs text-purple-200">Uploaded Today</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{globalStats.trending.length}</div>
            <div className="text-xs text-purple-200">Trending Genres</div>
          </div>
        </div>
      </div>

      {/* Community Sharing Settings */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-purple-400" />
          Community Sharing Settings
        </h3>

        <div className="space-y-4">
          {/* Share to Global Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Globe className="w-4 h-4 text-green-400" />
                <h4 className="font-medium text-white">Share to Global Database</h4>
              </div>
              <p className="text-sm text-gray-400">
                Automatically share your uploads with the entire community for discovery
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('shareToGlobal', !settings.shareToGlobal)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.shareToGlobal ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.shareToGlobal ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Visibility Settings */}
          {settings.shareToGlobal && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Visibility Level</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'public', label: 'Public', desc: 'Anyone can discover', icon: Globe },
                  { value: 'friends', label: 'Friends Only', desc: 'Only followers', icon: Users },
                  { value: 'private', label: 'Private', desc: 'Only you', icon: Lock }
                ].map(option => {
                  const IconComponent = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        settings.visibility === option.value
                          ? 'bg-purple-600/20 border border-purple-600/50'
                          : 'bg-gray-600 hover:bg-gray-550 border border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={settings.visibility === option.value}
                        onChange={(e) => handleSettingChange('visibility', e.target.value as any)}
                        className="sr-only"
                      />
                      <IconComponent className={`w-4 h-4 mr-2 ${
                        settings.visibility === option.value ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`text-sm font-medium ${
                          settings.visibility === option.value ? 'text-white' : 'text-gray-300'
                        }`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-400">{option.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Settings */}
          {settings.shareToGlobal && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-white">Allow Downloads</h4>
                  <p className="text-xs text-gray-400">Let others download your music</p>
                </div>
                <button
                  onClick={() => handleSettingChange('allowDownloads', !settings.allowDownloads)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.allowDownloads ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.allowDownloads ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-white">Allow Comments</h4>
                  <p className="text-xs text-gray-400">Enable comments on your uploads</p>
                </div>
                <button
                  onClick={() => handleSettingChange('allowComments', !settings.allowComments)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.allowComments ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.allowComments ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-white">Auto-Detect Duplicates</h4>
                  <p className="text-xs text-gray-400">Prevent duplicate uploads automatically</p>
                </div>
                <button
                  onClick={() => handleSettingChange('autoDetectDuplicates', !settings.autoDetectDuplicates)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.autoDetectDuplicates ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.autoDetectDuplicates ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-600/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-200">
            <p className="font-medium mb-2">🌍 Global Database Benefits:</p>
            <ul className="space-y-1 text-green-300">
              <li>• <strong>Auto-Discovery:</strong> Your music appears in community searches instantly</li>
              <li>• <strong>Global Reach:</strong> Connect with music lovers worldwide</li>
              <li>• <strong>Smart Recommendations:</strong> AI suggests your music to similar listeners</li>
              <li>• <strong>Duplicate Prevention:</strong> Automatic detection prevents re-uploads</li>
              <li>• <strong>Analytics:</strong> Track plays, likes, and downloads across the platform</li>
              <li>• <strong>Community Features:</strong> Enable comments, playlists, and social interactions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      {settings.shareToGlobal && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Privacy & Rights Notice:</p>
              <ul className="space-y-1 text-blue-300">
                <li>• You retain full ownership and copyright of your music</li>
                <li>• Content is subject to community moderation guidelines</li>
                <li>• You can change visibility or remove content anytime</li>
                <li>• All uploads are scanned for copyright compliance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Current Settings Summary */}
      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-white mb-2">Current Upload Settings:</h4>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            settings.shareToGlobal ? 'bg-green-900/20 text-green-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {settings.shareToGlobal ? (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Global Sharing ON
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Private Upload
              </>
            )}
          </span>
          
          {settings.shareToGlobal && (
            <>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/20 ${getVisibilityColor(settings.visibility)}`}>
                {React.createElement(getVisibilityIcon(settings.visibility), { className: "w-3 h-3 mr-1" })}
                {settings.visibility.charAt(0).toUpperCase() + settings.visibility.slice(1)}
              </span>
              
              {settings.allowDownloads && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400">
                  Downloads Enabled
                </span>
              )}
              
              {settings.allowComments && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-900/20 text-indigo-400">
                  Comments Enabled
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityIntegration;
