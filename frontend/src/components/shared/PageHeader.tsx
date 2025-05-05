import { Box, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  sx?: object;
}

/**
 * A consistent header component for page titles with optional action buttons
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, action, sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        ...sx,
      }}
    >
      <Typography variant="h5">{title}</Typography>
      {action && <Box>{action}</Box>}
    </Box>
  );
};

export default PageHeader;
