// Import necessary dependencies
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Container, 
  Paper,
  useMediaQuery,
  Theme,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Home as HomeIcon, 
  Explore as ExploreIcon 
} from '@mui/icons-material';
import { Post as PostType } from '../../types';
import PostCard from './PostCard';
import { useTheme } from '@mui/material/styles';
import { usePosts } from '../../contexts/PostContext';

// Feed component displays posts in an infinite scrolling feed
const Feed: React.FC = () => {
  // State for pagination and feed type
  const [page, setPage] = useState(1);
  const [feedType, setFeedType] = useState<'following' | 'explore'>('explore');
  const observer = useRef<IntersectionObserver | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  // Get posts data and methods from context
  const { posts, loading, error, feedMessage, fetchPosts } = usePosts();
  const [hasMore, setHasMore] = useState(true);
  const [localPosts, setLocalPosts] = useState<PostType[]>([]);

  // Load posts for current page and feed type
  const loadPosts = useCallback(async () => {
    try {
      console.log(`Fetching posts for feed type: ${feedType}, page: ${page}`);
      await fetchPosts(page, feedType);
      
      // Check if we have more posts to fetch based on response size
      if (posts.length === 0 || posts.length % 10 !== 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }, [page, feedType, fetchPosts, posts.length]);

  // Reset page when feed type changes
  useEffect(() => {
    setPage(1);
    // Also reset local posts when switching feed types
    setLocalPosts([]);
    
    // Immediately fetch posts for the new feed type
    const fetchInitialPosts = async () => {
      try {
        await fetchPosts(1, feedType);
      } catch (err) {
        console.error(`Error fetching initial posts for ${feedType}:`, err);
      }
    };
    
    fetchInitialPosts();
  }, [feedType, fetchPosts]);

  // Load posts when page changes (but not feed type)
  useEffect(() => {
    // Skip this effect when feed type changes to avoid duplicate fetches
    if (page !== 1) {
      loadPosts();
    }
  }, [page, loadPosts]);

  // Update local posts state for pagination
  useEffect(() => {
    if (posts.length > 0) {
      if (page === 1) {
        // Reset posts on first page
        setLocalPosts(posts);
      } else {
        // Add new posts while avoiding duplicates
        const newPosts = posts.filter(post => !localPosts.some(localPost => localPost.id === post.id));
        setLocalPosts(prev => [...prev, ...newPosts]);
      }
    }
  }, [posts, page]);

  // Intersection observer for infinite scroll
  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Handle post deletion
  const handleDelete = (postId: number) => {
    setLocalPosts(localPosts.filter(post => post.id !== postId));
  };

  // Handle feed type tab change
  const handleFeedTypeChange = (event: React.SyntheticEvent, newValue: 'following' | 'explore') => {
    setFeedType(newValue);
  };

  return (
    <Box sx={{ 
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fafafa', // Dark/light mode background
      minHeight: '100vh', // Full viewport height
      pt: 2, // Top padding
      pb: 8 // Bottom padding for mobile spacing
    }}>
      <Container maxWidth="sm" disableGutters={isMobile}>
        {/* Feed Type Tabs - Allows switching between Following and Explore feeds */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3,
            borderRadius: isMobile ? 0 : 2, // No border radius on mobile
            overflow: 'hidden',
            border: theme.palette.mode === 'dark' ? 'none' : '1px solid #eee', // Border only in light mode
          }}
        >
          <Tabs 
            value={feedType} 
            onChange={handleFeedTypeChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: '1px solid #eee' }}
          >
            <Tab 
              value="following" 
              label={isMobile ? undefined : "Following"} // Hide label on mobile
              icon={<HomeIcon />} 
              iconPosition={isMobile ? "top" : "start"} // Icon position changes on mobile
            />
            <Tab 
              value="explore" 
              label={isMobile ? undefined : "Explore"} // Hide label on mobile
              icon={<ExploreIcon />} 
              iconPosition={isMobile ? "top" : "start"} // Icon position changes on mobile
            />
          </Tabs>
        </Paper>
        
        {/* Empty state - Shown when no posts are available and not loading/error */}
        {(localPosts.length === 0 || (feedType === 'following' && posts.length === 0)) && !loading && !error && (
          <Paper 
            elevation={1} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: isMobile ? 0 : 2, // No border radius on mobile
              border: theme.palette.mode === 'dark' ? 'none' : '1px solid #eee', // Border only in light mode
              mb: 3
            }}
          >
            <Typography variant="h6" gutterBottom>
              {feedType === 'following' ? 'Your following feed is empty' : 'No posts available'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {feedType === 'following' 
                ? (feedMessage || 'You are not following anyone yet. Follow users to see their posts in your feed!') 
                : 'Check back later for new content to explore.'}
            </Typography>
            
            {feedType === 'following' && (
              <Box 
                sx={{ 
                  mt: 3, 
                  p: 2, 
                  backgroundColor: 'primary.main', 
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                  }
                }}
                onClick={() => setFeedType('explore')}
              >
                <Typography variant="body2" fontWeight="medium">
                  Switch to Explore to discover and follow users
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Error state - Displays error message with refresh suggestion */}
        {error && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: isMobile ? 0 : 2, // No border radius on mobile
              border: theme.palette.mode === 'dark' ? 'none' : '1px solid #eee', // Border only in light mode
            }}
          >
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please try refreshing the page.
            </Typography>
          </Paper>
        )}

        {/* Posts feed - Instagram style single column layout */}
        {!(feedType === 'following' && posts.length === 0) && (
          <Box sx={{ width: '100%' }}>
            {localPosts.map((post, index) => (
              <Box 
                key={post.id}
                sx={{ 
                  width: '100%', 
                  mb: 3, // Margin between posts
                  borderRadius: isMobile ? 0 : 1, // No border radius on mobile
                  overflow: 'hidden',
                  backgroundColor: theme.palette.background.paper,
                  border: theme.palette.mode === 'dark' ? 'none' : '1px solid #dbdbdb' // Border only in light mode
                }}
              >
                {/* Last post gets ref for infinite scroll */}
                {localPosts.length === index + 1 ? (
                  <div ref={lastPostElementRef}>
                    <PostCard 
                      post={post} 
                      onDelete={handleDelete}
                    />
                  </div>
                ) : (
                  <PostCard 
                    post={post} 
                    onDelete={handleDelete}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Loading spinner - Shown while fetching posts */}
        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}
        
        {/* End of feed message - Shown when all posts are loaded */}
        {localPosts.length > 0 && !hasMore && !loading && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">You've seen all posts</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Feed;