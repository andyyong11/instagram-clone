// Import necessary dependencies
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { useAuth } from './contexts/AuthContext';
import theme from './theme';

// Import components
import Navigation from './components/layout/Navigation';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Feed from './components/posts/Feed';
import ProfilePage from './components/profile/ProfilePage';
import CreatePost from './components/posts/CreatePost';
import SettingsPage from './components/profile/SettingsPage';
import ExplorePage from './components/explore/ExplorePage';
import ActivityPage from './components/activity/ActivityPage';
import PostModal from './components/posts/PostModal';

// Post Detail wrapper component that handles modal display and navigation
const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [open, setOpen] = useState(true);
  const postId = parseInt(id || '0', 10);
  
  return (
    <PostModal 
      postId={postId} 
      open={open} 
      onClose={() => {
        setOpen(false);
        // Navigate back after closing modal
        window.history.back();
      }} 
    />
  );
};

// Protected Route component that handles auth checking and redirection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Main App component that sets up routing and global providers
const App = () => {
  // Effect to handle URL changes with refresh parameters
  useEffect(() => {
    const handleUrlChange = () => {
      // Check for refresh parameter in URL
      if (window.location.search.includes('refresh=')) {
        console.log('URL contains refresh parameter, preloading images...');
        
        // Force reload of all images by adding cache buster
        const allImages = Array.from(document.getElementsByTagName('img'));
        allImages.forEach(img => {
          const originalSrc = img.src;
          const cacheBuster = originalSrc.includes('?') 
            ? `&refresh=${Date.now()}` 
            : `?refresh=${Date.now()}`;
          img.src = originalSrc + cacheBuster;
          
          console.log(`Refreshing image: ${img.src}`);
        });
        
        // Remove refresh parameter to prevent loops
        const newUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, newUrl);
      }
    };
    
    // Run once on mount
    handleUrlChange();
    
    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PostProvider>
          <Router>
            <Navigation />
            <Routes>
              {/* Protected routes that require authentication */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post/:id"
                element={
                  <ProtectedRoute>
                    <PostDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <ProtectedRoute>
                    <ExplorePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <ActivityPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Public routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
            </Routes>
          </Router>
        </PostProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

export default App;
