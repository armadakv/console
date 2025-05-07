import React from 'react';
import { Grid, Typography, Paper, Box, CircularProgress } from '@mui/material';
import { useMetricsQuery } from '../../../hooks/useApi';
import ErrorState from '../../../components/shared/ErrorState';
import { MetricsQueryResponse } from "../../../types";

type MetricCardProps = {
    title: string;
    value: string | number;
    unit?: string;
    color: string;
    loading?: boolean;
    error?: boolean;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit = '', color, loading = false, error = false }) => {
    return (
        <Paper
            sx={{
                p: 2,
                textAlign: 'center',
                height: '100%',
                borderLeft: 4,
                borderLeftColor: color,
            }}
            variant="outlined"
        >
            <Typography color="textSecondary" variant="subtitle2">
                {title}
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : error ? (
                <Typography variant="body2" color="error" sx={{ my: 1 }}>
                    Error loading data
                </Typography>
            ) : (
                <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                    {value}{unit && <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>{unit}</Typography>}
                </Typography>
            )}
        </Paper>
    );
};

interface ResourceMetricsGridProps {
    serverId?: string;
    serverAddress?: string;
}

const ResourceMetricsGrid: React.FC<ResourceMetricsGridProps> = ({ serverId, serverAddress }) => {
    // Query for CPU usage as percentage
    const cpuQuery = `cpu_usage_percent{node_id="${serverId}"}`;

    const { data: cpuData, isLoading: cpuLoading, isError: cpuError } = useMetricsQuery(cpuQuery);

    // Query for memory usage in MB
    const memoryQuery = `sum(increase(go_memstats_alloc_bytes_total{node_id="${serverId}"}[5m])) / 1024 / 1024`;

    const { data: memoryData, isLoading: memoryLoading, isError: memoryError } = useMetricsQuery(memoryQuery);

    // Query for disk usage in GB
    const diskQuery = `sum(regatta_table_storage_disk_usage_bytes{node_id="${serverId}"}) / 1024 / 1024`;

    const { data: diskData, isLoading: diskLoading, isError: diskError } = useMetricsQuery(diskQuery);

    // Query for network throughput in MB/s
    const networkQuery = `network_throughput_mbps{node_id="${serverId}"}`;

    const { data: networkData, isLoading: networkLoading, isError: networkError } = useMetricsQuery(networkQuery);

    const extractVectorMetricValue = (data?: MetricsQueryResponse, defaultValue: number = 0): number => {
        // Check if data exists and has the expected structure
        if (!data || !data.data) {
            return defaultValue;
        }

        const { resultType, result } = data.data;

        switch (resultType) {
            case "vector":
                if (result.length === 0) {
                    return defaultValue
                }
                // The result is a scalar value, which is an array with two elements: [timestamp, value]
                return Number(result[0].value[1]) || defaultValue;

            default:
                console.error(`Wrong result type ${resultType}`);
                return defaultValue;
        }
    };

    // Format the values with appropriate precision
    const cpuValue = extractVectorMetricValue(cpuData);
    const formattedCpuValue = cpuValue.toFixed(1);

    const memoryValue = extractVectorMetricValue(memoryData);
    const formattedMemoryValue = memoryValue.toFixed(0);

    const diskValue = extractVectorMetricValue(diskData);
    const formattedDiskValue = diskValue.toFixed(1);

    const networkValue = extractVectorMetricValue(networkData);
    const formattedNetworkValue = networkValue.toFixed(2);

    // Check if all metrics had errors
    const allError = cpuError && memoryError && diskError && networkError;
    if (allError) {
        return <ErrorState message="Failed to load metrics data." />;
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
                <MetricCard
                    title="CPU Usage"
                    value={formattedCpuValue}
                    unit="%"
                    color="primary.main"
                    loading={cpuLoading}
                    error={cpuError}
                />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
                <MetricCard
                    title="Memory Usage"
                    value={formattedMemoryValue}
                    unit="MB"
                    color="warning.main"
                    loading={memoryLoading}
                    error={memoryError}
                />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
                <MetricCard
                    title="Disk Usage"
                    value={formattedDiskValue}
                    unit="MB"
                    color="info.main"
                    loading={diskLoading}
                    error={diskError}
                />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
                <MetricCard
                    title="Network Throughput"
                    value={formattedNetworkValue}
                    unit="MB/s"
                    color="success.main"
                    loading={networkLoading}
                    error={networkError}
                />
            </Grid>
        </Grid>
    );
};

export default ResourceMetricsGrid;