import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import ConnectionStatus from './ConnectionStatus';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Check if current route is login or register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // If not authenticated OR on auth pages, show full screen layout
  if (!isAuthenticated || isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex flex-col overflow-hidden">
      {/* Connection Status Bar */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <ConnectionStatus />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-2 xxs:px-3 sm:px-4 md:px-6">
          <div className="lg:hidden h-16" /> {/* Spacer for mobile menu button */}
          <Outlet />
        </main>
      </div>
      <PlayerBar />
    </div>
  );
};

export default Layout;