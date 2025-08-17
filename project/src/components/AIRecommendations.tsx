import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Users, TrendingUp, RefreshCw, Play, Heart, MoreHorizontal } from 'lucide-react';
import { AIRecommendationEngine } from '../services/aiRecommendationEngine';
import { useAuth } from '../contexts/AuthContext';
import { Song } from '../types';

const AIRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<{
    collaborative: Song[];
    contentBased: Song[];
    timeBased: Song[];
    hybrid: Song[];
  }>({
    collaborative: [],
    contentBased: [],
    timeBased: [],
    hybrid: []
  });
  const [activeTab, setActiveTab] = useState<'hybrid' | 'collaborative' | 'content' | 'time'>('hybrid');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [hybrid, collaborative, contentBased, timeBased] = await Promise.all([
        AIRecommendationEngine.getHybridRecommendations(user.id, 20),
        AIRecommendationEngine.getCollaborativeRecommendations(user.id, 15),
        AIRecommendationEngine.getContentBasedRecommendations(user.id, 15),
        AIRecommendationEngine.getTimeBasedRecommendations(user.id, 10)
      ]);

      setRecommendations({
        hybrid,
        collaborative,
        contentBased,
        timeBased
      });
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (song: Song) => {
    if (!user) return;
    
    // Track the interaction
    await AIRecommendationEngine.trackInteraction(user.id, song.id, 'play');
    
    // Here you would integrate with your audio player
    console.log('Playing song:', song.title);
  };

  const handleLike = async (song: Song) => {
    if (!user) return;
    
    // Track the interaction
    await AIRecommendationEngine.trackInteraction(user.id, song.id, 'like');
    
    // Here you would integrate with your like system
    console.log('Liked song:', song.title);
  };

  const getCurrentRecommendations = () => {
    switch (activeTab) {
      case 'collaborative':
        return recommendations.collaborative;
      case 'content':
        return recommendations.contentBased;
      case 'time':
        return recommendations.timeBased;
      default:
        return recommendations.hybrid;
    }
  };

  const getTabDescription = () => {
    const hour = new Date().getHours();
    let timeOfDay = 'evening';
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    switch (activeTab) {
      case 'collaborative':
        return 'Based on users with similar taste';
      case 'content':
        return 'Based on your music preferences';
      case 'time':
        return `Perfect for ${timeOfDay} listening`;
      default:
        return 'AI-powered personalized mix';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="flex space-x-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 rounded w-20"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="w-full h-32 bg-gray-600 rounded mb-3"></div>
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
            AI Recommendations
          </h2>
          <p className="text-gray-400 text-sm mt-1">{getTabDescription()}</p>
        </div>
        <button
          onClick={loadRecommendations}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          title="Refresh recommendations"
        >
          <RefreshCw className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {[
          { key: 'hybrid', label: 'Smart Mix', icon: Sparkles },
          { key: 'collaborative', label: 'Similar Users', icon: Users },
          { key: 'content', label: 'Your Style', icon: TrendingUp },
          { key: 'time', label: 'Time-based', icon: Clock }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === key 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getCurrentRecommendations().length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No recommendations yet</p>
            <p className="text-gray-500 text-sm">
              Listen to more music to get personalized recommendations
            </p>
          </div>
        ) : (
          getCurrentRecommendations().map((song, index) => (
            <div
              key={song.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-200 group"
            >
              <div className="relative mb-3">
                <img
                  src={song.cover_url || '/default-cover.jpg'}
                  alt={song.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handlePlay(song)}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-6 h-6 text-white" />
                  </button>
                </div>
                
                {/* Recommendation rank badge */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  #{index + 1}
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-white font-medium text-sm truncate mb-1">
                  {song.title}
                </h3>
                <p className="text-gray-400 text-xs truncate">
                  {song.artist}
                </p>
                {song.genre && (
                  <p className="text-gray-500 text-xs mt-1">
                    {song.genre}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePlay(song)}
                    className="p-1.5 bg-purple-500 hover:bg-purple-600 rounded-full transition-colors"
                  >
                    <Play className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={() => handleLike(song)}
                    className="p-1.5 bg-gray-600 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <Heart className="w-3 h-3 text-white" />
                  </button>
                </div>
                
                <button className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors">
                  <MoreHorizontal className="w-3 h-3 text-white" />
                </button>
              </div>

              {/* Recommendation reason */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-xs text-gray-500">
                  {activeTab === 'collaborative' && '👥 Similar users loved this'}
                  {activeTab === 'content' && '🎵 Matches your taste'}
                  {activeTab === 'time' && '⏰ Perfect for now'}
                  {activeTab === 'hybrid' && '🤖 AI recommended'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Performance Stats */}
      <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-white font-medium mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Recommendation Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {recommendations.hybrid.length}
            </div>
            <div className="text-xs text-gray-400">Smart Mix</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {recommendations.collaborative.length}
            </div>
            <div className="text-xs text-gray-400">Collaborative</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {recommendations.contentBased.length}
            </div>
            <div className="text-xs text-gray-400">Content-based</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {recommendations.timeBased.length}
            </div>
            <div className="text-xs text-gray-400">Time-based</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
