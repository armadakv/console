import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface ErrorAccordionProps {
    errors: string[];
}

/**
 * Component for displaying errors in an expandable accordion
 */
const ErrorAccordion: React.FC<ErrorAccordionProps> = ({ errors }) => {
    if (!errors || errors.length === 0) {
        return null;
    }

    return (
        <Accordion
            disableGutters
            elevation={0}
            sx={{
                bgcolor: 'rgba(244, 67, 54, 0.05)',
                '&:before': { display: 'none' },
                border: '1px solid',
                borderColor: 'error.light',
                borderRadius: '4px !important',
                mt: 1
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ borderRadius: 1 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorOutlineIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                    <Typography color="error" variant="body2" fontWeight="medium">
                        {errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Detected
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <List dense disablePadding>
                    {errors.map((error, index) => (
                        <ListItem key={index} divider={index < errors.length - 1}>
                            <ListItemText primary={error} primaryTypographyProps={{ color: 'error' }} />
                        </ListItem>
                    ))}
                </List>
            </AccordionDetails>
        </Accordion>
    );
};

export default ErrorAccordion;