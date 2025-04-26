import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  CircularProgress, 
  useMediaQuery,
  Theme
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { postService } from '../../services/api';
import { Post } from '../../types';
import PostModal from '../posts/PostModal';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';

const ExplorePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postImageErrors, setPostImageErrors] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const fetchExplorePosts = useCallback(async () => {
    try {
      if (!hasMore) return;
      
      setLoading(true);
      // Get posts from the API with pagination
      const response = await postService.getAll(page);
      console.log('Explore posts data received:', response);
      
      if (response && response.posts) {
        if (page === 1) {
          // Shuffle posts for explore page if it's the first page
          const shuffledPosts = [...response.posts].sort(() => Math.random() - 0.5);
          setPosts(shuffledPosts);
        } else {
          // Append posts for subsequent pages
          setPosts(prevPosts => [...prevPosts, ...response.posts]);
        }
        
        // Check if there are more posts to load
        setHasMore(response.hasMore || false);
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching explore posts:', err);
      setError('Failed to load explore content');
    } finally {
      setLoading(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    fetchExplorePosts();
  }, [fetchExplorePosts]);

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

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedPostId(null), 300);
  };

  const handleImageError = (postId: number) => {
    console.error(`Failed to load image for post ${postId}`);
    setPostImageErrors(prev => ({ ...prev, [postId]: true }));
  };

  if (loading && posts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && posts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 3 }}>
      <Container maxWidth="md">
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Explore
        </Typography>
        
        {posts.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Typography color="textSecondary">No posts to explore yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2px'
            }
          }}>
            {posts.map((post, index) => (
              <Box 
                key={post.id}
                ref={posts.length === index + 1 ? lastPostElementRef : undefined}
                onClick={() => handlePostClick(post.id)}
                sx={{
                  position: 'relative',
                  paddingTop: '100%', // 1:1 Aspect ratio
                  overflow: 'hidden',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  '&:hover': {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }
                  }
                }}
              >
                {post.image && !postImageErrors[post.id] ? (
                  <Box
                    component="img"
                    src={post.image}
                    alt={post.caption}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={() => handleImageError(post.id)}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <BrokenImageIcon color="disabled" sx={{ fontSize: 40 }} />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
        
        {/* Loading indicator for pagination */}
        {loading && posts.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        )}
        
        {/* End of posts message */}
        {posts.length > 0 && !hasMore && !loading && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">You've seen all posts</Typography>
          </Box>
        )}
      </Container>

      {/* Post Modal */}
      <PostModal
        postId={selectedPostId}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </Box>
  );
};

export default ExplorePage; 