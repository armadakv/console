import React from 'react';
import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    Grid,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from '@mui/material';

interface KeyValueFilterProps {
    prefix: string;
    setPrefix: (prefix: string) => void;
    start: string;
    setStart: (start: string) => void;
    end: string;
    setEnd: (end: string) => void;
    filterMode: 'prefix' | 'range';
    onFilterModeChange: (mode: 'prefix' | 'range') => void;
    onFilter: () => void;
    disabled: boolean;
}

const KeyValueFilter: React.FC<KeyValueFilterProps> = ({
                                                           prefix, setPrefix, start, setStart, end, setEnd,
                                                           filterMode, onFilterModeChange, onFilter, disabled
                                                       }) => {
    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterModeChange(event.target.value as 'prefix' | 'range');
    };

    return (
        <Box sx={{mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1}}>
            <Typography variant="h6" gutterBottom>
                Filter Key-Value Pairs
            </Typography>

            <FormControl component="fieldset" sx={{mb: 2}}>
                <RadioGroup
                    row
                    value={filterMode}
                    onChange={handleModeChange}
                    name="filter-mode"
                >
                    <FormControlLabel
                        value="prefix"
                        control={<Radio/>}
                        label="Filter by Prefix"
                        disabled={disabled}
                    />
                    <FormControlLabel
                        value="range"
                        control={<Radio/>}
                        label="Filter by Range"
                        disabled={disabled}
                    />
                </RadioGroup>
            </FormControl>

            <Grid container spacing={2} alignItems="center">
                {filterMode === 'prefix' ? (
                    <Grid item xs={12} md={10}>
                        <TextField
                            fullWidth
                            label="Key Prefix"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="Enter key prefix to filter"
                            disabled={disabled}
                            size="small"
                        />
                    </Grid>
                ) : (
                    <>
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                label="Start Key"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                placeholder="Enter start key (inclusive)"
                                disabled={disabled}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                label="End Key"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                placeholder="Enter end key (exclusive)"
                                disabled={disabled}
                                size="small"
                            />
                        </Grid>
                    </>
                )}
                <Grid item xs={12} md={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onFilter}
                        disabled={disabled}
                        fullWidth
                    >
                        Apply Filter
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default KeyValueFilter;
