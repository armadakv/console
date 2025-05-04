import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink } from 'react-router-dom';
import { useTables } from '../../hooks/useApi';
import TableChartIcon from '@mui/icons-material/TableChart';

const NoTableSelected: React.FC = () => {
  const { data: tables, isLoading } = useTables();
  
  // Show different content based on whether any tables exist
  const noTablesExist = !isLoading && (!tables || tables.length === 0);
  
  return (
    <Card sx={{ 
      borderRadius: 2, 
      minHeight: 200, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 3,
      textAlign: 'center'
    }}>
      <CardContent>
        <TableChartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        
        <Typography variant="h6" gutterBottom>
          {noTablesExist ? "No Tables Found" : "Select a Table"}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto' }}>
          {noTablesExist 
            ? "You don't have any tables created yet. Create a table to start adding key-value pairs."
            : "Please select a table from the sidebar or the list above to view and manage its key-value pairs."
          }
        </Typography>
        
        {noTablesExist && (
          <Box sx={{ mt: 2 }}>
            <Button
              component={RouterLink}
              to="/settings"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              Create New Table
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NoTableSelected;