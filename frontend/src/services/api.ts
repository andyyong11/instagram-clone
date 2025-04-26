import axios from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, CreatePostData } from '../types';

// Update API URL to match the backend server port
const API_URL = 'http://localhost:3000/api';
// Set a base URL for media assets like images
export const MEDIA_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Debug the token being sent
    console.log('Sending authorization token:', `Bearer ${token.substring(0, 15)}...`);
  }
  return config;
});

// Add response interceptor to handle 401 errors better
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Create a more descriptive error message based on the response
    if (error.response) {
      // Log the error details for debugging
      console.error('API Error:', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data
      });

      // Handle unauthorized errors gracefully
      if (error.response.status === 401) {
        console.error('Authentication error. Your session might have expired.');
        
        // Only logout automatically on non-auth endpoints
        const isAuthEndpoint = error.config.url.includes('/auth/');
        const isFileUpload = error.config.headers['Content-Type']?.includes('multipart/form-data');
        
        // Don't trigger automatic logout for file uploads or auth endpoints
        if (!isAuthEndpoint && !isFileUpload) {
          // Import localStorage directly to avoid circular dependencies
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Don't redirect immediately during file uploads
          if (window.location.pathname !== '/login') {
            alert('Your session has expired. Please log in again.');
            window.location.href = '/login';
          }
        }
      }
    } else {
      console.error('Network Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },
};

export const postService = {
  create: async (data: CreatePostData): Promise<any> => {
    console.log('Creating new post with data:', { caption: data.caption, imageSize: data.image?.size });
    
    try {
      const formData = new FormData();
      formData.append('caption', data.caption);
      formData.append('image', data.image);

      // Add additional safeguards for token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found when creating post');
        throw new Error('You must be logged in to create a post');
      }

      // Special headers for file uploads
      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        // Don't timeout early for uploads
        timeout: 60000, // 60 seconds
      });
      
      console.log('Post created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in post creation:', error);
      
      // Provide more detailed error messages
      if (error.response) {
        if (error.response.status === 401) {
          console.error('Authentication failed during post creation');
          throw new Error('Your session has expired. Please log in again.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw error;
    }
  },

  getAll: async (page = 1, feedType = 'explore'): Promise<any> => {
    console.log(`Getting posts for feed type: ${feedType}, page: ${page}`);
    const response = await api.get(`/posts?page=${page}&feed_type=${feedType}`);
    console.log(`Received ${response.data.posts?.length || 0} posts for feed type: ${feedType}`);
    
    // Remove debug logs
    return response.data;
  },

  get: async (postId: number): Promise<any> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  like: async (postId: number): Promise<any> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  unlike: async (postId: number): Promise<any> => {
    const response = await api.post(`/posts/${postId}/unlike`);
    return response.data;
  },
  
  delete: async (postId: number): Promise<any> => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  }
};

