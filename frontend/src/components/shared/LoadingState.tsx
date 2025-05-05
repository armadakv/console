import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  height?: number | string;
  sx?: object;
}

/**
 * A consistent loading state component with spinner and optional message
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  height = 300,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height,
        ...sx,
      }}
    >
      <CircularProgress size={24} sx={{ mr: 2 }} />
      {message && <Typography variant="body1">{message}</Typography>}
    </Box>
  );
};

export default LoadingState;
