import React, { ReactNode } from 'react';
import { Typography, Box, Paper } from '@mui/material';

interface SummaryCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    color: 'primary' | 'success' | 'warning' | 'error';
    icon?: ReactNode;
}

/**
 * A reusable card component for displaying summary metrics on the dashboard
 */
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, color, icon }) => {
    // Define color mappings based on the color prop
    const colorMap = {
        primary: {
            bgColor: (theme: any) => theme.palette.primary.light,
            textColor: (theme: any) => theme.palette.primary.contrastText,
            borderColor: (theme: any) => theme.palette.primary.main,
        },
        success: {
            bgColor: 'rgba(76, 175, 80, 0.1)',
            textColor: 'success.main',
            borderColor: 'success.main',
        },
        warning: {
            bgColor: 'rgba(255, 152, 0, 0.1)',
            textColor: 'warning.dark',
            borderColor: 'warning.main',
        },
        error: {
            bgColor: 'rgba(244, 67, 54, 0.1)',
            textColor: 'error.main',
            borderColor: 'error.main',
        }
    };

    const colorStyle = colorMap[color];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: colorStyle.bgColor,
                color: colorStyle.textColor,
                border: '1px solid',
                borderColor: colorStyle.borderColor,
            }}
        >
            <Typography variant="h6">{title}</Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
                    <Typography variant="h2" sx={{ fontWeight: 'medium' }}>
                        {value}
                    </Typography>
                </Box>
            </Box>
            <Typography variant="body2">{subtitle}</Typography>
        </Paper>
    );
};

export default SummaryCard;