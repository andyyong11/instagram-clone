// Import necessary dependencies
import React from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
} from '@mui/icons-material';
import { Post as PostType } from '../../types';
import { postService } from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import { useNavigate } from 'react-router-dom';

// Props interface for Post component
interface PostProps {
  post: PostType;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
}

// Post component displays a single post with user info, image, caption and actions
const Post: React.FC<PostProps> = ({ post, onLike, onUnlike }) => {
  const navigate = useNavigate();

  // Handle like/unlike action for a post
  const handleLike = async () => {
    try {
      if (post.likedByMe) {
        await postService.unlike(post.id);
        onUnlike(post.id);
      } else {
        await postService.like(post.id);
        onLike(post.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Navigate to user profile when avatar/username is clicked
  const handleUserClick = (userId?: number) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mb: 4, mx: 'auto' }}>
      {/* Post header with user avatar and info */}
      <CardHeader
        avatar={
          <UserAvatar
            user={post.user}
            size={40}
            onUserClick={handleUserClick}
          />
        }
        title={post.user.username}
        subheader={new Date(post.createdAt).toLocaleDateString()}
      />
      
      {/* Post image */}
      <CardMedia
        component="img"
        height="600"
        image={post.image}
        alt={post.caption}
      />
      
      {/* Post caption */}
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {post.caption}
        </Typography>
      </CardContent>
      
      {/* Post actions (like, comment, share) */}
      <CardActions disableSpacing>
        {/* Like button and count */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleLike}>
            {post.likedByMe ? (
              <Favorite color="error" />
            ) : (
              <FavoriteBorder />
            )}
          </IconButton>
          <Typography>{post.likesCount}</Typography>
        </Box>
        
        {/* Comment button and count */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <IconButton>
            <ChatBubbleOutline />
          </IconButton>
          <Typography>{post.commentsCount}</Typography>
        </Box>
        
        {/* Share button */}
        <IconButton sx={{ ml: 'auto' }}>
          <Share />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default Post;