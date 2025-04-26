import { Dialog, Slider, Box, Button, Typography, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';

interface ImageCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  crop: { x: number; y: number };
  setCrop: (crop: { x: number; y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onSave: () => void;
  aspect?: number;
  cropShape?: 'rect' | 'round';
}

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onClose,
  imageSrc,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  onSave,
  aspect = 1, // Default to square (1:1) aspect ratio
  cropShape = 'round' // Default to round crop for profile pictures
}) => {
  const onZoomChange = (value: number | number[]) => {
    setZoom(value as number);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crop Image</DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', height: 400, mb: 2 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </Box>
        <Box sx={{ px: 2 }}>
          <Typography variant="body2" gutterBottom>
            Zoom
          </Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="zoom-slider"
            onChange={(_, value) => onZoomChange(value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          color="primary" 
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog; 