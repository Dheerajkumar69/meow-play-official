import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Music, 
  Heart, 
  Upload, 
  Plus, 
  User,
  LogOut,
  Clock,
  ListMusic,
  TrendingUp,
  Shield,
  Menu,
  X,
  Globe,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockPlaylists } from '../utils/mockData';
import { ApiService } from '../services/api';
import { Playlist } from '../types';
import { SanitizationService } from '../utils/sanitization';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  
  // Fetch user playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (user) {
        setIsLoadingPlaylists(true);
        try {
          // TODO: Replace with actual API call to get user playlists
          // For now, we'll use the mock data
          setPlaylists(mockPlaylists);
        } catch (error) {
          console.error('Error fetching playlists:', error);
        } finally {
          setIsLoadingPlaylists(false);
        }
      }
    };
    
    fetchPlaylists();
  }, [user]);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Discover', href: '/discover', icon: Globe },
    { name: 'Your Music', href: '/library', icon: Music },
    { name: 'Liked Songs', href: '/liked', icon: Heart },
    { name: 'Recently Played', href: '/recent', icon: Clock },
    { name: 'Upload', href: '/upload', icon: Upload },
  ];

  // Add admin panel for admin users
  if (user?.isAdmin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  const handleCreatePlaylist = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (playlistName.trim() && user) {
        setIsCreatingPlaylist(true);
        try {
          const api = ApiService.getInstance();
          const sanitizedName = SanitizationService.sanitizeName(playlistName.trim());
          const newPlaylist = await api.createPlaylist({
            name: sanitizedName,
            userId: user.id,
            isPublic: false,
            description: ''
          });
          
          // Add the new playlist to the list
          setPlaylists(prev => [newPlaylist, ...prev]);
          setPlaylistName('');
          setShowCreatePlaylist(false);
        } catch (error) {
          console.error('Error creating playlist:', error);
        } finally {
          setIsCreatingPlaylist(false);
        }
      }
    }
  };
  
  const handlePlaylistNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaylistName(e.target.value);
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🐱</span>
          </div>
          <h1 className="text-lg xxs:text-xl font-bold text-white">Meow-Play</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm xxs:text-base font-medium">{item.name}</span>
              {item.name === 'Admin Panel' && (
                <Shield className="w-4 h-4 text-purple-400" />
              )}
            </Link>
          ))}
        </div>

        {/* Discover Section */}
        <div className="mt-8">
          <h3 className="text-xs xxs:text-sm font-semibold text-gray-300 uppercase tracking-wider px-4 py-2">
            Discover
          </h3>
          <div className="space-y-1">
            <Link
              to="/trending"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                isActive('/trending')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs xxs:text-sm">Trending</span>
            </Link>
            <Link
              to="/library"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                isActive('/library') && location.search.includes('tab=suggestions')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">✨</span>
              <span className="text-xs xxs:text-sm">For You</span>
            </Link>
          </div>
        </div>

        {/* Playlists */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-xs xxs:text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Playlists
            </h3>
            <button
              onClick={() => setShowCreatePlaylist(!showCreatePlaylist)}
              className="p-1 text-gray-300 hover:text-white transition-colors"
              aria-label="Create playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {showCreatePlaylist && (
            <div className="px-4 py-2">
              <input
                type="text"
                placeholder="Playlist name"
                value={playlistName}
                onChange={handlePlaylistNameChange}
                onKeyPress={handleCreatePlaylist}
                onBlur={() => !isCreatingPlaylist && setShowCreatePlaylist(false)}
                autoFocus
                disabled={isCreatingPlaylist}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              {isCreatingPlaylist && (
                <div className="flex justify-center mt-2">
                  <Loader className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1 mt-2">
            {isLoadingPlaylists ? (
              <div className="flex justify-center py-4">
                <Loader className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            ) : playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ListMusic className="w-4 h-4" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs xxs:text-sm truncate block">{playlist.name}</span>
                    {playlist.followers && (
                      <span className="text-[10px] xxs:text-xs text-gray-500">{playlist.followers} followers</span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-400 text-xs xxs:text-sm">
                No playlists yet. Create one!
              </div>
            )}
            
            {/* Weekend Special Playlist */}
            <Link
              to="/playlist/weekend_special"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="text-lg">🐱</span>
              <div className="min-w-0 flex-1">
                <span className="text-xs xxs:text-sm truncate block">Weekend Special</span>
                <span className="text-[10px] xxs:text-xs text-purple-400">Auto-updated weekly</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <Link 
            to="/profile" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center space-x-3 hover:bg-white/5 rounded-lg p-2 transition-colors flex-1"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {user?.isAdmin ? (
                <Shield className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs xxs:text-sm font-medium text-white truncate">
                {user?.username}
                {user?.isAdmin && <span className="text-purple-400 ml-1">(Admin)</span>}
              </p>
              <p className="text-[10px] xxs:text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed to top left */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 text-white bg-black/50 backdrop-blur-sm p-3 rounded-full hover:bg-black/70 active:bg-black/90 transition-colors touch-manipulation"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-black/30 backdrop-blur-lg border-r border-white/10 overflow-y-auto">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close mobile menu"
        />
        
        {/* Sidebar */}
        <div className="absolute top-0 left-0 h-full w-64 xxs:w-72 sm:w-80 bg-black/80 backdrop-blur-lg border-r border-white/10 transform transition-transform duration-300 overflow-y-auto">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;