export const commentService = {
  getAll: async (postId: number): Promise<any> => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },
  
  create: async (postId: number, content: string): Promise<any> => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  update: async (postId: number, commentId: number, content: string): Promise<any> => {
    const response = await api.put(`/posts/${postId}/comments/${commentId}`, { content });
    return response.data;
  },

  delete: async (postId: number, commentId: number): Promise<any> => {
    try {
      console.log(`Attempting to delete comment with ID ${commentId} from post ${postId}`);
      const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
      console.log('Comment deletion successful:', response.status);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting comment ID ${commentId} from post ID ${postId}:`, error);
      
      // Log the response details if available
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      // Provide better error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.status === 404) {
          throw new Error('Comment not found. It may have been already deleted.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error(`Failed to delete comment: ${error.message || 'Unknown error'}`);
    }
  },
  
  deleteComment: async (commentId: string): Promise<any> => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      // Provide better error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error(`Failed to delete comment: ${error.message || 'Unknown error'}`);
    }
  }
};

export const userService = {
  getProfile: async (userId: number, timestamp?: number): Promise<any> => {
    try {
      // Always use a timestamp parameter to prevent caching of profile data
      const cacheParam = `?t=${timestamp || Date.now()}`;
      console.log(`Fetching profile for user ${userId} with cache-busting parameter t=${timestamp || Date.now()}`);
      
      const response = await api.get(`/users/${userId}${cacheParam}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('Profile API URL requested:', `/users/${userId}${cacheParam}`);
      
      // Log the profile picture data
      if (response.data) {
        console.log('Profile picture URLs in response:');
        console.log('- profile_picture:', response.data.profile_picture);
        console.log('- profile_picture_url:', response.data.profile_picture_url);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  getUserPosts: async (userId: number, page = 1): Promise<any> => {
    const response = await api.get(`/users/${userId}/posts?page=${page}`);
    return response.data;
  },

  updateProfile: async (userIdOrFormData: number | FormData, profileData?: any) => {
    try {
      let response;
      
      // Check if first parameter is a FormData object (for profile picture uploads)
      if (userIdOrFormData instanceof FormData) {
        // Handle FormData case (profile picture upload)
        const formData = userIdOrFormData;
        
        // Get token explicitly to ensure it's fresh
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found when updating profile');
          throw new Error('You must be logged in to update your profile');
        }
        
        // Make the request with explicit content type and cache headers
        response = await api.put(
          `/users/profile`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Authorization': `Bearer ${token}`,
            },
            timeout: 60000, // 60 seconds for uploads
          }
        );
      } else {
        // Handle normal profile update with userId and profileData
        const userId = userIdOrFormData;
        response = await api.put(`/users/${userId}`, profileData);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Provide better error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      // Rethrow with more context
      if (error instanceof Error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }
      throw error;
    }
  },
  
  follow: async (userId: number) => {
    // Use the enhanced followUser function
    return userService.followUser(userId);
  },
  
  // Enhanced function that handles both string and number userIds
  followUser: async (userId: string | number) => {
    try {
      console.log(`Attempting to follow user ${userId}`);
      
      // Retry mechanism for follow action (maximum 2 retries)
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const response = await api.post(`/users/${userId}/follow`);
          console.log(`Successfully followed user ${userId}. New follower count:`, response.data.followersCount);
          return {
            ...response.data,
            followers_count: response.data.followersCount, // For backward compatibility
            followersCount: response.data.followersCount || response.data.followers_count
          };
        } catch (error: any) {
          if (retries === maxRetries) throw error;
          
          console.warn(`Follow attempt ${retries + 1} failed, retrying...`);
          retries++;
          // Wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error: any) {
      console.error('Error following user:', error);
      
      // Provide better error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.status === 400) {
          throw new Error('Cannot follow this user.');
        } else if (error.response.status === 404) {
          throw new Error('User not found.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error(`Failed to follow user: ${error.message || 'Unknown error'}`);
    }
  },
  
  unfollow: async (userId: number) => {
    // Use the enhanced unfollowUser function
    return userService.unfollowUser(userId);
  },
  
  // Enhanced function that handles both string and number userIds
  unfollowUser: async (userId: string | number) => {
    try {
      console.log(`Attempting to unfollow user ${userId}`);
      
      // Retry mechanism for unfollow action (maximum 2 retries)
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const response = await api.post(`/users/${userId}/unfollow`);
          console.log(`Successfully unfollowed user ${userId}. New follower count:`, response.data.followersCount);
          return {
            ...response.data,
            followers_count: response.data.followersCount, // For backward compatibility
            followersCount: response.data.followersCount || response.data.followers_count
          };
        } catch (error: any) {
          if (retries === maxRetries) throw error;
          
          console.warn(`Unfollow attempt ${retries + 1} failed, retrying...`);
          retries++;
          // Wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      
      // Provide better error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (error.response.status === 400) {
          throw new Error('Cannot unfollow this user.');
        } else if (error.response.status === 404) {
          throw new Error('User not found.');
        } else if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        }
      }
      
      throw new Error(`Failed to unfollow user: ${error.message || 'Unknown error'}`);
    }
  },
};

export const activityService = {
  getAll: async (): Promise<any> => {
    const response = await api.get('/activities');
    return response.data;
  },
  
  getLikes: async (): Promise<any> => {
    const response = await api.get('/activities/likes');
    return response.data;
  },
  
  getComments: async (): Promise<any> => {
    const response = await api.get('/activities/comments');
    return response.data;
  },
  
  getFollows: async (): Promise<any> => {
    const response = await api.get('/activities/follows');
    return response.data;
  }
};

export default api; 