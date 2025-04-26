import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider
} from '@mui/material';
import {
  Home,
  AddBox,
  Explore,
  FavoriteBorder,
  AccountCircle,
  Search,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reloadCounter, setReloadCounter] = useState(Date.now());

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const getNavigationValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/explore') return 1;
    if (path === '/create') return 2;
    if (path === '/activity') return 3;
    if (path.startsWith('/profile')) return 4;
    return 0;
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user?.profilePicture) {
        console.log('Triggering avatar refresh in Navigation');
        setReloadCounter(Date.now());
      }
    }, 3000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <>
      {!isMobile ? (
        <AppBar 
          position="sticky" 
          color="default" 
          elevation={1} 
          sx={{ 
            bgcolor: 'background.paper',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Toolbar sx={{ maxWidth: 975, mx: 'auto', width: '100%' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                flexGrow: 1, 
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #9c27b0 30%, #d81b60 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px'
              }}
              onClick={() => navigate('/')}
            >
              Clippy
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color={getNavigationValue() === 0 ? 'primary' : 'default'} 
                onClick={() => navigate('/')}
              >
                <Home />
              </IconButton>
              <IconButton 
                color={getNavigationValue() === 1 ? 'primary' : 'default'} 
                onClick={() => navigate('/explore')}
              >
                <Explore />
              </IconButton>
              <IconButton 
                color={getNavigationValue() === 2 ? 'primary' : 'default'} 
                onClick={() => navigate('/create')}
              >
                <AddBox />
              </IconButton>
              <IconButton 
                color={getNavigationValue() === 3 ? 'primary' : 'default'} 
                onClick={() => navigate('/activity')}
              >
                <FavoriteBorder />
              </IconButton>
              <IconButton
                onClick={handleMenu}
                color={getNavigationValue() === 4 ? 'primary' : 'default'}
                sx={{ ml: 1 }}
              >
                <UserAvatar
                  user={user}
                  size={32}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 180,
                    borderRadius: 2,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => {
                  navigate(`/profile/${user?.id}`);
                  handleClose();
                }}>
                  Profile
                </MenuItem>
                <MenuItem onClick={() => {
                  navigate('/settings');
                  handleClose();
                }}>
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      ) : (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1100,
            borderTop: `1px solid ${theme.palette.divider}`
          }} 
          elevation={3}
        >
          <BottomNavigation 
            value={getNavigationValue()} 
            onChange={(_, newValue) => {
              switch(newValue) {
                case 0:
                  navigate('/');
                  break;
                case 1:
                  navigate('/explore');
                  break;
                case 2:
                  navigate('/create');
                  break;
                case 3:
                  navigate('/activity');
                  break;
                case 4:
                  navigate(`/profile/${user?.id}`);
                  break;
                case 5:
                  navigate('/settings');
                  break;
                default:
                  navigate('/');
              }
            }}
            sx={{
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                padding: '6px 0',
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main
              }
            }}
          >
            <BottomNavigationAction icon={<Home />} />
            <BottomNavigationAction icon={<Search />} />
            <BottomNavigationAction icon={<AddBox />} />
            <BottomNavigationAction icon={<FavoriteBorder />} />
            <BottomNavigationAction 
              icon={
                user ? (
                  <UserAvatar
                    user={user}
                    size={24}
                  />
                ) : (
                  <AccountCircle />
                )
              } 
            />
            <BottomNavigationAction icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      )}
      {isMobile && <Box sx={{ height: 56 }} />}
    </>
  );
};

export default Navigation; 