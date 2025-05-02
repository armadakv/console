import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <Box component="footer" sx={{ py: 3, mt: 'auto', backgroundColor: 'primary.light' }}>
      <Container>
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {year} Armada Dashboard | {' '}
          <Link 
            href="https://github.com/armadakv/armada" 
            target="_blank" 
            rel="noopener noreferrer"
            color="inherit"
          >
            Armada Project
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;