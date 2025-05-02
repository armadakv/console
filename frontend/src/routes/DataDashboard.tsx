import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { useDeleteKeyValuePair } from '../hooks/useApi';
import TableSelector from './data/TableSelector';
import KeyValueFilter from './data/KeyValueFilter';
import KeyValueTable from './data/KeyValueTable';
import AddKeyValueForm from './data/AddKeyValueForm';

const DataDashboard: React.FC = () => {
  // State for form inputs
  const [prefix, setPrefix] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const deleteMutation = useDeleteKeyValuePair();

  // Handle table selection change
  const handleTableChange = (event: SelectChangeEvent<string>) => {
    setSelectedTable(event.target.value);
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
            <Typography variant="h5" component="h2" gutterBottom>
              Key-Value Data
            </Typography>

            {/* Table selection */}
            <Box sx={{ mb: 3 }}>
              <TableSelector 
                selectedTable={selectedTable}
                onTableChange={handleTableChange}
              />
            </Box>

            {/* Filter form */}
            <KeyValueFilter
              prefix={prefix}
              setPrefix={setPrefix}
              onFilter={() => {/* refetch happens automatically on dependencies change */}}
              disabled={!selectedTable}
            />

            {/* Data table */}
            {selectedTable && (
              <KeyValueTable
                table={selectedTable}
                prefix={prefix}
                onDeletePair={deleteKeyValuePair}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Add new key-value pair form */}
      <Grid item xs={12}>
        <AddKeyValueForm selectedTable={selectedTable} />
      </Grid>
    </Grid>
  );
};

export default DataDashboard;
