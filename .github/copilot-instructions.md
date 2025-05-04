# ArmadaKV Console Copilot Instructions

## Project Overview
Armada Console is a web-based dashboard for accessing data and managing clusters in the Armada KV distributed key-value database. The frontend is built with React and TypeScript, while the backend is written in Go.

## Technology Stack

### Backend
- **Language**: Go 1.24+
- **Web Framework**: Chi router
- **Logging**: Zap (structured logging)
- **Communication**: gRPC client for ArmadaKV interaction

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **UI Components**: Material-UI (MUI)
- **State Management**: React Query
- **Routing**: React Router

## Frontend Development

### Dependencies
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Material-UI](https://mui.com/)
- [React Query](https://tanstack.com/query/latest)

### Build Process
The frontend uses **Vite** as the build tool, not webpack. All build processes are defined in the `package.json` file:

- Install dependencies:
  ```bash
  cd frontend
  pnpm install
  ```

- Start the development server:
  ```bash
  pnpm start  # Runs vite in dev mode
  ```

- Build for production:
  ```bash
  pnpm run build  # Creates optimized build with vite
  ```

### Project Structure
- `frontend/` - Frontend React application
  - `src/` - Source code
    - `components/` - Reusable React components
    - `hooks/` - Custom React hooks
    - `routes/` - Page-level components
    - `api/` - API client
    - `types/` - TypeScript type definitions
    - `App.tsx` - Main application component
    - `index.tsx` - Entry point
  - `docs/` - Documentation including design language

## Backend Development

### Dependencies
- [Go](https://golang.org/) 1.24+
- [Go modules](https://golang.org/ref/mod)
- [Chi Router](https://github.com/go-chi/chi)
- [Zap](https://github.com/uber-go/zap) for logging
- [gRPC](https://grpc.io/) for Armada communication

### Build Process
```bash
# Install dependencies
go mod tidy

# Build
go build -o armada-console

# Run
./armada-console
```

### Project Structure
- `main.go` - Entry point
- `backend/` - Go packages
  - `api/` - API endpoints
  - `armada/` - Client for Armada server
    - `pb/` - Generated Protocol Buffers code
- `proto/` - Protocol Buffer definitions
- `hack/` - Development and code generation scripts

## Design Language Guidelines

The frontend follows a specific design language documented in `frontend/docs/design-language.md`. When generating or modifying UI code, adhere to these guidelines:

### Layout Structure
- **Left Sidebar Navigation**: Primary navigation using a 240px width drawer on desktop
- **Responsive Design**: Collapsible on mobile (accessed via header menu button)
- **Page Layout**: Header, content area with consistent padding, and minimal footer

### Component Patterns
- **Cards**: 
  ```jsx
  <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <Box sx={{ 
      px: 3, 
      py: 2,
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.default',
    }}>
      <Typography variant="h6">Card Title</Typography>
    </Box>
    <CardContent>
      {/* Card content here */}
    </CardContent>
  </Card>
  ```

- **Buttons**: 
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

- **Tables**: Header row with background color, hover states for rows
  ```jsx
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
    <Table>
      <TableHead sx={{ bgcolor: 'background.default' }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>Column Name</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {/* Table rows here */}
      </TableBody>
    </Table>
  </TableContainer>
  ```

### Visual Styling
- **Typography**: 
  - Page titles: `Typography variant="h5"`
  - Section titles: `Typography variant="h6"`
  - Subsections: `Typography variant="subtitle1" fontWeight="medium"`
  
- **Colors**: Use semantic colors consistently
  - Primary: Blue (`#1976d2`)
  - Success: Green (`#4caf50`)
  - Error/Danger: Red (`#f44336`)
  - Warning: Orange (`#ff9800`)
  - Info: Light Blue (`#2196f3`)

- **Status Indicators**: 
  - Use Chips for status labels
  - Left borders with semantic colors
  - Color-coded icons for visual cues

### Best Practices
1. Follow the established patterns consistently
2. Use the Material-UI `sx` prop for styling
3. Maintain responsiveness across device sizes
4. Use semantic color coding (success/error/warning)
5. Follow accessibility guidelines for contrast and keyboard navigation

## When Generating UI Code
- Reference the design language documentation in `frontend/docs/design-language.md`
- Maintain consistent styling across components
- Use the established component patterns
- Implement responsive layouts that work on mobile and desktop
- Use Material Icons for a consistent icon set
- Respect the established typography hierarchy

## API Integration

The dashboard integrates with the Armada server through a gRPC API, which is implemented in the `backend/armada` package.

### API Endpoints
- `/api/status` - Get the status of the Armada server
- `/api/kv` - Get, put, or delete key-value pairs
- `/api/cluster` - Get information about the Armada cluster
- `/api/metrics` - Get metrics from the Armada server

## Development Workflow
- For full-stack development, use `make dev` which starts both frontend and backend with hot reloading
- For frontend-only changes, use `pnpm start` in the frontend directory
- For backend-only changes, Go's standard tooling is sufficient
