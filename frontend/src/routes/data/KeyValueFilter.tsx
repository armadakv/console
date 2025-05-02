import React from 'react';
import {
  TextField,
  Box,
  Button
} from '@mui/material';

interface KeyValueFilterProps {
  prefix: string;
  setPrefix: (prefix: string) => void;
  onFilter: () => void;
  disabled: boolean;
}

const KeyValueFilter: React.FC<KeyValueFilterProps> = ({ 
  prefix, 
  setPrefix, 
  onFilter, 
  disabled 
}) => {
  return (
    <Box sx={{ display: 'flex', mb: 3 }}>
      <TextField
        label="Filter by prefix"
        variant="outlined"
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        disabled={disabled}
        fullWidth
        sx={{ mr: 1 }}
      />
      <Button
        variant="contained"
        onClick={onFilter}
        disabled={disabled}
      >
        Filter
      </Button>
    </Box>
  );
};

export default KeyValueFilter;
