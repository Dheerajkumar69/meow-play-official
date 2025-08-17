/**
 * Analytics Dashboard Component for MeowPlay
 */
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Music, 
  Play, 
  Heart, 
  Upload, 
  Search,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { analytics } from '../utils/analytics';

interface AnalyticsData {
  totalUsers: number;
  totalSongs: number;
  totalPlays: number;
  totalLikes: number;
  totalUploads: number;
  totalSearches: number;
  avgSessionDuration: number;
  bounceRate: number;
  topSongs: Array<{
    id: string;
    title: string;
    artist: string;
    plays: number;
    likes: number;
  }>;
  userEngagement: Array<{
    date: string;
    plays: number;
    uploads: number;
    registrations: number;
  }>;
  performanceMetrics: {
    lcp: number;
    fid: number;
    cls: number;
    pageLoadTime: number;
    apiResponseTime: number;
  };
  errorStats: {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{
      message: string;
      count: number;
      lastOccurred: string;
    }>;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'errors' | 'engagement'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - in real implementation, this would fetch from your analytics API
      const mockData: AnalyticsData = {
        totalUsers: 1247,
        totalSongs: 3856,
        totalPlays: 28934,
        totalLikes: 12456,
        totalUploads: 234,
        totalSearches: 8765,
        avgSessionDuration: 18.5,
        bounceRate: 23.4,
        topSongs: [
          { id: '1', title: 'Midnight Dreams', artist: 'Luna Nova', plays: 2341, likes: 456 },
          { id: '2', title: 'Electric Pulse', artist: 'Neon Beats', plays: 1987, likes: 398 },
          { id: '3', title: 'Ocean Waves', artist: 'Calm Sounds', plays: 1654, likes: 321 },
          { id: '4', title: 'Urban Rhythm', artist: 'City Vibes', plays: 1432, likes: 287 },
          { id: '5', title: 'Starlight', artist: 'Cosmic Dreams', plays: 1298, likes: 245 }
        ],
        userEngagement: [
          { date: '2024-01-10', plays: 3245, uploads: 12, registrations: 23 },
          { date: '2024-01-11', plays: 3567, uploads: 15, registrations: 31 },
          { date: '2024-01-12', plays: 4123, uploads: 18, registrations: 28 },
          { date: '2024-01-13', plays: 3891, uploads: 14, registrations: 19 },
          { date: '2024-01-14', plays: 4567, uploads: 21, registrations: 35 },
          { date: '2024-01-15', plays: 5234, uploads: 19, registrations: 42 },
          { date: '2024-01-16', plays: 4876, uploads: 16, registrations: 38 }
        ],
        performanceMetrics: {
          lcp: 1850,
          fid: 45,
          cls: 0.08,
          pageLoadTime: 2340,
          apiResponseTime: 180
        },
        errorStats: {
          totalErrors: 23,
          errorRate: 0.8,
          topErrors: [
            { message: 'Network request failed', count: 8, lastOccurred: '2024-01-16T10:30:00Z' },
            { message: 'Audio playback error', count: 5, lastOccurred: '2024-01-16T09:15:00Z' },
            { message: 'File upload timeout', count: 4, lastOccurred: '2024-01-15T16:45:00Z' },
            { message: 'Authentication expired', count: 3, lastOccurred: '2024-01-15T14:20:00Z' },
            { message: 'Database connection lost', count: 3, lastOccurred: '2024-01-14T11:10:00Z' }
          ]
        }
      };

      // Add current performance metrics
      const currentMetrics = PerformanceMonitor.getMetrics();
      if (Object.keys(currentMetrics).length > 0) {
        mockData.performanceMetrics = {
          lcp: currentMetrics.LCP || mockData.performanceMetrics.lcp,
          fid: currentMetrics.FID || mockData.performanceMetrics.fid,
          cls: currentMetrics.CLS || mockData.performanceMetrics.cls,
          pageLoadTime: currentMetrics.Page_Load_Complete || mockData.performanceMetrics.pageLoadTime,
          apiResponseTime: currentMetrics.API_songs || mockData.performanceMetrics.apiResponseTime
        };
      }

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const calculateImprovement = (current: number, baseline: number): string => {
    const improvement = ((baseline - current) / baseline) * 100;
    return improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="analytics-dashboard p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard p-6">
        <div className="text-center text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4" />
          <p>Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-purple-400" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Monitor your MeowPlay performance and user engagement</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={loadAnalyticsData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: Zap },
          { id: 'errors', label: 'Errors', icon: AlertTriangle },
          { id: 'engagement', label: 'Engagement', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: analyticsData.totalUsers, icon: Users, color: 'text-blue-400', improvement: '+12.3%' },
              { label: 'Total Songs', value: analyticsData.totalSongs, icon: Music, color: 'text-green-400', improvement: '+8.7%' },
              { label: 'Total Plays', value: analyticsData.totalPlays, icon: Play, color: 'text-purple-400', improvement: '+15.2%' },
              { label: 'Total Likes', value: analyticsData.totalLikes, icon: Heart, color: 'text-red-400', improvement: '+9.8%' }
            ].map(metric => (
              <div key={metric.label} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value.toLocaleString()}</p>
                    <p className={`text-sm ${metric.improvement.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.improvement} vs last period
                    </p>
                  </div>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Top Songs */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              Top Performing Songs
            </h3>
            <div className="space-y-3">
              {analyticsData.topSongs.map((song, index) => (
                <div key={song.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{song.title}</p>
                      <p className="text-gray-400 text-sm">{song.artist}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-purple-400">
                        <Play className="w-4 h-4 mr-1" />
                        {song.plays.toLocaleString()}
                      </div>
                      <div className="flex items-center text-red-400">
                        <Heart className="w-4 h-4 mr-1" />
                        {song.likes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Core Web Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                label: 'Largest Contentful Paint (LCP)', 
                value: analyticsData.performanceMetrics.lcp, 
                unit: 'ms',
                baseline: 2800,
                description: 'Loading performance'
              },
              { 
                label: 'First Input Delay (FID)', 
                value: analyticsData.performanceMetrics.fid, 
                unit: 'ms',
                baseline: 120,
                description: 'Interactivity'
              },
              { 
                label: 'Cumulative Layout Shift (CLS)', 
                value: analyticsData.performanceMetrics.cls, 
                unit: '',
                baseline: 0.15,
                description: 'Visual stability'
              }
            ].map(metric => {
              const status = getPerformanceStatus(metric.label.toLowerCase().includes('lcp') ? 'lcp' : 
                                                 metric.label.toLowerCase().includes('fid') ? 'fid' : 'cls', 
                                                 metric.value);
              const improvement = calculateImprovement(metric.value, metric.baseline);
              
              return (
                <div key={metric.label} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{metric.label}</h4>
                    {getStatusIcon(status)}
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {metric.value.toFixed(metric.unit === '' ? 3 : 0)}{metric.unit}
                  </p>
                  <p className="text-gray-400 text-sm">{metric.description}</p>
                  <p className={`text-sm mt-2 ${improvement.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {improvement} improvement
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Page Load Performance
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Page Load Time</span>
                  <span className="text-white">{analyticsData.performanceMetrics.pageLoadTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">API Response Time</span>
                  <span className="text-white">{analyticsData.performanceMetrics.apiResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Session Duration</span>
                  <span className="text-white">{analyticsData.avgSessionDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bounce Rate</span>
                  <span className="text-white">{analyticsData.bounceRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Performance Improvements
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <span className="text-green-400">LCP Optimization</span>
                  <span className="text-green-400 font-bold">+18.5%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                  <span className="text-blue-400">Bundle Size Reduction</span>
                  <span className="text-blue-400 font-bold">+12.3%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                  <span className="text-purple-400">API Response Time</span>
                  <span className="text-purple-400 font-bold">+25.7%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                  <span className="text-yellow-400">Cache Hit Rate</span>
                  <span className="text-yellow-400 font-bold">+34.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          {/* Error Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Errors</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.errorStats.totalErrors}</p>
                  <p className="text-green-400 text-sm">-15.2% vs last period</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Error Rate</p>
                  <p className="text-2xl font-bold text-white">{analyticsData.errorStats.errorRate}%</p>
                  <p className="text-green-400 text-sm">-8.7% vs last period</p>
                </div>
                <Activity className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Uptime</p>
                  <p className="text-2xl font-bold text-white">99.8%</p>
                  <p className="text-green-400 text-sm">+0.3% vs last period</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Top Errors */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              Top Error Messages
            </h3>
            <div className="space-y-3">
              {analyticsData.errorStats.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium">{error.message}</p>
                    <p className="text-gray-400 text-sm">
                      Last occurred: {new Date(error.lastOccurred).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {error.count} occurrences
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Uploads', value: analyticsData.totalUploads, icon: Upload, color: 'text-green-400', improvement: '+23.1%' },
              { label: 'Searches', value: analyticsData.totalSearches, icon: Search, color: 'text-blue-400', improvement: '+18.9%' },
              { label: 'Avg Session', value: `${analyticsData.avgSessionDuration}m`, icon: Clock, color: 'text-purple-400', improvement: '+11.4%' },
              { label: 'Bounce Rate', value: `${analyticsData.bounceRate}%`, icon: TrendingUp, color: 'text-yellow-400', improvement: '-5.2%' }
            ].map(metric => (
              <div key={metric.label} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className={`text-sm ${metric.improvement.startsWith('+') && !metric.label.includes('Bounce') || 
                                             metric.improvement.startsWith('-') && metric.label.includes('Bounce') ? 
                                             'text-green-400' : 'text-red-400'}`}>
                      {metric.improvement} vs last period
                    </p>
                  </div>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* User Engagement Trend */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              User Engagement Trend (Last 7 Days)
            </h3>
            <div className="space-y-4">
              {analyticsData.userEngagement.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-purple-600 rounded-full mr-3"></span>
                    <span className="text-white">{new Date(day.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center text-purple-400">
                      <Play className="w-4 h-4 mr-1" />
                      {day.plays.toLocaleString()} plays
                    </div>
                    <div className="flex items-center text-green-400">
                      <Upload className="w-4 h-4 mr-1" />
                      {day.uploads} uploads
                    </div>
                    <div className="flex items-center text-blue-400">
                      <Users className="w-4 h-4 mr-1" />
                      {day.registrations} new users
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
