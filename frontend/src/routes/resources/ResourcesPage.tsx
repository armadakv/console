import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  LinearProgress,
  useTheme
} from '@mui/material';
import { useMetrics } from '../../hooks/useApi';
import PageHeader from '../../components/shared/PageHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import CardWithHeader from '../../components/shared/CardWithHeader';
import RefreshButton from '../../components/shared/RefreshButton';

const ResourcesPage: React.FC = () => {
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch } = useMetrics();

  // Create refresh action button for header using RefreshButton component
  const refreshButton = (
    <RefreshButton
      onClick={() => refetch()}
      disabled={isLoading}
      variant="button"
      label="Refresh"
    />
  );

  // Helper function to render a metric card with a progress bar
  const renderMetricCard = (title: string, value: number | undefined, max: number, unit: string) => {
    const percentage = value !== undefined ? (value / max) * 100 : 0;
    const color = percentage > 80 ? 'error' : percentage > 60 ? 'warning' : 'primary';
    
    return (
      <Paper 
        variant="outlined"
        sx={{ 
          p: 2, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
          {title}
        </Typography>
        <Box sx={{ my: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentage, 100)} 
            color={color}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {value !== undefined ? `${value} ${unit}` : 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {max} {unit}
          </Typography>
        </Box>
      </Paper>
    );
  };

  if (isLoading) {
    return (
      <>
        <PageHeader title="Resources" />
        <LoadingState message="Loading resources data..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Resources" />
        <ErrorState 
          error={error} 
          message="Failed to fetch resources data." 
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Resources" action={refreshButton} />

      <Grid container spacing={3}>
        {/* System Resources */}
        <Grid item xs={12}>
          <CardWithHeader title="System Resources">
            {data?.metrics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('CPU Usage', data.metrics.cpuUsage, 100, '%')}
                </Grid>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('Memory Usage', data.metrics.memoryUsage, data.metrics.totalMemory || 100, 'MB')}
                </Grid>
                <Grid item xs={12} md={4}>
                  {renderMetricCard('Disk Usage', data.metrics.diskUsage, data.metrics.totalDisk || 100, 'GB')}
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                No metrics data available
              </Typography>
            )}
          </CardWithHeader>
        </Grid>

        {/* Database Statistics */}
        <Grid item xs={12}>
          <CardWithHeader title="Database Statistics">
            {data?.dbStats ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      height: '100%',
                      borderLeft: 4,
                      borderLeftColor: 'primary.main',
                    }}
                    variant="outlined"
                  >
                    <Typography color="textSecondary" variant="subtitle2">
                      Total Keys
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                      {data.dbStats.totalKeys.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      height: '100%',
                      borderLeft: 4,
                      borderLeftColor: 'success.main',
                    }}
                    variant="outlined"
                  >
                    <Typography color="textSecondary" variant="subtitle2">
                      Operations/sec
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                      {data.dbStats.operationsPerSecond.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      height: '100%',
                      borderLeft: 4,
                      borderLeftColor: 'info.main',
                    }}
                    variant="outlined"
                  >
                    <Typography color="textSecondary" variant="subtitle2">
                      Read/Write Ratio
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                      {data.dbStats.readWriteRatio}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      height: '100%',
                      borderLeft: 4,
                      borderLeftColor: 'warning.main',
                    }}
                    variant="outlined"
                  >
                    <Typography color="textSecondary" variant="subtitle2">
                      Storage Size
                    </Typography>
                    <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                      {data.dbStats.storageSize.toLocaleString()} MB
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center">
                No database statistics available
              </Typography>
            )}
          </CardWithHeader>
        </Grid>
      </Grid>
    </>
  );
};

export default ResourcesPage;