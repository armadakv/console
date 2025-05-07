import React from 'react';
import {
    Box,
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper
} from '@mui/material';
import CardWithHeader from '../../../components/shared/CardWithHeader';
import LoadingState from '../../../components/shared/LoadingState';
import { Table as TableType } from '../../../types';

interface TablesSectionProps {
    tables?: TableType[];
    loading: boolean;
}

/**
 * Section for displaying a list of tables in a card
 */
const TablesSection: React.FC<TablesSectionProps> = ({ tables, loading }) => {
    return (
        <CardWithHeader title="Tables" sx={{ height: '100%' }}>
            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <LoadingState message="Loading tables..." />
                </Box>
            ) : tables && tables.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tables.map(table => (
                                <TableRow key={table.id}>
                                    <TableCell>{table.name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">{table.id}</Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No tables found.
                    </Typography>
                </Box>
            )}
        </CardWithHeader>
    );
};

export default TablesSection;