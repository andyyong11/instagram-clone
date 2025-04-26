import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { postService } from '../../services/api';
import { CreatePostData } from '../../types';

const CreatePost: React.FC = () => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      
      // Create preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      setError('Please select an image');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data: CreatePostData = {
        caption,
        image
      };
      
      const response = await postService.create(data);
      
      if (response) {
        console.log('Post created successfully:', response);
        setSuccess(true);
        
        // Reset form after successful submission
        setCaption('');
        setImage(null);
        setImagePreview(null);
        
        // Navigate to feed after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error('No response received from server');
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      
      // Create a user-friendly error message
      let errorMessage = 'Failed to create post. Please try again.';
      
      if (err.response) {
        // Server responded with an error
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        // Network error or other error with message
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Create Post
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Box 
            sx={{ 
              border: '1px dashed #ccc',
              borderRadius: 1,
              p: 2,
              mb: 3,
              textAlign: 'center',
              backgroundColor: '#f8f8f8',
              cursor: 'pointer',
              height: imagePreview ? 'auto' : '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px',
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <>
                <IconButton component="span" sx={{ mb: 1, color: '#1976d2' }}>
                  <PhotoCamera fontSize="large" />
                </IconButton>
                <Typography sx={{ 
                  color: '#1976d2', 
                  fontWeight: 'bold',
                  textShadow: '0px 1px 2px rgba(0,0,0,0.2)'
                }}>
                  Click to select an image
                </Typography>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </Box>
          
          <TextField
            fullWidth
            id="caption"
            label="Caption"
            multiline
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Button
            color="primary"
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading || !image}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Post'}
          </Button>
        </Box>
      </Paper>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Post created successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreatePost; 