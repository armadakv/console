import React from 'react';
import { Typography, Grid } from '@mui/material';
import CardWithHeader from '../../../components/shared/CardWithHeader';
import ServerStatusCard from './ServerStatusCard';
import { ServerStatus } from '../../../types';

interface ServerStatusSectionProps {
    servers: ServerStatus[];
}

/**
 * Section that displays all server status cards
 */
const ServerStatusSection: React.FC<ServerStatusSectionProps> = ({ servers }) => {
    return (
        <CardWithHeader title="Server Status">
            {servers && servers.length > 0 ? (
                <Grid container spacing={2}>
                    {servers.map((server) => (
                        <Grid item xs={12} key={server.id}>
                            <ServerStatusCard server={server} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No servers found. Please check your connection to the Armada cluster.
                </Typography>
            )}
        </CardWithHeader>
    );
};

export default ServerStatusSection;