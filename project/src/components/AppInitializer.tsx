import React, { useEffect } from 'react';
import { useMusic } from '../contexts/MusicContext';

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { refreshSongs } = useMusic();

  useEffect(() => {
    // Refresh songs when the app initializes to ensure all songs have cover art
    // and are accessible across devices
    refreshSongs();
    
    // Set up an interval to refresh songs periodically to ensure
    // cross-device accessibility
    const refreshInterval = setInterval(() => {
      refreshSongs();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshSongs]);

  return <>{children}</>;
};

export default AppInitializer;