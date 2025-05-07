import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import CardWithHeader from '../../../components/shared/CardWithHeader';

interface ClusterSummaryProps {
    status: string;
    message: string;
    totalServers: number;
    totalTables: number;
}

/**
 * Section for displaying cluster health summary and statistics
 */
const ClusterSummarySection: React.FC<ClusterSummaryProps> = ({
    status,
    message,
    totalServers,
    totalTables
}) => {
    // Determine status colors
    const getStatusColor = () => {
        switch (status) {
            case 'Healthy':
                return 'success.main';
            case 'Warning':
                return 'warning.main';
            case 'Error':
            case 'Unknown':
            default:
                return 'error.main';
        }
    };

    return (
        <CardWithHeader title="Cluster Summary" sx={{ height: '100%' }}>
            <Box sx={{ p: 3 }}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderLeftColor: getStatusColor(),
                        mb: 2
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="medium">
                        Status: {status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {message}
                    </Typography>
                </Paper>

                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    Cluster Statistics
                </Typography>
                <List dense>
                    <ListItem divider>
                        <ListItemText
                            primary="Total Servers"
                            secondary={totalServers}
                        />
                    </ListItem>
                    <ListItem divider>
                        <ListItemText
                            primary="Total Tables"
                            secondary={totalTables}
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemText
                            primary="Health Status"
                            secondary={status}
                        />
                    </ListItem>
                </List>
            </Box>
        </CardWithHeader>
    );
};

export default ClusterSummarySection;