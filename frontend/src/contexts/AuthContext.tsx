// Import necessary React hooks and types
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types';
import { authService, userService } from '../services/api';

// Define the shape of our auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: (userId: number) => Promise<User | undefined>;
  forceRefresh: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component that wraps the app and provides auth state/functions
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a stored token and validate it
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      
      // Validate token expiration by decoding JWT
      try {
        // JWT tokens consist of three parts: header.payload.signature
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        
        const { exp } = JSON.parse(jsonPayload);
        const expirationTime = exp * 1000; // Convert to milliseconds
        
        if (Date.now() >= expirationTime) {
          console.warn('Token is expired, logging out...');
          logout();
        } else {
          console.log('Token is valid until:', new Date(expirationTime).toLocaleString());
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
      
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Handle user login
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true);
    try {
      const response = await authService.login(credentials);
      
      // Debug log of user data returned from backend
      console.log('User data received from login:', JSON.stringify(response.user, null, 2));
      console.log('Profile picture fields:', {
        profilePicture: response.user.profilePicture,
        profile_picture: response.user.profile_picture,
        profile_picture_url: response.user.profile_picture_url,
        avatar: response.user.avatar
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user registration
  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authService.register(credentials);
      if (response.status === 'success') {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Extract error message from Axios error if available
      let errorMessage = 'Registration failed';
      if (error.response && error.response.data) {
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors.join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      throw new Error(errorMessage);
    }
  };

  // Handle user logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Force a complete refresh of the application
  const forceRefresh = () => {
    console.log('Forcing complete app refresh...');
    // Clear browser cache and then reload
    window.location.href = window.location.href.split('?')[0] + '?refresh=' + new Date().getTime();
  };

  // Refresh user data from the server
  const refreshUser = async (userId: number) => {
    try {
      console.log('Refreshing user data for ID:', userId);
      
      // Check if we have a token before attempting to refresh
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Cannot refresh user: No authentication token found');
        throw new Error('Authentication token is missing');
      }
      
      // Add a timestamp to force cache invalidation
      const timestamp = Date.now();
      const response = await userService.getProfile(userId, timestamp);
      
      // Debug response
      console.log('User refresh response:', response);
      
      // Create a fresh user object
      let updatedUser: User | null = null;
      
      if (response.status === 'success' && response.user) {
        updatedUser = { 
          ...user,  // Start with current user data
          ...response.user,  // Override with new data from the response
          _cache: timestamp  // Add a cache key to force re-renders
        } as User;
      } else if (response && user) {
        updatedUser = { 
          ...user,
          _cache: timestamp  // Add a cache key to force re-renders
        } as User;
        
        // Map profile picture fields explicitly
        if (response.profile_picture) {
          updatedUser.profile_picture = `${response.profile_picture}?t=${timestamp}`;
          updatedUser.profilePicture = `${response.profile_picture}?t=${timestamp}`;
        }
        
        if (response.profile_picture_url) {
          updatedUser.profile_picture_url = `${response.profile_picture_url}?t=${timestamp}`;
          updatedUser.profilePicture = `${response.profile_picture_url}?t=${timestamp}`;
        }
        
        // Map any other fields that may be in the response
        Object.keys(response).forEach(key => {
          if (response[key] !== undefined) {
            (updatedUser as any)[key] = response[key];
          }
        });
      }
      
      if (updatedUser) {
        console.log('Updating user in context:', updatedUser);
        
        // Ensure all profile picture fields are synchronized
        if (updatedUser.profilePicture || updatedUser.profile_picture || updatedUser.profile_picture_url) {
          const pictureUrl = updatedUser.profilePicture || updatedUser.profile_picture || updatedUser.profile_picture_url || '';
          // Add a cache-busting parameter
          const pictureUrlWithTimestamp = pictureUrl.includes('?') 
            ? `${pictureUrl}&t=${timestamp}` 
            : `${pictureUrl}?t=${timestamp}`;
            
          updatedUser.profilePicture = pictureUrlWithTimestamp;
          updatedUser.profile_picture = pictureUrlWithTimestamp;
          updatedUser.profile_picture_url = pictureUrlWithTimestamp;
          updatedUser.avatar = pictureUrlWithTimestamp;
        }
        
        // Preload the image to force browsers to clear any cached versions
        if (updatedUser.profilePicture) {
          const img = new Image();
          img.src = updatedUser.profilePicture;
          console.log('Preloading user avatar:', img.src);
        }
        
        // Save to localStorage and update state
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Don't force a complete refresh automatically anymore
        // as this might interrupt user activities
        return updatedUser;
      }
    } catch (error: any) {
      console.error('Failed to refresh user data:', error);
      
      // Only consider 401 errors as auth failures
      if (error.response && error.response.status === 401) {
        console.warn('Authentication expired during user refresh');
        // Don't automatically logout or redirect
      }
      
      throw error;
    }
  };

  // Provide auth context to children components
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      refreshUser,
      forceRefresh 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 