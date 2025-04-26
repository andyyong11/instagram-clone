import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  TextField,
  Button,
  Box,
  Collapse,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Modal,
  ListItemIcon
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { Post, Comment } from '../../types';
import { commentService, postService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: number) => void;
}

// Helper function to safely format dates with relative time
const formatDate = (dateString: string): string => {
  try {
    // If the date is invalid or missing, use a simple fallback
    if (!dateString) {
      return 'Recently';
    }
    
    let date: Date | null = null;
    
    // Try to parse with parseISO first
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      date = parsedDate;
    } else {
      // Fallback to standard Date parsing
      const fallbackDate = new Date(dateString);
      if (isValid(fallbackDate)) {
        date = fallbackDate;
      }
    }
    
    if (!date) {
      return 'Recently';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
    
    // For recent posts, show relative time
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    } else {
      // For older posts, show the date
      return format(date, 'MMM d');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteCommentInProgress, setDeleteCommentInProgress] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const { likePost, unlikePost, deletePost } = usePosts();
  const navigate = useNavigate();
  
  const isPostOwner = currentUser && post.user && currentUser.id === post.user.id;
  
  // Fetch comments when component mounts if there are supposed to be comments
  useEffect(() => {
    if (post.commentsCount > 0 && expanded) {
      fetchComments();
    }
  }, [post.id, expanded]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    if (!expanded && comments.length === 0) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const data = await commentService.getAll(post.id);
      setComments(data);
      setLoadingComments(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoadingComments(false);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      const newComment = await commentService.create(post.id, comment);
      setComments([newComment, ...comments]);
      
      // Update the post's comment count
      post.commentsCount = (post.commentsCount || 0) + 1;
      
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (likeInProgress) return;
    setLikeInProgress(true);
    try {
      if (post.likedByMe) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } finally {
      setLikeInProgress(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setDeleteInProgress(true);
    try {
      await deletePost(post.id);
      onDelete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeleteInProgress(false);
      setDeleteDialogOpen(false);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleUserClick = (userId?: number) => {
    if (!userId && post.user?.id) {
      userId = post.user.id;
    }
    
    if (userId) {
      console.log(`Navigating to user profile: ${userId}`);
      window.location.href = `/profile/${userId}`;
    } else {
      console.warn('Unable to navigate to profile: No user ID provided');
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
  };

  const handleCommentMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
    event.stopPropagation();
    console.log('Opening comment menu for comment ID:', commentId);
    setCommentMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const handleCommentMenuClose = () => {
    setCommentMenuAnchorEl(null);
  };

  const handleDeleteCommentClick = () => {
    handleCommentMenuClose();
    setDeleteCommentDialogOpen(true);
  };

  const handleDeleteCommentCancel = () => {
    setDeleteCommentDialogOpen(false);
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentId) return;
    
    try {
      setDeleteCommentInProgress(true);
      console.log('Deleting comment:', selectedCommentId);
      await commentService.delete(post.id, selectedCommentId);
      
      // Update comments by filtering out the deleted comment
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== selectedCommentId)
      );
      
      // Update comment count on post
      post.commentsCount = Math.max((post.commentsCount || 0) - 1, 0);
      
      // Close the dialog
      setDeleteCommentDialogOpen(false);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleteCommentInProgress(false);
    }
  };

  return (
    <Card 
      sx={{
        maxWidth: '100%',
        boxShadow: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        mb: 0,
      }}
    >
      <CardHeader
        avatar={
          <UserAvatar
            user={post.user}
            size={40}
            onUserClick={handleUserClick}
          />
        }
        action={
          isPostOwner && (
            <IconButton aria-label="settings" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          )
        }
        title={
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={() => handleUserClick(post.user?.id)}
          >
            {post.user?.username || 'Anonymous'}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {formatDate(post.createdAt)}
          </Typography>
        }
        sx={{
          padding: '8px 16px'
        }}
      />
      <CardMedia
        component="img"
        image={post.image || 'https://via.placeholder.com/600x600?text=No+Image'}
        alt={post.caption || 'Post image'}
        onClick={handleImageClick}
        sx={{ 
          width: '100%',
          height: { xs: '350px', sm: '450px', md: '500px' },
          objectFit: 'cover',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer'
        }}
      />
      
      {/* Full Image Modal */}
      <Modal
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        aria-labelledby="image-modal"
        aria-describedby="full-size-image"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          outline: 'none',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 0,
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              aria-label="close"
              onClick={handleCloseImageModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
            <img
              src={post.image || 'https://via.placeholder.com/600x600?text=No+Image'}
              alt={post.caption || 'Post image'}
              style={{
                display: 'block',
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Box>
      </Modal>
      
      <CardActions disableSpacing sx={{ pt: 1, pb: 0 }}>
        <IconButton 
          aria-label={post.likedByMe ? "Unlike" : "Like"} 
          onClick={handleLike}
          disabled={likeInProgress}
          sx={{ color: post.likedByMe ? 'error.main' : 'inherit' }}
        >
          {post.likedByMe ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {post.likesCount || 0}
        </Typography>
        
        <IconButton 
          aria-label="Comment"
          onClick={handleExpandClick}
          sx={{ ml: 1 }}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <Typography variant="body2">
          {post.commentsCount || 0}
        </Typography>
      </CardActions>
      
      <CardContent sx={{ pt: 0, pb: 1, px: 2 }}>
        {post.caption && (
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            <Typography 
              variant="subtitle2" 
              component="span" 
              sx={{ 
                fontWeight: 600, 
                mr: 1,
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
              onClick={() => handleUserClick(post.user?.id)}
            >
              {post.user?.username || 'Anonymous'}
            </Typography>
            <Typography variant="body2" component="span">
              {post.caption}
            </Typography>
          </Box>
        )}
        
        {post.commentsCount > 0 && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            onClick={handleExpandClick}
            sx={{ 
              mt: 1, 
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            View all {post.commentsCount} comments
          </Typography>
        )}
      </CardContent>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Comment form */}
          <Box component="form" onSubmit={handleCommentSubmit} sx={{ 
            display: 'flex',
            mb: 2
          }}>
            <TextField
              variant="outlined"
              placeholder="Add a comment..."
              value={comment}
              onChange={handleCommentChange}
              fullWidth
              size="small"
              sx={{ mr: 1 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={!comment.trim() || submittingComment}
              endIcon={submittingComment ? <CircularProgress size={16} /> : <SendIcon />}
            >
              Post
            </Button>
          </Box>

          {/* Comments list */}
          {loadingComments ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          ) : comments.length > 0 ? (
            <List sx={{ p: 0 }}>
              {comments.map((comment) => (
                <ListItem 
                  key={comment.id} 
                  alignItems="flex-start" 
                  sx={{ 
                    px: 0,
                    py: 1
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <UserAvatar
                      user={comment.user}
                      size={32}
                      onUserClick={handleUserClick}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography 
                          variant="subtitle2" 
                          component="span" 
                          sx={{ 
                            fontWeight: 600, 
                            mr: 1, 
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={() => handleUserClick(comment.user?.id)}
                        >
                          {comment.user?.username}
                        </Typography>
                        <Typography variant="body2" component="span">
                          {comment.content}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(comment.createdAt)}
                      </Typography>
                    }
                  />
                  {currentUser && (currentUser.id === comment.user.id || isPostOwner) && (
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
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </Box>
      </Collapse>
      
      {/* Post options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Post
        </MenuItem>
      </Menu>
      
      {/* Comment options menu */}
      <Menu
        id="comment-menu"
        anchorEl={commentMenuAnchorEl}
        open={Boolean(commentMenuAnchorEl)}
        onClose={handleCommentMenuClose}
        onClick={(e) => e.stopPropagation()}
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
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment deletion confirmation dialog */}
      <Dialog
        open={deleteCommentDialogOpen}
        onClose={handleDeleteCommentCancel}
      >
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCommentCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteComment} 
            color="error"
            disabled={deleteCommentInProgress}
            startIcon={deleteCommentInProgress ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PostCard; 