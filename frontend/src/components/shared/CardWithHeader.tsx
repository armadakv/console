import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import React, { ReactNode } from 'react';

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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card sx={{ ...sx }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
        {action && <Box>{action}</Box>}
      </Box>
      <CardContent sx={contentSx}>{children}</CardContent>
    </Card>
  );
};

export default CardWithHeader;
