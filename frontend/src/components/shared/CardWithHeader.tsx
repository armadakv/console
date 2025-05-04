import React, { ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface CardWithHeaderProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  contentSx?: object;
  sx?: object;
}

/**
 * A card with a styled header following the design language
 */
const CardWithHeader: React.FC<CardWithHeaderProps> = ({
  title,
  children,
  action,
  contentSx = {},
  sx = {},
}) => {
  return (
    <Card sx={{ ...sx }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">{title}</Typography>
        {action && <Box>{action}</Box>}
      </Box>
      <CardContent sx={contentSx}>
        {children}
      </CardContent>
    </Card>
  );
};

export default CardWithHeader;