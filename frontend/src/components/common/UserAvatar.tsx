import React from 'react';
import { Box, Typography } from '@mui/material';

interface UserAvatarProps {
  user?: {
    id?: number;
    username?: string;
    profile_picture?: string;
    profile_picture_url?: string;
    avatar?: string;
    profilePicture?: string;
  } | null;
  size?: number;
  sx?: any;
  onUserClick?: (userId?: number) => void;
  cacheBuster?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 40, 
  sx = {}, 
  onUserClick
}) => {
  if (!user) {
    return (
      <Box 
        sx={{ 
          width: size, 
          height: size,
          bgcolor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          ...sx 
        }}
      >
        <Typography variant="body1">?</Typography>
      </Box>
    );
  }

  const username = user.username || '';
  const letter = username.charAt(0).toUpperCase();
  
  // Handle click on avatar
  const handleClick = () => {
    if (onUserClick && user?.id) {
      onUserClick(user.id);
    }
  };

  // Generate a background color based on username's first letter
  const colors = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", 
    "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4",
    "#009688", "#4CAF50", "#8BC34A", "#CDDC39", 
    "#FFC107", "#FF9800", "#FF5722"
  ];
  
  const colorIndex = user.id ? (user.id % colors.length) : (letter.charCodeAt(0) % colors.length);
  const bgColor = colors[colorIndex];

  return (
    <Box
      onClick={handleClick}
      sx={{
        width: size,
        height: size,
        bgcolor: bgColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        fontWeight: 'bold',
        cursor: onUserClick ? 'pointer' : 'default',
        '&:hover': onUserClick ? { opacity: 0.8 } : {},
        ...sx
      }}
    >
      <Typography variant="body1">{letter}</Typography>
    </Box>
  );
};

export default UserAvatar; 