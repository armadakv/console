import React, {useState} from 'react';
import {Box, Card, CardContent, Grid, SelectChangeEvent, Typography} from '@mui/material';
import {useDeleteKeyValuePair} from '../../hooks/useApi';
import TableSelector from './TableSelector';
import KeyValueFilter from './KeyValueFilter';
import KeyValueTable from './KeyValueTable';
import AddKeyValueForm from './AddKeyValueForm';

const Data: React.FC = () => {
    // State for form inputs
    const [prefix, setPrefix] = useState<string>('');
    const [start, setStart] = useState<string>('');
    const [end, setEnd] = useState<string>('');
    const [filterMode, setFilterMode] = useState<'prefix' | 'range'>('prefix');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const deleteMutation = useDeleteKeyValuePair();

    // Handle table selection change
    const handleTableChange = (event: SelectChangeEvent<string>) => {
        setSelectedTable(event.target.value);
    };

    // Handle filter mode change
    const handleFilterModeChange = (mode: 'prefix' | 'range') => {
        setFilterMode(mode);
        // Reset filter values when switching modes
        if (mode === 'prefix') {
            setStart('');
            setEnd('');
        } else {
            setPrefix('');
        }
    };

    // Delete a key-value pair
    const deleteKeyValuePair = async (key: string) => {
        if (!selectedTable) {
            return;
        }

        try {
            await deleteMutation.mutateAsync({
                table: selectedTable,
                key,
            });
        } catch (error) {
            console.error('Error deleting key-value pair:', error);
        }
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>

                                <Typography variant="h5" component="h2" gutterBottom>
                                    Key-Value Data
                                </Typography>

                                {/* Table selection */}
                                <Box sx={{mb: 3}}>
                                    <TableSelector
                                        selectedTable={selectedTable}
                                        onTableChange={handleTableChange}
                                    />
                                </Box>

                                {/* Filter form */}
                                <KeyValueFilter
                                    prefix={prefix}
                                    setPrefix={setPrefix}
                                    start={start}
                                    setStart={setStart}
                                    end={end}
                                    setEnd={setEnd}
                                    filterMode={filterMode}
                                    onFilterModeChange={handleFilterModeChange}
                                    onFilter={() => {/* refetch happens automatically on dependencies change */
                                    }}
                                    disabled={!selectedTable}
                                />

                                {/* Data table */}
                                {selectedTable && (
                                    <KeyValueTable
                                        table={selectedTable}
                                        prefix={filterMode === 'prefix' ? prefix : ''}
                                        start={filterMode === 'range' ? start : ''}
                                        end={filterMode === 'range' ? end : ''}
                                        onDeletePair={deleteKeyValuePair}
                                    />
                                )}

                            </Grid>
                            {/* Add new key-value pair form */}
                            <Grid item xs={12}>
                                <AddKeyValueForm selectedTable={selectedTable}/>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default Data;
