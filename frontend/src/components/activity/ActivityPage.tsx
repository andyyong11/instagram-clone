import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider,
  Tab,
  Tabs,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Favorite as LikeIcon, 
  ChatBubble as CommentIcon, 
  PersonAdd as FollowIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { activityService, postService, MEDIA_URL } from '../../services/api';
import UserAvatar from '../common/UserAvatar';

// Format the timestamp to a relative time string
const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow';
  userId: number;
  username: string;
  userAvatar: string | null;
  postId?: number;
  postImage?: string;
  comment?: string;
  timestamp: string;
}

// Cache for post images to avoid redundant API calls
const postImageCache: Record<number, string> = {};

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
      console.warn('Received invalid image path:', imageUrl);
      return PLACEHOLDER_IMAGE;
    }
    
    // If it starts with a slash, append to MEDIA_URL
    if (imageUrl.startsWith('/')) {
      return `${MEDIA_URL}${imageUrl}`;
    }
    
    // Otherwise append with a slash
    return `${MEDIA_URL}/${imageUrl}`;
  } catch (error) {
    console.error('Error formatting image URL:', error);
    return PLACEHOLDER_IMAGE;
  }
};

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [likeActivities, setLikeActivities] = useState<Activity[]>([]);
  const [commentActivities, setCommentActivities] = useState<Activity[]>([]);
  const [followActivities, setFollowActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch post images for activities
  const fetchPostImages = async (activitiesData: Activity[]) => {
    // Filter activities that have a postId but no postImage
    const activitiesNeedingImages = activitiesData.filter(
      activity => activity.postId && !activity.postImage && !postImageCache[activity.postId]
    );
    
    console.log('Activities needing images:', activitiesNeedingImages.length);
    
    // Create a Set of unique post IDs that need fetching
    const uniquePostIds = new Set(activitiesNeedingImages.map(activity => activity.postId));
    console.log('Unique post IDs to fetch:', Array.from(uniquePostIds));
    
    // Fetch post details for each unique post ID that's not in cache
    const fetchPromises = Array.from(uniquePostIds).map(async (postId) => {
      if (postId && !postImageCache[postId]) {
        try {
          console.log(`Fetching post details for post ID: ${postId}`);
          const postData = await postService.get(postId);
          console.log(`Post data received for post ID ${postId}:`, postData);
          
          // Extract the image URL from the post data
          let imageUrl = null;
          if (postData) {
            if (postData.image) {
              // Standard property
              imageUrl = postData.image;
            } else if (postData.imageUrl) {
              // Alternative property name
              imageUrl = postData.imageUrl;
            } else if (postData.post && postData.post.image) {
              // Nested structure
              imageUrl = postData.post.image;
            }
          }
          
          if (imageUrl) {
            console.log(`Image found for post ID ${postId}:`, imageUrl);
            
            // Normalize the URL format before caching
            // This ensures consistent URL format regardless of how the backend returns it
            const normalizedImageUrl = formatImageUrl(imageUrl);
            
            // Save to cache
            postImageCache[postId] = normalizedImageUrl;
            return { postId, image: normalizedImageUrl };
          } else {
            console.warn(`No image found in post data for post ID ${postId}`, postData);
          }
        } catch (err) {
          console.error(`Error fetching post ${postId} details:`, err);
        }
      }
      return null;
    });
    
    // Wait for all fetch operations to complete
    const results = await Promise.all(fetchPromises);
    console.log('Post image fetch results:', results.filter(Boolean));
    
    // Update activities with the fetched images
    const updatedActivities = activitiesData.map(activity => {
      if (activity.postId && !activity.postImage) {
        // Check if we have the image in cache now
        if (postImageCache[activity.postId]) {
          console.log(`Adding image to activity ${activity.id} for post ${activity.postId}`);
          return { ...activity, postImage: postImageCache[activity.postId] };
        }
      }
      return activity;
    });
    
    // Check the final results
    const withImages = updatedActivities.filter(a => a.postImage).length;
    const withoutImages = updatedActivities.filter(a => a.postId && !a.postImage).length;
    console.log(`Activities with images: ${withImages}, without images: ${withoutImages}`);
    
    return updatedActivities;
  };
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch all activities for the "All Activity" tab
        const allData = await activityService.getAll();
        const allWithImages = await fetchPostImages(allData);
        setActivities(allWithImages);
        
        // Fetch specific activity types for their respective tabs
        const likesData = await activityService.getLikes();
        const likesWithImages = await fetchPostImages(likesData);
        setLikeActivities(likesWithImages);
        
        const commentsData = await activityService.getComments();
        const commentsWithImages = await fetchPostImages(commentsData);
        setCommentActivities(commentsWithImages);
        
        const followsData = await activityService.getFollows();
        setFollowActivities(followsData);
        
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [user]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleUserClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };
  
  const handlePostClick = (postId: number) => {
    navigate(`/post/${postId}`);
  };

  const renderNotification = (notification: Activity) => {
    // Format the post image URL if present
    const formattedPostImage = notification.postImage ? formatImageUrl(notification.postImage) : null;
    
    switch (notification.type) {
      case 'like':
        return (
          <ListItem key={notification.id} sx={{ py: 2 }}>
            <ListItemAvatar>
              <UserAvatar
                user={{
                  id: notification.userId,
                  username: notification.username,
                  profile_picture_url: notification.userAvatar || undefined
                }}
                size={40}
                onUserClick={() => handleUserClick(notification.userId)}
              />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box component="span">
                  <Typography 
                    component="span" 
                    variant="body1" 
                    fontWeight="medium"
                    onClick={() => handleUserClick(notification.userId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {notification.username}
                  </Typography>
                  <Typography component="span" variant="body1"> liked your post</Typography>
                </Box>
              }
              secondary={formatTimeAgo(notification.timestamp)}
            />
            {formattedPostImage && (
              <Box 
                component="img" 
                src={formattedPostImage}
                alt="Post"
                sx={{ 
                  width: 56, 
                  height: 56, 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                onClick={() => notification.postId && handlePostClick(notification.postId)}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  console.error('Image failed to load:', formattedPostImage);
                  // If image fails to load, set a placeholder
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
            )}
            {!formattedPostImage && notification.postId && (
              <Box 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.04)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
                onClick={() => handlePostClick(notification.postId as number)}
              >
                <Typography variant="caption" color="text.secondary" align="center">
                  Post
                </Typography>
              </Box>
            )}
          </ListItem>
        );
        
      case 'comment':
        return (
          <ListItem key={notification.id} sx={{ py: 2 }}>
            <ListItemAvatar>
              <UserAvatar
                user={{
                  id: notification.userId,
                  username: notification.username,
                  profile_picture_url: notification.userAvatar || undefined
                }}
                size={40}
                onUserClick={() => handleUserClick(notification.userId)}
              />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box component="span">
                  <Typography 
                    component="span" 
                    variant="body1" 
                    fontWeight="medium"
                    onClick={() => handleUserClick(notification.userId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {notification.username}
                  </Typography>
                  <Typography component="span" variant="body1">
                    {` commented: "${notification.comment}"`}
                  </Typography>
                </Box>
              }
              secondary={formatTimeAgo(notification.timestamp)}
            />
            {formattedPostImage && (
              <Box 
                component="img" 
                src={formattedPostImage}
                alt="Post"
                sx={{ 
                  width: 56, 
                  height: 56, 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                onClick={() => notification.postId && handlePostClick(notification.postId)}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  console.error('Image failed to load:', formattedPostImage);
                  // If image fails to load, set a placeholder
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
            )}
            {!formattedPostImage && notification.postId && (
              <Box 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.04)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
                onClick={() => handlePostClick(notification.postId as number)}
              >
                <Typography variant="caption" color="text.secondary" align="center">
                  Post
                </Typography>
              </Box>
            )}
          </ListItem>
        );
        
      case 'follow':
        return (
          <ListItem key={notification.id} sx={{ py: 2 }}>
            <ListItemAvatar>
              <UserAvatar
                user={{
                  id: notification.userId,
                  username: notification.username,
                  profile_picture_url: notification.userAvatar || undefined
                }}
                size={40}
                onUserClick={() => handleUserClick(notification.userId)}
              />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box component="span">
                  <Typography 
                    component="span" 
                    variant="body1" 
                    fontWeight="medium"
                    onClick={() => handleUserClick(notification.userId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {notification.username}
                  </Typography>
                  <Typography component="span" variant="body1"> started following you</Typography>
                </Box>
              }
              secondary={formatTimeAgo(notification.timestamp)}
            />
          </ListItem>
        );
        
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Box mt={4} textAlign="center">
          <Typography variant="h6">Please log in to view your activity</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="md">
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Activity
        </Typography>
        
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="All Activity" />
            <Tab label="Likes" icon={<LikeIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Comments" icon={<CommentIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Follows" icon={<FollowIcon fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Paper>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Paper elevation={1}>
            <TabPanel value={activeTab} index={0}>
              {activities.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <Typography color="textSecondary">No recent activity</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {activities.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      {renderNotification(notification)}
                      {index < activities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              {likeActivities.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <Typography color="textSecondary">No likes activity</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {likeActivities.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      {renderNotification(notification)}
                      {index < likeActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
            
            <TabPanel value={activeTab} index={2}>
              {commentActivities.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <Typography color="textSecondary">No comments activity</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {commentActivities.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      {renderNotification(notification)}
                      {index < commentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
            
            <TabPanel value={activeTab} index={3}>
              {followActivities.length === 0 ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <Typography color="textSecondary">No follows activity</Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {followActivities.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      {renderNotification(notification)}
                      {index < followActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ActivityPage; 