import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  ListItemAvatar,
  DialogActions,
  DialogTitle,
  ListItemIcon,
  ListItemText,
  InputBase
} from '@mui/material';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Close as CloseIcon,
  BrokenImage as BrokenImageIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { Post, Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
import { postService, commentService, MEDIA_URL } from '../../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import { timeAgo } from '../../utils/dateUtils';
import { useSnackbar } from 'notistack';

interface PostModalProps {
  postId: number | null;
  open: boolean;
  onClose: () => void;
}

// Base64 encoded small gray placeholder image
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAANElEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAN1+AABVhDU2QAAAABJRU5ErkJggg==';

// Helper function to format image URLs correctly
const formatImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) {
    return PLACEHOLDER_IMAGE;
  }
  
  try {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it contains object representation (likely an error)
    if (imageUrl.includes('#ActionDispatch') || imageUrl.includes('::')) {
      console.warn('Received invalid image path in PostModal:', imageUrl);
      return PLACEHOLDER_IMAGE;
    }
    
    // If it starts with a slash, append to MEDIA_URL
    if (imageUrl.startsWith('/')) {
      return `${MEDIA_URL}${imageUrl}`;
    }
    
    // Otherwise append with a slash
    return `${MEDIA_URL}/${imageUrl}`;
  } catch (error) {
    console.error('Error formatting image URL in PostModal:', error);
    return PLACEHOLDER_IMAGE;
  }
};

