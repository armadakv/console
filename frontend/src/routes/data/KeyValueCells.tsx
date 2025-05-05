import React, { useState, useCallback } from 'react';
import { TableCell, Typography, Box, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeIcon from '@mui/icons-material/Code';
import TextFormatIcon from '@mui/icons-material/TextFormat';

interface TableRowProps {
  keyName: string;
  value: string;
}

const KeyValueCells: React.FC<TableRowProps> = ({ keyName, value }) => {
  const [viewMode, setViewMode] = useState<'raw' | 'json'>('raw');

  const isValidJson = useCallback(() => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: 'raw' | 'json' | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const renderValue = () => {
    if (viewMode === 'json' && isValidJson()) {
      try {
        const formattedJson = JSON.stringify(JSON.parse(value), null, 2);
        return (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <SyntaxHighlighter
              language="json"
              style={vs}
              customStyle={{
                margin: 0,
                borderRadius: 4,
                fontFamily: '"Roboto Mono", "Courier New", monospace',
              }}
            >
              {formattedJson}
            </SyntaxHighlighter>
          </Box>
        );
      } catch {
        return <Typography color="error">Invalid JSON</Typography>;
      }
    }

    return (
      <Paper
        variant="outlined"
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          p: 1,
          bgcolor: 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            m: 0,
            fontFamily: '"Roboto Mono", "Courier New", monospace',
            fontSize: '0.875rem',
          }}
        >
          {value}
        </Typography>
      </Paper>
    );
  };

  return (
    <>
      <TableCell component="th" scope="row" width="30%" sx={{ verticalAlign: 'top' }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            bgcolor: 'rgba(0, 0, 0, 0.03)',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Typography
            fontWeight="medium"
            sx={{
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: '0.875rem',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {keyName}
          </Typography>
        </Paper>
      </TableCell>
      <TableCell>
        {isValidJson() && (
          <Box sx={{ mb: 1 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={handleViewModeChange}
            >
              <ToggleButton value="raw" aria-label="raw view">
                <TextFormatIcon fontSize="small" sx={{ mr: 0.5 }} />
                Raw
              </ToggleButton>
              <ToggleButton value="json" aria-label="json view">
                <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                JSON
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        {renderValue()}
      </TableCell>
    </>
  );
};

export default KeyValueCells;
