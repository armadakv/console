import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Tooltip,
    Chip
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { formatBytes } from '../utils';
import { TableStatus } from '../../../types';

interface TableAccordionProps {
    tables: Record<string, TableStatus>;
}

/**
 * Component for displaying tables in an expandable accordion
 */
const TableAccordion: React.FC<TableAccordionProps> = ({ tables }) => {
    if (!tables || Object.keys(tables).length === 0) {
        return null;
    }

    const tableCount = Object.keys(tables).length;

    return (
        <Accordion
            disableGutters
            elevation={0}
            sx={{
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '4px !important',
                mt: 1
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ borderRadius: 1 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorageIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                    <Typography color="primary" variant="body2" fontWeight="medium">
                        {tableCount} {tableCount === 1 ? 'Table' : 'Tables'}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Table Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Log Size</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>DB Size</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Leader</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Raft Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(tables).map(([name, status]) => (
                                <TableRow key={name}>
                                    <TableCell>{name}</TableCell>
                                    <TableCell>{formatBytes(status.logSize)}</TableCell>
                                    <TableCell>{formatBytes(status.dbSize)}</TableCell>
                                    <TableCell>{status.leader}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Raft Index" placement="top">
                                                <Chip
                                                    size="small"
                                                    label={`Index: ${status.raftIndex}`}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Raft Term" placement="top">
                                                <Chip
                                                    size="small"
                                                    label={`Term: ${status.raftTerm}`}
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.75rem' }}
                                                />
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    );
};

export default TableAccordion;