const PostModal: React.FC<PostModalProps> = ({ postId, open, onClose }) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [postMenuAnchorEl, setPostMenuAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { likePost, unlikePost, addComment, deletePost } = usePosts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteCommentInProgress, setDeleteCommentInProgress] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Check if the current user is the post owner
  const isPostOwner = user && post && user.id === post.user.id;

  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId || !open) return;
      
      try {
        setLoading(true);
        setImageError(false);
        const postData = await postService.get(postId);
        console.log('Fetched post data:', postData);
        setPost(postData);
        
        const commentsData = await commentService.getAll(postId);
        setComments(commentsData);
      } catch (err) {
        console.error('Error fetching post details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId, open]);

  const handleLikeToggle = async () => {
    if (!post || !user) return;
    
    try {
      if (post.likedByMe) {
        await unlikePost(post.id);
        setPost(prev => prev ? { 
          ...prev, 
          likedByMe: false,
          likesCount: prev.likesCount - 1 
        } : null);
      } else {
        await likePost(post.id);
        setPost(prev => prev ? { 
          ...prev, 
          likedByMe: true,
          likesCount: prev.likesCount + 1 
        } : null);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim() || !user) return;
    
    setCommentLoading(true);
    try {
      const comment = await commentService.create(post.id, newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // Update comment count on post
      setPost(prev => prev ? {
        ...prev,
        commentsCount: prev.commentsCount + 1
      } : null);
    } catch (err) {
      console.error('Error posting comment:', err);
      enqueueSnackbar('Failed to post comment. Please try again.', { variant: 'error' });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load image:', e.currentTarget.src);
    e.currentTarget.src = PLACEHOLDER_IMAGE;
    setImageError(true);
  };

  const handleUserClick = (userId?: number) => {
    if (!userId && post?.user?.id) {
      userId = post.user.id;
    }
    
    if (userId) {
      console.log(`Navigating to user profile from modal: ${userId}`);
      onClose(); // Close the modal first
      navigate(`/profile/${userId}`); // Then navigate to the profile
    } else {
      console.warn('Unable to navigate to profile: No user ID provided');
    }
  };

  const handleCommentMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
    event.stopPropagation();
    console.log('Opening comment menu for comment ID:', commentId, 'type:', typeof commentId);
    setCommentMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const closeCommentMenu = (keepSelectedId = false) => {
    console.log('Closing comment menu, keepSelectedId:', keepSelectedId, 'selectedCommentId:', selectedCommentId);
    setCommentMenuAnchorEl(null);
    if (!keepSelectedId) {
      setSelectedCommentId(null);
    }
  };

  const handleCommentMenuClose = () => {
    closeCommentMenu(false);
  };

  const handleCommentDialogClose = () => {
    console.log('Closing comment dialog via backdrop/escape');
    setDeleteCommentDialogOpen(false);
    // Keep the selectedCommentId intact
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    console.log('Opening post menu');
    setPostMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    console.log('Closing post menu');
    setPostMenuAnchorEl(null);
  };

  const handleDeletePostClick = () => {
    console.log('Delete post clicked');
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeletePostCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    try {
      setDeleteInProgress(true);
      await deletePost(post.id);
      setDeleteDialogOpen(false);
      onClose();
      navigate('/');
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDeleteCommentClick = () => {
    console.log('Delete comment clicked for comment ID:', selectedCommentId);
    closeCommentMenu(true); // Close the menu but keep selectedCommentId
    setDeleteCommentDialogOpen(true);
  };

  const handleDeleteCommentCancel = () => {
    setDeleteCommentDialogOpen(false);
    // Don't reset selectedCommentId here to preserve it for the delete action
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentId || !post) {
      console.error('Cannot delete comment: selectedCommentId or post is null', { 
        selectedCommentId, 
        postId: post?.id 
      });
      return;
    }
    
    try {
      setDeleteCommentInProgress(true);
      console.log('Deleting comment:', selectedCommentId, 'type:', typeof selectedCommentId);
      console.log('Post ID:', post.id, 'type:', typeof post.id);
      
      // First close the dialog to improve perceived performance
      setDeleteCommentDialogOpen(false);
      
      // Get token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Use the native fetch API as a fallback
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}/comments/${selectedCommentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }
      
      console.log('Delete comment response status:', response.status);
      
      // Update comments by filtering out the deleted comment
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== selectedCommentId)
      );
      
      // Update comment count on post
      setPost(prevPost => {
        if (!prevPost) return null;
        return {
          ...prevPost,
          commentsCount: Math.max((prevPost.commentsCount || 0) - 1, 0)
        };
      });
      
      // Only clear selectedCommentId after successful deletion
      setSelectedCommentId(null);
      
      enqueueSnackbar('Comment deleted successfully', { variant: 'success' });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      
      setDeleteCommentDialogOpen(false);
      enqueueSnackbar('Failed to delete comment: ' + (error.message || 'Unknown error'), { variant: 'error' });
    } finally {
      setDeleteCommentInProgress(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg">
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg"
        PaperProps={{
          sx: { 
            borderRadius: 1,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            overflow: 'hidden',
            maxHeight: '90vh'
          }
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="close"
          sx={{
            position: 'absolute',
            left: 12,
            top: 12,
            zIndex: 15,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: { sm: '85vh' } }}>
            {/* Left side - Image */}
            <Box sx={{ 
              bgcolor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: '100%', sm: '65%' },
              maxHeight: { xs: '50vh', sm: '85vh' },
              position: 'relative'
            }}>
              {imageError ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 3,
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <BrokenImageIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography align="center">
                    Image couldn't be loaded
                  </Typography>
                </Box>
              ) : (
                <Box 
                  component="img"
                  src={formatImageUrl(post.image)}
                  alt={post.caption}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxHeight: { xs: '50vh', sm: '85vh' }
                  }}
                  onError={handleImageError}
                />
              )}
            </Box>
            
            {/* Right side - Info & Comments */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: { xs: '100%', sm: '35%' },
              maxHeight: { sm: '85vh' }
            }}>
              {/* Header with action button */}
              <Box sx={{ 
                p: 2, 
                display: 'flex', 
                justifyContent: 'flex-end',
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}>
                {isPostOwner && (
                  <IconButton 
                    size="small"
                    aria-label="more options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostMenuAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreHorizIcon />
                  </IconButton>
                )}
              </Box>
              
              {/* Comments Section */}
              <Box sx={{ 
                overflowY: 'auto', 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Caption */}
                <Box sx={{ 
                  display: 'flex', 
                  p: 2,
                  borderBottom: theme => `1px solid ${theme.palette.divider}`
                }}>
                  <UserAvatar
                    user={post.user}
                    size={32}
                    sx={{ mr: 1.5 }}
                    onUserClick={handleUserClick}
                  />
                  <Box>
                    <Typography 
                      component="span" 
                      variant="body2" 
                      fontWeight="bold" 
                      mr={1}
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleUserClick(post.user?.id)}
                    >
                      {post.user?.username}
                    </Typography>
                    <Typography component="span" variant="body2">
                      {post.caption}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      {timeAgo(post.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Comments */}
                <Box sx={{ px: 2, py: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Comments ({comments.length})
                  </Typography>
                  
                  {comments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No comments yet
                    </Typography>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      {comments.map((comment) => (
                        <Box key={comment.id} sx={{ display: 'flex', mb: 2.5, position: 'relative' }}>
                          <UserAvatar
                            user={comment.user}
                            size={32}
                            sx={{ mr: 1.5 }}
                            onUserClick={handleUserClick}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography 
                                  component="span" 
                                  variant="body2" 
                                  fontWeight="bold" 
                                  mr={1}
                                  sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                  onClick={() => handleUserClick(comment.user?.id)}
                                >
                                  {comment.user?.username}
                                </Typography>
                                <Typography component="span" variant="body2">
                                  {comment.content}
                                </Typography>
                              </Box>
                              
                              {user && (user.id === comment.user.id || (post.user && user.id === post.user.id)) && (
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleCommentMenuOpen(e, comment.id)}
                                  sx={{ 
                                    ml: 1, 
                                    p: 0.5, 
                                    color: 'text.secondary',
                                    '&:hover': {
                                      color: 'primary.main'
                                    }
                                  }}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              {timeAgo(comment.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
              
              {/* Post Menu */}
              <Menu
                id="post-menu"
                anchorEl={postMenuAnchorEl}
                open={Boolean(postMenuAnchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                slotProps={{
                  paper: {
                    elevation: 3,
                    sx: { mt: 0.5, minWidth: 120 }
                  }
                }}
              >
                {isPostOwner && (
                  <MenuItem onClick={handleDeletePostClick} sx={{ color: 'error.main', p: 1.5 }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete Post
                  </MenuItem>
                )}
              </Menu>
              
              {/* Comment Menu */}
              <Menu
                id="comment-menu"
                anchorEl={commentMenuAnchorEl}
                open={Boolean(commentMenuAnchorEl)}
                onClose={handleCommentMenuClose}
                onClick={(e) => e.stopPropagation()}
                slotProps={{
                  paper: {
                    elevation: 3,
                    sx: { minWidth: 150, mt: 0.5 }
                  }
                }}
              >
                <MenuItem 
                  onClick={handleDeleteCommentClick}
                  sx={{ py: 1, color: 'error.main' }}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Delete" />
                </MenuItem>
              </Menu>
              
              {/* Action bar */}
              <Box sx={{ 
                borderTop: theme => `1px solid ${theme.palette.divider}`,
                p: 2
              }}>
                {/* Like button only */}
                <Box sx={{ display: 'flex', mb: 1.5 }}>
                  <IconButton
                    onClick={handleLikeToggle}
                    sx={{ 
                      p: 1, 
                      mr: 1,
                      color: post.likedByMe ? 'error.main' : 'inherit'
                    }}
                  >
                    {post.likedByMe ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Box>
                
                {/* Likes count */}
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                </Typography>
                
                {/* Post date */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  {timeAgo(post.createdAt)}
                </Typography>
                
                {/* Comment form */}
                <Box 
                  component="form" 
                  onSubmit={handleCommentSubmit}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    borderTop: theme => `1px solid ${theme.palette.divider}`,
                    pt: 1.5
                  }}
                >
                  <InputBase
                    inputRef={commentInputRef}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    fullWidth
                    sx={{ 
                      flex: 1,
                      fontSize: '0.9rem'
                    }}
                    disabled={commentLoading}
                  />
                  {commentLoading ? (
                    <CircularProgress size={24} sx={{ ml: 1 }} />
                  ) : (
                    <Button
                      type="submit"
                      disabled={!newComment.trim()}
                      sx={{ 
                        ml: 1,
                        minWidth: 'auto',
                        fontWeight: 'bold',
                        color: newComment.trim() ? 'primary.main' : 'text.disabled',
                        '&:hover': {
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      Post
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeletePostCancel}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeletePostCancel} disabled={deleteInProgress}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePost} 
            color="error" 
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog
        open={deleteCommentDialogOpen}
        onClose={() => setDeleteCommentDialogOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this comment? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCommentCancel} 
            disabled={deleteCommentInProgress}
            sx={{ 
              color: 'text.secondary',
              mr: 1 
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteComment}
            color="error" 
            variant="contained"
            disabled={deleteCommentInProgress}
            startIcon={deleteCommentInProgress ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ minWidth: '80px' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostModal; 