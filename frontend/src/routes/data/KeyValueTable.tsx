import React from 'react';
import {
    Box,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {useKeyValuePairs} from '../../hooks/useApi';
import KeyValueCells from "./KeyValueCells";

interface KeyValueTableProps {
    table: string;
    prefix: string;
    start: string;
    end: string;
    onDeletePair: (key: string) => void;
}

const KeyValueTable: React.FC<KeyValueTableProps> = ({
                                                         table, prefix, start, end, onDeletePair
                                                     }) => {
    const {data: keyValuePairs, isLoading, isError} = useKeyValuePairs(
        table,
        prefix,
        start,
        end,
    );

    if (isLoading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 3}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box sx={{p: 2}}>
                <Typography color="error">
                    Error loading key-value pairs. Please try again.
                </Typography>
            </Box>
        );
    }

    if (!keyValuePairs || keyValuePairs.length === 0) {
        return (
            <Box sx={{p: 2}}>
                <Typography>
                    No key-value pairs found with the current filter.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} sx={{mt: 2}}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell width="40%"><strong>Key</strong></TableCell>
                        <TableCell width="50%"><strong>Value</strong></TableCell>
                        <TableCell width="10%" align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {keyValuePairs.map((pair) => (
                        <TableRow key={pair.key} hover>
                            <KeyValueCells keyName={pair.key} value={pair.value}/>
                            <TableCell align="center">
                                <IconButton
                                    size="small"
                                    onClick={() => onDeletePair(pair.key)}
                                    color="error"
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default KeyValueTable;
