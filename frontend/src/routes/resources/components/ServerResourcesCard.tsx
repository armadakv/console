import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ResourceMetricsGrid from './ResourceMetricsGrid';
import CardWithHeader from '../../../components/shared/CardWithHeader';

interface ServerResourcesCardProps {
    servers: Array<{
        id: string;
        name?: string;
        status?: string;
        isCurrent?: boolean;
        address?: string;
    }>;
}

const ServerResourcesCard: React.FC<ServerResourcesCardProps> = ({ servers }) => {
    const [expanded, setExpanded] = React.useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <CardWithHeader title="Server Resources">
            {servers.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ p: 2 }}>
                    No server information available
                </Typography>
            ) : (
                servers.map((server) => (
                    <Accordion
                        key={server.id}
                        expanded={expanded === server.id}
                        onChange={handleChange(server.id)}
                        sx={{
                            '&:before': {
                                display: 'none',
                            },
                            mb: 1,
                            '&:last-child': {
                                mb: 0,
                            },
                            borderLeft: 4,
                            borderColor: server.isCurrent ? 'primary.main' : 'divider',
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`${server.id}-content`}
                            id={`${server.id}-header`}
                            sx={{
                                backgroundColor: 'background.default',
                                borderBottom: expanded === server.id ? 1 : 0,
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', flexGrow: 1 }}>
                                    {server.name || server.id.substring(0, 8)}
                                    {server.isCurrent && ' (current)'}
                                    {server.address && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                        ({server.address})
                                    </Typography>}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: server.status === 'ok' ? 'success.main' : 'error.main',
                                        fontWeight: 'medium',
                                    }}
                                >
                                    {server.status === 'ok' ? 'Online' : 'Offline'}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                            <ResourceMetricsGrid
                                serverId={server.id}
                                serverAddress={server.address}
                            />
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </CardWithHeader>
    );
};

export default ServerResourcesCard;