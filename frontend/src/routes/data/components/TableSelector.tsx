import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  useTheme,
  useMediaQuery,
  InputAdornment,
  TextField,
} from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useTables } from '../../../hooks/useApi';

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (tableName: string) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ selectedTable, onTableChange }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: tables, isLoading, isError, error, refetch } = useTables();

  // Filter tables based on search query
  const filteredTables = React.useMemo(() => {
    if (!tables) return [];
    if (!searchQuery) return tables;

    const lowerQuery = searchQuery.toLowerCase();
    return tables.filter((table) => table.name.toLowerCase().includes(lowerQuery));
  }, [tables, searchQuery]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading tables...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : 'Failed to fetch tables. Please try again later.'}
        </Alert>
        <Button variant="contained" onClick={() => refetch()} color="primary">
          Try Again
        </Button>
      </Box>
    );
  }

  const noTablesExist = !tables || tables.length === 0;

  return (
    <Box>
      {/* Search and Create Table Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          placeholder="Search tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, maxWidth: isMobile ? '100%' : 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          component={RouterLink}
          to="/settings"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 1,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Create New Table
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Tables Grid/List */}
      {noTablesExist ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TableChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom>
            No Tables Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first table to start storing key-value pairs.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredTables.map((table) => (
            <Grid item xs={12} sm={6} md={4} key={table.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  borderColor: selectedTable === table.name ? 'primary.main' : 'divider',
                  bgcolor:
                    selectedTable === table.name ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onTableChange(table.name)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <TableChartIcon
                    sx={{
                      mr: 1.5,
                      color: selectedTable === table.name ? 'primary.main' : 'text.secondary',
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {table.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}

          {/* Show message when no search results */}
          {filteredTables.length === 0 && searchQuery && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No tables matching "{searchQuery}" found.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default TableSelector;
