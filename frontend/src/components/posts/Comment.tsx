import React from 'react';
import { Typography, Box } from '@mui/material';
import { Comment as CommentType } from '../../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import UserAvatar from '../common/UserAvatar';
import { useNavigate } from 'react-router-dom';

interface CommentProps {
  comment: CommentType;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const navigate = useNavigate();

  const handleUserClick = (userId?: number) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        mb: 1.5 
      }}
    >
      <UserAvatar
        user={comment.user}
        size={32}
        sx={{ mr: 1.5 }}
        onUserClick={handleUserClick}
      />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography 
            component={Link}
            to={`/profile/${comment.user.id}`}
            variant="subtitle2" 
            sx={{ 
              fontWeight: 'bold',
              marginRight: '8px',
              textDecoration: 'none',
              color: 'text.primary'
            }}
          >
            {comment.user.username}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.primary" 
            component="span"
          >
            {comment.content}
          </Typography>
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {format(new Date(comment.createdAt), 'MMM d, yyyy')}
        </Typography>
      </Box>
    </Box>
  );
};

export default Comment; 