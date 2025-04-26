// Import necessary dependencies
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Grid,
  Typography, 
  CircularProgress,
  Paper
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { userService, postService } from '../../services/api';
import { User, Post } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PostModal from '../posts/PostModal';
import { 
  BrokenImage as BrokenImageIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import ProfileHeader from './ProfileHeader';
import UserAvatar from '../common/UserAvatar';
import { format, isValid, parseISO } from 'date-fns';
import { useSnackbar } from 'notistack';
import { appStyles } from '../../styles/AppStyles';

// Helper function to format dates
// Takes a date string and returns a formatted string based on how long ago it was:
// - Less than 1 hour: "Xm" (minutes)
// - Less than 24 hours: "Xh" (hours) 
// - Otherwise: "MMM d" (e.g. "Jan 1")
const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return format(date, 'MMM d');
    }
  } catch (error) {
    return '';
  }
};

// Main profile page component that displays a user's profile and posts
const ProfilePage: React.FC = () => {
  // Get profile ID from URL params
  const { id } = useParams<{ id: string }>();
  
  // Get current authenticated user
  const { user } = useAuth();

  // State management
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postImageErrors, setPostImageErrors] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  // Profile stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  
  // Cache reference to prevent duplicate loads
  const ref = useRef<string | null>(null);
  
  // Snackbar notifications
  const { enqueueSnackbar } = useSnackbar();

  // Fetch user profile data when profile ID changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setPosts([]);
        setPage(1);
        setHasMore(true);
        
        if (id) {
          const userData = await userService.getProfile(parseInt(id));
          
          // Ensure followers count exists
          if (userData.followersCount === undefined || userData.followersCount === null) {
            userData.followersCount = 0;
          }
          
          setProfile(userData);
          
          // Determine if current user is following this profile
          if (user) {
            if (userData.isFollowedByMe !== undefined && userData.isFollowedByMe !== null) {
              setIsFollowing(Boolean(userData.isFollowedByMe));
            } else if (userData.followers) {
              const isFollowingUser = userData.followers.some(
                (follower: any) => follower.id === user.id
              );
              setIsFollowing(isFollowingUser);
            }
          } else {
            setIsFollowing(false);
          }
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, user]);

  // Reset page and posts when profile changes
  useEffect(() => {
    if (!loading && profile) {
      setPage(1);
      setPosts([]);
      setHasMore(true);
    }
  }, [id]);

  // Fetch posts with pagination support
  const fetchPosts = useCallback(async (reload: boolean = false) => {
    if (loadingMorePosts || (!hasMore && !reload)) return;
    
    try {
      setLoadingMorePosts(true);
      
      const pageToFetch = reload ? 1 : page;
      
      if (reload) {
        setPosts([]);
        setPage(1);
        setHasMore(true);
      }
      
      const response = await userService.getUserPosts(parseInt(id || '0'), pageToFetch);
      
      if (response && response.posts && response.posts.length > 0) {
        if (!reload) {
          // Add new posts while avoiding duplicates
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = response.posts.filter((p: Post) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(response.posts);
        }
        setPage(prev => prev + 1);
        setHasMore(response.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setError('Failed to load posts');
    } finally {
      setLoadingMorePosts(false);
    }
  }, [id, page, hasMore, loadingMorePosts]);

  // Handle initial post loading and profile changes
  useEffect(() => {
    if (profile && !loading && !loadingMorePosts) {
      const currentProfileId = parseInt(id || '0');
      const loadId = `profile-${currentProfileId}`;
      
      // Check if we've already loaded posts for this profile
      const alreadyLoaded = ref.current === loadId;
      if (!alreadyLoaded) {
        ref.current = loadId;
        fetchPosts(true);
      }
    }
  }, [profile, loading, loadingMorePosts, fetchPosts, id]);

  // Infinite scroll implementation using Intersection Observer
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMorePosts) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMorePosts, hasMore]
  );

  // Handle follow/unfollow user action
  const handleFollowToggle = async () => {
    if (!id || !user) return;
    
    try {
      let response: { 
        isFollowing?: boolean; 
        followersCount?: number; 
        followers_count?: number;
      } | undefined;
      
      if (isFollowing) {
        response = await userService.unfollowUser(id);
      } else {
        response = await userService.followUser(id);
      }
      
      setIsFollowing(response?.isFollowing === true);
      
      // Update followers count based on response or fallback to increment/decrement
      if (response && (response.followersCount !== undefined || response.followers_count !== undefined)) {
        const count = response.followersCount !== undefined ? response.followersCount : (response.followers_count || 0);
        setFollowersCount(count);
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            followersCount: count,
            isFollowedByMe: response?.isFollowing === true
          };
        });
      } else {
        const newCount = isFollowing 
          ? (followersCount > 0 ? followersCount - 1 : 0)
          : followersCount + 1;
        
        setFollowersCount(newCount);
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            followersCount: newCount,
            isFollowedByMe: !isFollowing
          };
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update follow status';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      refreshProfile();
    }
  };

  // Handle post click to open modal
  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedPostId(null), 300);
  };

  // Handle post image load errors
  const handleImageError = (postId: number) => {
    setPostImageErrors(prev => ({ ...prev, [postId]: true }));
  };

  // Refresh profile data and posts
  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getProfile(parseInt(id || '0'), Date.now());
      
      const profileData = response.user || response;
      
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          _cache: Date.now()
        };
        
        setProfile(updatedProfile);
        setIsFollowing(profileData.isFollowedByMe);
        setPostsCount(profileData.postsCount || 0);
        setFollowersCount(profileData.followersCount || 0);
        setFollowingCount(profileData.followingCount || 0);
        
        fetchPosts(true);
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id, fetchPosts]);

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <Box sx={appStyles.profile.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state if profile failed to load
  if (error || !profile) {
    return (
      <Container maxWidth="sm">
        <Paper sx={appStyles.profile.errorPaper}>
          <Typography variant="h6" color="error">
            {error || 'User not found'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  const isCurrentUser = user?.id === parseInt(id!);
  const userId = parseInt(id!);

  return (
    <Container maxWidth="md">
      {/* Profile header with user info and follow button */}
      <ProfileHeader 
        profile={profile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        isCurrentUser={isCurrentUser}
        onRefresh={refreshProfile}
      />
      
      {/* Grid of user's posts */}
      <Box sx={appStyles.profile.postsGrid}>
        {posts.map((post, index) => (
          <Box
            key={`post-${post.id}-${index}`}
            ref={index === posts.length - 1 ? lastPostElementRef : undefined}
            sx={appStyles.profile.postItem}
            onClick={() => handlePostClick(post.id)}
          >
            {postImageErrors[post.id] ? (
              // Show error state for failed images
              <Box sx={appStyles.profile.errorImageContainer}>
                <BrokenImageIcon fontSize="large" color="disabled" sx={appStyles.profile.errorIcon} />
                <Typography variant="body2" color="text.secondary">
                  Image could not be loaded
                </Typography>
              </Box>
            ) : (
              <>
                {/* Post image */}
                <Box sx={appStyles.profile.imageContainer}>
                  <img
                    src={post.image}
                    alt={`Post by ${post.user?.username || 'user'}`}
                    onError={() => handleImageError(post.id)}
                    style={appStyles.profile.postImageStyle as React.CSSProperties}
                  />
                </Box>
                {/* Post details overlay */}
                <Box sx={appStyles.profile.postDetails}>
                  <Typography 
                    variant="body2" 
                    sx={appStyles.profile.postCaption}
                  >
                    {post.caption || 'No caption'}
                  </Typography>
                  <Box sx={appStyles.profile.postStats}>
                    <Box sx={appStyles.profile.likesContainer}>
                      <FavoriteIcon sx={appStyles.profile.likeIcon} />
                      <Typography variant="caption" color="text.secondary">{post.likesCount || 0}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        ))}
      </Box>
      
      {/* Loading indicator for pagination */}
      {loadingMorePosts && (
        <Box sx={appStyles.profile.loadingMoreContainer}>
          <CircularProgress size={40} />
        </Box>
      )}
      
      {/* Empty state when no posts exist */}
      {posts.length === 0 && !loadingMorePosts && (
        <Box sx={appStyles.profile.emptyContainer}>
          <Typography variant="h6" color="text.secondary">
            No posts yet
          </Typography>
        </Box>
      )}
      
      {/* Post detail modal */}
      {selectedPostId && (
        <PostModal
          open={modalOpen}
          onClose={handleCloseModal}
          postId={selectedPostId}
        />
      )}
    </Container>
  );
};

export default ProfilePage;