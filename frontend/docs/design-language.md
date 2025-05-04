# Armada Console Design Language

This document outlines the design language and UI patterns used throughout the Armada Console frontend. Following these guidelines ensures a consistent user experience across the application.

## Layout Structure

### Page Layout
- **Left Sidebar Navigation**: The primary navigation pattern is a fixed-width left sidebar
  - Width: 240px on desktop
  - Collapsible on mobile devices (accessible via menu button)
- **Top Header Bar**: Contains page title, mobile menu toggle, and optional action items
- **Main Content Area**: Flexible width container with consistent padding
- **Footer**: Minimal footer with copyright information at the bottom of the page

### Responsive Behavior
- Desktop: Permanent sidebar with fixed width
- Mobile/Tablet: Collapsible drawer that can be toggled via the header menu button
- Breakpoints follow Material-UI defaults (xs, sm, md, lg, xl)

## Typography

### Text Hierarchy
- **Page Titles**: `Typography variant="h5"` - Used for main page headers
- **Section Titles**: `Typography variant="h6"` - Used for card headers and major sections
- **Subsection Headers**: `Typography variant="subtitle1" fontWeight="medium"` - Used for subsections
- **Labels**: `Typography variant="subtitle2"` - Used for form labels and smaller headings
- **Body**: `Typography variant="body1"` - Used for regular paragraph text
- **Secondary Text**: `Typography variant="body2" color="text.secondary"` - Used for descriptions and less prominent text

### Font Weights
- Regular text: 400
- Medium emphasis: 500
- Strong emphasis: 600 (like selected menu items, important labels)

## Color System

### Primary Colors
- Primary: Material-UI default blue (`#1976d2`)
- Secondary: Based on purpose-specific colors

### Semantic Colors
- **Success**: Green (`#4caf50`) - Used for positive status, successful operations
- **Error/Danger**: Red (`#f44336`) - Used for errors, alerts, destructive actions
- **Warning**: Orange (`#ff9800`) - Used for warnings and cautions
- **Info**: Light Blue (`#2196f3`) - Used for informational content, hints

### Background Colors
- Main background: White (`#ffffff`) in light mode, dark gray in dark mode
- Panel backgrounds: White (`#ffffff`) in light mode, darker shades in dark mode 
- Secondary backgrounds: Light gray (`background.default`, `#f5f5f5`) in light mode
- Dividers: Light gray (`divider`, `rgba(0, 0, 0, 0.12)`) in light mode

### Color Usage Patterns
- Color-coded status indicators (success/error)
- Border accents for visual hierarchy (left borders)
- Background tints for information hierarchy
- Consistent use of primary color for interactive elements
- Theme-aware styling to ensure visibility in both light and dark modes

### Theme-Aware Color Application
Components should adapt based on theme mode (light/dark) for optimal visibility:

- **Light Mode**:
  - Text: Dark gray to black (`text.primary`)
  - Accents: Primary dark (`primary.dark`)
  - Card headers: Subtle dark overlay (`rgba(0, 0, 0, 0.03)`)

- **Dark Mode**:
  - Text: Light gray to white (`text.primary`)
  - Accents: Primary light (`primary.light`)
  - Card headers: Subtle light overlay (`rgba(255, 255, 255, 0.05)`)

## Components

### Cards
- **Standard Card**: 
  - Rounded corners (`borderRadius: 2`)
  - Optional border (`variant="outlined"`)
  - Subtle shadow (`boxShadow: theme.shadows[1]`)
  - Header area with distinct, theme-aware background
  - Content area with proper padding (`p: 2-3`)

```jsx
<Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
  <Box sx={{ 
    px: 3, 
    py: 2,
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.03)',
  }}>
    <Typography 
      variant="h6"
      sx={{ 
        color: theme.palette.mode === 'dark'
          ? theme.palette.primary.light
          : theme.palette.primary.dark,
        fontWeight: 500
      }}
    >
      Card Title
    </Typography>
  </Box>
  <CardContent>
    {/* Card content goes here */}
  </CardContent>
</Card>
```

### Navigation
- **Sidebar Menu Items**:
  - Icon + Text format
  - Visual indicator for active state (left border accent)
  - Hover state with subtle background change
  - Consistent padding and spacing

```jsx
<ListItemButton 
  selected={item.path === location.pathname}
  onClick={() => handleNavClick(item.path)}
  sx={{
    '&.Mui-selected': {
      backgroundColor: 'rgba(25, 118, 210, 0.08)',
      borderLeft: 4,
      borderColor: 'primary.main',
    },
    '&.Mui-selected:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.12)',
    },
  }}
>
  <ListItemIcon>{item.icon}</ListItemIcon>
  <ListItemText primary={item.text} />
</ListItemButton>
```

### Tabs
- Text with icon (icon position: "start")
- Non-capitalized text (`textTransform: 'none'`)
- Scrollable on smaller screens
- Theme-aware styling for optimal visibility
- Primary color indicator

