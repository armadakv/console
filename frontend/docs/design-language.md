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
- Breakpoints follow Tailwind CSS defaults (sm, md, lg, xl, 2xl)

## Typography

### Text Hierarchy

- **Page Titles**: `text-2xl font-semibold` - Used for main page headers
- **Section Titles**: `text-xl font-semibold` - Used for card headers and major sections
- **Subsection Headers**: `text-lg font-medium` - Used for subsections
- **Labels**: `text-sm font-medium` - Used for form labels and smaller headings
- **Body**: `text-base` - Used for regular paragraph text
- **Secondary Text**: `text-sm text-gray-600 dark:text-gray-400` - Used for descriptions and less prominent text

### Font Weights

- Regular text: 400
- Medium emphasis: 500
- Strong emphasis: 600 (like selected menu items, important labels)

## Color System

### Primary Colors

- Primary: Tailwind blue (`#1976d2` or `blue-700`)
- Secondary: Based on purpose-specific colors

### Semantic Colors

- **Success**: Green (`#4caf50` or `green-500`) - Used for positive status, successful operations
- **Error/Danger**: Red (`#f44336` or `red-500`) - Used for errors, alerts, destructive actions
- **Warning**: Orange (`#ff9800` or `orange-500`) - Used for warnings and cautions
- **Info**: Light Blue (`#2196f3` or `blue-500`) - Used for informational content, hints

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
<div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Card Title</h3>
  </div>
  <div className="p-6">{/* Card content goes here */}</div>
</div>
```

### Navigation

- **Sidebar Menu Items**:
  - Icon + Text format
  - Visual indicator for active state (left border accent)
  - Hover state with subtle background change
  - Consistent padding and spacing

```jsx
<a
  href={item.path}
  className={`flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
    item.path === location.pathname
      ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-500'
      : ''
  }`}
  onClick={(e) => {
    e.preventDefault();
    handleNavClick(item.path);
  }}
>
  <span className="mr-3">{item.icon}</span>
  <span>{item.text}</span>
</a>
```

### Tabs

- Text with icon (icon position: "start")
- Non-capitalized text (`textTransform: 'none'`)
- Scrollable on smaller screens
- Theme-aware styling for optimal visibility
- Primary color indicator

```jsx
<div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
  <div className="flex space-x-2 overflow-x-auto">
    {tabs.map((tab, index) => (
      <button
        key={index}
        onClick={() => handleChange(index)}
        className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap ${
          value === index
            ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400'
        }`}
      >
        {tab.icon && <span className="mr-2">{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
</div>
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
<button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
  <span className="mr-2">
    <Icon />
  </span>
  Button Text
</button>
```

### Form Controls

- **Text Fields**: Outlined variant with consistent styling
- **Selects**: Outlined variant matching text fields
- Clear labels and helper text when needed
- Consistent spacing between form elements

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Field Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
  />
</div>
```

### Alerts and Feedback

- **Success Messages**: Success alerts with outlined variant
- **Error Messages**: Error alerts with appropriate icon
- **Info Messages**: Info alerts for guidance
- **Loading States**: Circular progress with accompanying text

```jsx
<div
  className="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800"
  role="alert"
>
  <svg
    className="flex-shrink-0 inline w-5 h-5 mr-3"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
  </svg>
  <span>Success message text</span>
</div>
```

### Tables

- Header row with background color and bold text
- Zebra striping for better readability
- Hover state for rows
- Compact design for data-dense views
- Rounded corners on the table container

```jsx
<div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th
          scope="col"
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          Column Name
        </th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

### Status Indicators

- **Chips**: Used for status labels (`<Chip />`)
- **Border Accents**: Left borders with semantic colors
- **Icons**: Color-coded icons for visual cues

```jsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
  Status
</span>
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
