import React, {Component} from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  CircularProgress, 
  Alert, 
  Grid,
  Chip
} from '@mui/material';
import { useStatus } from '../../hooks/useApi';

const Dashboard: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useStatus();

  if (isLoading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading dashboard data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Error
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error instanceof Error ? error.message : 'Failed to fetch dashboard data. Please try again later.'}
          </Alert>
          <Button variant="contained" onClick={() => refetch()} color="primary">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              System Status
            </Typography>
            {data?.servers && data.servers.length > 0 ? (
              <Box>
                {data.servers.map((server) => (
                  <Box key={server.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {server.name || server.id}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" sx={{ mr: 1 }}>
                        Status:
                      </Typography>
                      <Chip 
                        label={server.status || 'Unknown'} 
                        color={server.status === 'ok' ? 'success' : 'error'} 
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2">
                      {server.message || 'No status message available'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" paragraph>
                No servers found. Please check your connection to the Armada cluster.
              </Typography>
            )}
            <Button variant="contained" onClick={() => refetch()} color="primary">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Resources
            </Typography>
            <Typography variant="body1">
              No resources available yet. This section will display Armada resources when connected.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
