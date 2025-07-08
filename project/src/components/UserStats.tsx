import React from 'react';
import { BarChart3, Clock, Music, TrendingUp, Award } from 'lucide-react';
import { UserStats as UserStatsType } from '../types';
import { mockUserStats } from '../utils/mockData';

const UserStats: React.FC = () => {
  const stats = mockUserStats;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Listening</p>
              <p className="text-white font-semibold">{formatTime(stats.totalListeningTime)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Songs Played</p>
              <p className="text-white font-semibold">{stats.songsPlayed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">This Week</p>
              <p className="text-white font-semibold">{formatTime(stats.weeklyStats[0]?.minutes || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Day Streak</p>
              <p className="text-white font-semibold">{stats.currentStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Genres */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Top Genres</h3>
          </div>
          <div className="space-y-3">
            {stats.favoriteGenres.map((genre, index) => (
              <div key={genre.genre} className="flex items-center justify-between">
                <span className="text-gray-300">{genre.genre}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${(genre.count / stats.favoriteGenres[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{genre.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Artists */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Music className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Top Artists</h3>
          </div>
          <div className="space-y-3">
            {stats.topArtists.map((artist, index) => (
              <div key={artist.artist} className="flex items-center justify-between">
                <span className="text-gray-300">{artist.artist}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${(artist.count / stats.topArtists[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{artist.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Listening */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Weekly Listening</h3>
        </div>
        <div className="flex items-end space-x-2 h-32">
          {stats.weeklyStats.map((week, index) => (
            <div key={week.week} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg"
                style={{ height: `${(week.minutes / Math.max(...stats.weeklyStats.map(w => w.minutes))) * 100}%` }}
              />
              <span className="text-gray-400 text-xs mt-2">{week.week}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStats;