import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="h1"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            Armada Dashboard
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;