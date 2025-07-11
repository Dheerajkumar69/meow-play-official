import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MusicProvider } from './contexts/MusicContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AppInitializer from './components/AppInitializer';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import LikedSongs from './pages/LikedSongs';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Trending from './pages/Trending';
import Discover from './pages/Discover';
import PlaylistDetail from './pages/PlaylistDetail';
import AdminPanel from './components/AdminPanel';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MusicProvider>
          <AppInitializer>
            <Router>
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
                <Route path="404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Route>
              </Routes>
            </Router>
          </AppInitializer>
        </MusicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;