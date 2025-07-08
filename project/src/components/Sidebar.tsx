import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockPlaylists } from '../utils/mockData';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleCreatePlaylist = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      if (target.value.trim()) {
        // TODO: Implement playlist creation
        console.log('Creating playlist:', target.value);
        target.value = '';
        setShowCreatePlaylist(false);
      }
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🐱</span>
          </div>
          <h1 className="text-xl font-bold text-white">Meow-Play</h1>
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
              <span className="font-medium">{item.name}</span>
              {item.name === 'Admin Panel' && (
                <Shield className="w-4 h-4 text-purple-400" />
              )}
            </Link>
          ))}
        </div>

        {/* Discover Section */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider px-4 py-2">
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
              <span className="text-sm">Trending</span>
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
              <span className="text-sm">For You</span>
            </Link>
          </div>
        </div>

        {/* Playlists */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
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
                onKeyPress={handleCreatePlaylist}
                onBlur={() => setShowCreatePlaylist(false)}
                autoFocus
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div className="space-y-1 mt-2">
            {mockPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ListMusic className="w-4 h-4" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm truncate block">{playlist.name}</span>
                  {playlist.followers && (
                    <span className="text-xs text-gray-500">{playlist.followers} followers</span>
                  )}
                </div>
              </Link>
            ))}
            
            {/* Weekend Special Playlist */}
            <Link
              to="/playlist/weekend_special"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <span className="text-lg">🐱</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm truncate block">Weekend Special</span>
                <span className="text-xs text-purple-400">Auto-updated weekly</span>
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
              <p className="text-sm font-medium text-white truncate">
                {user?.username}
                {user?.isAdmin && <span className="text-purple-400 ml-1">(Admin)</span>}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white"
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
      <div className="hidden lg:flex w-64 bg-black/50 backdrop-blur-lg flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-black/90 backdrop-blur-lg flex flex-col transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Streamify</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;