```jsx
<Box
  sx={{
    borderBottom: '1px solid', 
    borderColor: 'divider', 
    bgcolor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.03)',
  }}
>
  <Tabs 
    value={value} 
    onChange={handleChange} 
    textColor="primary"
    indicatorColor="primary"
    variant="scrollable"
    scrollButtons="auto"
    sx={{ 
      '& .MuiTab-root': {
        textTransform: 'none',
        fontSize: '0.95rem',
        color: theme.palette.mode === 'dark' 
          ? theme.palette.text.secondary 
          : theme.palette.text.primary,
        '&.Mui-selected': {
          color: theme.palette.mode === 'dark'
            ? theme.palette.primary.light
            : theme.palette.primary.dark,
          fontWeight: 500,
        },
        '&:hover': {
          color: theme.palette.mode === 'dark'
            ? theme.palette.primary.light
            : theme.palette.primary.dark,
          opacity: 0.8
        }
      }
    }}
  >
    <Tab icon={<Icon />} iconPosition="start" label="Tab Label" />
  </Tabs>
</Box>
```

### Buttons
- **Primary Actions**: 
  - `variant="contained" color="primary"`
  - Non-capitalized text (`textTransform: 'none'`)
  - Often includes leading icon
  - Rounded corners (`borderRadius: 1`)

- **Secondary Actions**: 
  - `variant="outlined" color="inherit"`
  - Non-capitalized text
  - Subtle hover effect

- **Destructive Actions**: 
  - `variant="contained" color="error"`
  - Clear warning indication
  
```jsx
<Button 
  variant="contained" 
  color="primary" 
  startIcon={<Icon />}
  sx={{ 
    textTransform: 'none',
    borderRadius: 1
  }}
>
  Button Text
</Button>
```

### Form Controls
- **Text Fields**: Outlined variant with consistent styling
- **Selects**: Outlined variant matching text fields
- Clear labels and helper text when needed
- Consistent spacing between form elements

```jsx
<TextField
  label="Field Label"
  variant="outlined"
  fullWidth
  size="medium"
  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
/>
```

### Alerts and Feedback
- **Success Messages**: Success alerts with outlined variant
- **Error Messages**: Error alerts with appropriate icon
- **Info Messages**: Info alerts for guidance
- **Loading States**: Circular progress with accompanying text

```jsx
<Alert 
  severity="success" 
  variant="outlined"
  sx={{ borderRadius: 2 }}
>
  Success message text
</Alert>
```

### Tables
- Header row with background color and bold text
- Zebra striping for better readability
- Hover state for rows
- Compact design for data-dense views
- Rounded corners on the table container

```jsx
<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
  <Table>
    <TableHead sx={{ bgcolor: 'background.default' }}>
      <TableRow>
        <TableCell sx={{ fontWeight: 'bold' }}>Column Name</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Table rows */}
    </TableBody>
  </Table>
</TableContainer>
```

### Status Indicators
- **Chips**: Used for status labels (`<Chip />`)
- **Border Accents**: Left borders with semantic colors
- **Icons**: Color-coded icons for visual cues

```jsx
<Chip 
  label="Status" 
  color="success" 
  size="small"
/>
```

## Dark Mode Considerations

The application supports both light and dark modes. When implementing UI components:

1. **Use theme-aware styling**:
   ```jsx
   const theme = useTheme();
   const isDarkMode = theme.palette.mode === 'dark';
   
   // Apply conditional styling
   sx={{ 
     color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
     bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
   }}
   ```

2. **Ensure sufficient contrast**:
   - Use lighter primary colors (`primary.light`) for emphasis in dark mode
   - Use darker primary colors (`primary.dark`) for emphasis in light mode
   - Text should have adequate contrast against backgrounds in both modes

3. **Test in both modes**:
   - Component styles should be verified in both light and dark modes
   - Pay special attention to interactive elements and status indicators

4. **Consistent Component Presentation**:
   - Headers, cards, and tabs should maintain visual hierarchy in both modes
   - Interactive elements should be easily recognizable regardless of mode

## Visual Patterns

### Information Hierarchy
1. **Cards with Headers**: Content is organized in cards with distinct header areas
2. **Left Border Accents**: Important elements use left border color accents
3. **Background Variations**: Subtle background changes for differentiating sections
4. **Typography Weight**: Font weight variations to indicate hierarchy

### Data Visualization
- **Progress Indicators**: Linear progress bars with semantic coloring for metrics
- **Metric Cards**: Consistent styling for displaying metrics and statistics
- **Data Tables**: Clean table design for displaying structured data

### Spacing System
- Based on Material-UI's spacing system (1 unit = 8px)
- Consistent padding inside containers (`p: 2-3`)
- Consistent margins between elements (`mb: 2-3`)
- Grid system with standard spacing (`spacing: 3`)

## Icons
- Using Material Icons library for consistent look and feel
- Semantic use of icons (proper icon selection for actions/concepts)
- Consistent sizing within contexts

## Animation and Interaction
- Subtle transitions for state changes
- Hover effects for interactive elements
- Loading indicators for asynchronous operations

## Accessibility Considerations
- Sufficient color contrast ratios
- Keyboard navigation support
- Semantic HTML structure
- Screen reader-friendly components

## Implementation Notes

### Style Implementation Approach
The design language is implemented using:
1. Material-UI's `sx` prop for component-specific styling
2. Theme customization for global defaults
3. Consistent component patterns and composition

### Theming
The application uses Material-UI's theming system, with customizations applied to maintain the design language. Refer to the theme configuration for specific customizations.

## Best Practices

1. **Consistency**: Use the established patterns consistently
2. **Component Reuse**: Leverage existing component patterns rather than creating new ones
3. **Responsiveness**: Ensure all components work well across device sizes
4. **Simplicity**: Favor simple, clean designs over complex ones
5. **Accessibility**: Maintain good accessibility practices in all UI components