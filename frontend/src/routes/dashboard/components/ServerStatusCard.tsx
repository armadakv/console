import React from 'react';
import { Typography, Box, Paper, Divider } from '@mui/material';
import { ServerStatus } from '../../../types';
import StatusChip from '../../../components/shared/StatusChip';
import ErrorAccordion from './ErrorAccordion';
import TableAccordion from './TableAccordion';

interface ServerStatusCardProps {
    server: ServerStatus;
}

/**
 * Component for displaying detailed information about a single server
 */
const ServerStatusCard: React.FC<ServerStatusCardProps> = ({ server }) => {
    // Determine the border color based on server status and errors
    const getBorderColor = () => {
        if (server.status !== 'ok') {
            return 'error.main';
        }

        if (server.errors && server.errors.length > 0) {
            return 'warning.main';
        }

        return 'success.main';
    };

    return (
        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                borderLeft: 4,
                borderLeftColor: getBorderColor(),
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                }}
            >
                <Typography variant="subtitle1" fontWeight="medium">
                    {server.name || server.id}
                </Typography>
                <StatusChip status={server.status} />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Message:</strong>{' '}
                    {server.message || 'No status message available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {server.id}
                </Typography>

                {/* Display errors if any */}
                {server.errors && <ErrorAccordion errors={server.errors} />}

                {/* Display tables */}
                {server.tables && <TableAccordion tables={server.tables} />}
            </Box>
        </Paper>
    );
};

export default ServerStatusCard;