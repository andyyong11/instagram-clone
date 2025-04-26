import React, { createContext, useContext, useState, useCallback } from 'react';
import { Post, Comment } from '../types';
import { postService, commentService } from '../services/api';

// Define the shape of our context
interface PostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  feedMessage: string | null;
  fetchPosts: (page?: number, feedType?: string) => Promise<void>;
  likePost: (postId: number) => Promise<void>;
  unlikePost: (postId: number) => Promise<void>;
  addComment: (postId: number, content: string) => Promise<Comment>;
  deletePost: (postId: number) => Promise<void>;
}

// Create the context with a default value
const PostContext = createContext<PostContextType | undefined>(undefined);

// Provider component
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedMessage, setFeedMessage] = useState<string | null>(null);

  // Fetch posts with pagination
  const fetchPosts = useCallback(async (page = 1, feedType = 'explore') => {
    try {
      setLoading(true);
      setError(null);
      setFeedMessage(null);
      
      const response = await postService.getAll(page, feedType);
      
      // Store any message from the API
      if (response.message) {
        setFeedMessage(response.message);
      }
      
      if (page === 1) {
        // Replace posts for first page
        setPosts(response.posts || []);
      } else {
        // Append posts for subsequent pages
        setPosts(prev => [...prev, ...(response.posts || [])]);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Like a post
  const likePost = useCallback(async (postId: number) => {
    try {
      const response = await postService.like(postId);
      
      // Update post in state
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likedByMe: true, likesCount: response.likesCount || post.likesCount + 1 } 
            : post
        )
      );
      
      return response;
    } catch (err) {
      console.error('Error liking post:', err);
      throw err;
    }
  }, []);

  // Unlike a post
  const unlikePost = useCallback(async (postId: number) => {
    try {
      const response = await postService.unlike(postId);
      
      // Update post in state
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likedByMe: false, likesCount: response.likesCount || Math.max(0, post.likesCount - 1) } 
            : post
        )
      );
      
      return response;
    } catch (err) {
      console.error('Error unliking post:', err);
      throw err;
    }
  }, []);

  // Add a comment to a post
  const addComment = useCallback(async (postId: number, content: string): Promise<Comment> => {
    try {
      const comment = await commentService.create(postId, content);
      
      // Update post in state to increment comment count
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, commentsCount: post.commentsCount + 1 } 
            : post
        )
      );
      
      return comment;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, []);

  // Delete a post
  const deletePost = useCallback(async (postId: number) => {
    try {
      await postService.delete(postId);
      
      // Remove post from state
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  }, []);

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        error,
        feedMessage,
        fetchPosts,
        likePost,
        unlikePost,
        addComment,
        deletePost
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

// Custom hook to use the post context
export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};

export default PostContext; 