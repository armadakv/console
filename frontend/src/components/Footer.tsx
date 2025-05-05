import { Box, Typography, Link, Divider } from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ py: 2, mt: 'auto' }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary" align="center">
        &copy; {year} Armada Console |{' '}
        <Link
          href="https://github.com/armadakv/armada"
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          underline="hover"
        >
          Armada Project
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
