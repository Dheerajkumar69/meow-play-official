import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import ModernAuth from './ModernAuth';
import { LoadingSpinner } from './LoadingStates';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    if (showAuth) {
      return <ModernAuth onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return <>{children}</>;
};

export default AppWrapper;
