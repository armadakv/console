import React, { ReactNode } from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface SuccessStateProps {
  message?: string;
  title?: string;
  sx?: object;
  action?: ReactNode;
}

/**
 * A consistent success state component with optional action
 */
const SuccessState: React.FC<SuccessStateProps> = ({
  message = 'Operation completed successfully!',
  title = 'Success',
  sx = {},
  action,
}) => {
  return (
    <Alert severity="success" variant="outlined" sx={{ mb: 3, ...sx }} action={action}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );
};

export default SuccessState;
