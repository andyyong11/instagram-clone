import React from 'react';
import { Box, Typography, Button, Paper, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';
import { Close as CloseIcon } from '@mui/icons-material';

interface ProfileHeaderProps {
  profile: {
    id: number;
    username: string;
    bio?: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
  isFollowing: boolean;
  onFollowToggle: () => void;
  isCurrentUser: boolean;
  onRefresh: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isFollowing,
  onFollowToggle,
  isCurrentUser,
  onRefresh
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleFollowClick = () => {
    if (onFollowToggle) {
      onFollowToggle();
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: 3
        }}
      >
        {/* Avatar Section */}
        <Box sx={{ position: 'relative' }}>
          <UserAvatar 
            user={profile}
            size={120}
            sx={{ 
              border: `2px solid ${theme.palette.primary.main}`,
            }}
          />
        </Box>
        
        {/* Profile Info Section */}
        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {profile.username}
          </Typography>
          
          <Box mb={2}>
            <Typography variant="body1" color="text.secondary">
              {profile.bio}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Box>
              <Typography variant="body2">
                <strong>{profile.postsCount || 0}</strong> posts
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>{profile.followersCount || 0}</strong> followers
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2">
                <strong>{profile.followingCount || 0}</strong> following
              </Typography>
            </Box>
          </Box>
          
          {user && user.id !== profile.id && (
            <Box mt={2}>
              <Button
                variant={isFollowing ? "outlined" : "contained"}
                color="primary"
                onClick={handleFollowClick}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ProfileHeader; 