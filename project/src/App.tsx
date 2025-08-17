import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { PlaybackProvider } from './contexts/PlaybackContext';
import { QueueProvider } from './contexts/QueueContext';
import ErrorBoundary from './components/ErrorBoundary';
import { RetryBoundary } from './components/RetryBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { MusicProvider } from './contexts/MusicContext';
import { PerformanceMonitor } from './utils/performanceMonitor';
import ToastContainer from './components/Toast';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import SEOHead from './components/SEOHead';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingSpinner } from './components/LoadingStates';
import AppWrapper from './components/AppWrapper';

// Lazy load components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch'));
const Library = lazy(() => import('./pages/Library'));
const Upload = lazy(() => import('./pages/Upload'));
const Profile = lazy(() => import('./pages/Profile'));
const LikedSongs = lazy(() => import('./pages/LikedSongs'));
const RecentlyPlayed = lazy(() => import('./pages/RecentlyPlayed'));
const Trending = lazy(() => import('./pages/Trending'));
const Discover = lazy(() => import('./pages/Discover'));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Community features
const CommunityDiscovery = lazy(() => import('./components/CommunityDiscovery'));
const CommunityUpload = lazy(() => import('./components/CommunityUpload'));
const AdminModeration = lazy(() => import('./components/AdminModeration'));
const PrivacySettings = lazy(() => import('./components/PrivacySettings'));

const App: React.FC = () => {
  React.useEffect(() => {
    // Initialize performance monitoring
    PerformanceMonitor.init();
    
    return () => {
      PerformanceMonitor.cleanup();
    };
  }, []);

  return (
    <ThemeProvider>
      <SEOHead />
        <ErrorBoundary context="App">
          <RetryBoundary maxRetries={3}>
            <AuthProvider>
              <MusicProvider>
                <PlaybackProvider>
                  <QueueProvider>
                    <Router>
                      <KeyboardShortcuts />
                      <AppWrapper>
                        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
                          <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                            <Route path="/" element={<Layout />}>
                              <Route path="login" element={<Login />} />
                              <Route path="register" element={<Register />} />
                              <Route
                                index
                                element={
                                  <ProtectedRoute>
                                    <Home />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="search"
                                element={
                                  <ProtectedRoute>
                                    <Search />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="search/advanced"
                                element={
                                  <ProtectedRoute>
                                    <AdvancedSearch />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="discover"
                                element={
                                  <ProtectedRoute>
                                    <Discover />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="library"
                                element={
                                  <ProtectedRoute>
                                    <Library />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="liked"
                                element={
                                  <ProtectedRoute>
                                    <LikedSongs />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="recent"
                                element={
                                  <ProtectedRoute>
                                    <RecentlyPlayed />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="trending"
                                element={
                                  <ProtectedRoute>
                                    <Trending />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="playlist/:id"
                                element={
                                  <ProtectedRoute>
                                    <PlaylistDetail />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="upload"
                                element={
                                  <ProtectedRoute>
                                    <Upload />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="profile"
                                element={
                                  <ProtectedRoute>
                                    <Profile />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="admin"
                                element={
                                  <ProtectedRoute>
                                    <AdminPanel />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="community"
                                element={
                                  <ProtectedRoute>
                                    <CommunityDiscovery />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="community/upload"
                                element={
                                  <ProtectedRoute>
                                    <CommunityUpload />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="admin/moderation"
                                element={
                                  <ProtectedRoute>
                                    <AdminModeration />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="settings/privacy"
                                element={
                                  <ProtectedRoute>
                                    <PrivacySettings />
                                  </ProtectedRoute>
                                }
                              />
                              <Route path="404" element={<NotFound />} />
                              <Route path="*" element={<Navigate to="/404" replace />} />
                            </Route>
                          </Routes>
                          </Suspense>
                          <ToastContainer />
                        </div>
                      </AppWrapper>
                    </Router>
                  </QueueProvider>
                </PlaybackProvider>
              </MusicProvider>
            </AuthProvider>
          </RetryBoundary>
        </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;