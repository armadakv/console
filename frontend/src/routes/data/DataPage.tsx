import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Grid, Button, Fab, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import CardWithHeader from '../../components/shared/CardWithHeader';
import usePageTitle from '../../hooks/usePageTitle';
import { useDeleteKeyValuePair } from '../../hooks/useApi';

import KeyValueFilter from './components/KeyValueFilter';
import KeyValueTable from './components/KeyValueTable';
import TableSelector from './components/TableSelector';

const DataPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { table } = useParams<{ table: string }>();
  const navigate = useNavigate();

  // State for form inputs
  const [prefix, setPrefix] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'prefix' | 'range'>('prefix');
  const deleteMutation = useDeleteKeyValuePair();

  // Create add button for the card
  const addButton = table ? (
    <Button
      component={RouterLink}
      to={`/data/${table}/add`}
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      sx={{
        borderRadius: 1,
        textTransform: 'none',
      }}
    >
      Add Key-Value Pair
    </Button>
  ) : undefined;

  // Use the usePageTitle hook without button in header
  usePageTitle(table ? `Table: ${table}` : 'Key-Value Data');

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

  // Handle table selection
  const handleTableChange = (tableName: string) => {
    navigate(`/data/${tableName}`);
  };

  // Table selection page
  if (!table) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CardWithHeader
            title="Tables"
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ p: 2 }}>
              <TableSelector selectedTable="" onTableChange={handleTableChange} />
            </Box>
          </CardWithHeader>
        </Grid>
      </Grid>
    );
  }

  // Delete a key-value pair
  const deleteKeyValuePair = async (key: string) => {
    try {
      await deleteMutation.mutateAsync({
        table,
        key,
      });
    } catch (error) {
      console.error('Error deleting key-value pair:', error);
    }
  };

  // Table data page (with specified table)
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={RouterLink}
          to="/data"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2, textTransform: 'none' }}
        >
          Tables
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CardWithHeader
            title="Browse Data"
            action={!isMobile ? addButton : undefined}
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {/* Filter form */}
                <Box sx={{ px: 3, py: 2 }}>
                  <KeyValueFilter
                    prefix={prefix}
                    setPrefix={setPrefix}
                    start={start}
                    setStart={setStart}
                    end={end}
                    setEnd={setEnd}
                    filterMode={filterMode}
                    onFilterModeChange={handleFilterModeChange}
                    onFilter={() => {
                      /* refetch happens automatically on dependencies change */
                    }}
                    disabled={false}
                  />
                </Box>

                {/* Data table */}
                <KeyValueTable
                  table={table}
                  prefix={filterMode === 'prefix' ? prefix : ''}
                  start={filterMode === 'range' ? start : ''}
                  end={filterMode === 'range' ? end : ''}
                  onDeletePair={deleteKeyValuePair}
                />
              </Grid>
            </Grid>
          </CardWithHeader>
        </Grid>
      </Grid>

      {/* Floating action button for mobile */}
      {isMobile && (
        <Tooltip title="Add Key-Value Pair">
          <Fab
            color="primary"
            component={RouterLink}
            to={`/data/${table}/add`}
            sx={{
              position: 'fixed',
              bottom: theme.spacing(2),
              right: theme.spacing(2),
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </>
  );
};

export default DataPage;
