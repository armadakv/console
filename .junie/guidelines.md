# Console
Armada console is UI for accessing data and managing clusters in Armada KV database.

## Links
- [Server project](https://github.com/armadakv/armada)
- [Documentation](https://github.com/armadakv/docs)
- [Go client](https://github.com/armadakv/armada-go)
- [Java client](https://github.com/armadakv/armada-java)

## Frontend
Frontend is build using React and TypeScript. The frontend is located in the `frontend` directory.
### Frontend dependencies
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [Material-UI](https://mui.com/)
- [React Query](https://react-query.tanstack.com/)

### Design Language
The project follows a consistent design language documented in `frontend/docs/design-language.md`. Key principles include:

- **Layout Structure**: Left-side navigation drawer (240px width) with responsive behavior
- **Component Patterns**: 
  - Cards with consistent styling (rounded corners, headers with distinct backgrounds)
  - Tables with standard styling (header with background color, hover states)
  - Form controls with outlined variants
  - Left border accents for status indicators
- **Visual Styling**:
  - Consistent spacing system (based on Material-UI's 8px grid)
  - Typography hierarchy (h5 for page titles, h6 for section titles)
  - Semantic color usage (primary, success, error, warning, info)
  - Icons from Material Icons library

When making UI changes, refer to the complete design language documentation to maintain visual consistency across the application.

### Frontend build
The frontend is build using `npm` and `webpack`. The build process is defined in the `package.json` file. The build process includes:
- Installing dependencies
- Building the frontend
- Copying the build to the `static` directory
- Starting the server

### Frontend development
- Install dependencies
```bash
cd frontend
npm install
```
- Start the development server
```bash
npm start
```
- Build the frontend to verify it works
```bash
cd frontend
npm run build
```
### Frontend architecture
- `src/` - Source code
  - `components/` - React components
  - `styles/` - CSS styles
  - `hooks/` - Custom hooks
  - `utils/` - Utility functions
  - `api/` - API calls
  - `types/` - TypeScript types
  - `App.tsx` - Main application component
  - `index.tsx` - Entry point for the application
- Frontend access the Aramada server through APIs exposed by the backend. The APIs are defined in the `pkg/api` directory. The frontend uses `axios` to make API calls to the backend.

## Backend
Backand is build using Go and is located in the `backend` directory.
### Backend dependencies
- [Go](https://golang.org/)
- [Go modules](https://golang.org/doc/go1.11#modules)
### Backend build
- Install Go dependencies
```bash
go mod tidy
```
- Build the backend
```bash
go build -o armada-console
```
- Start the backend
```bash
./armada-console
```
- Access the backend
```bash
curl http://localhost:8080
```
- Access the frontend
```bash
open http://localhost:8080
```
### Backend architecture
- `main.go` - Entry point for the application
- `backend/` - Go packages for backend functionality
  - `api/` - API endpoints for the dashboard
  - `armada/` - Client for interacting with the Armada server

### Armada API Integration

The dashboard integrates with the Armada server through a gRPC API. The integration is implemented in the `backend/armada` package, which provides a client for interacting with the Armada server.

#### API Endpoints

The dashboard exposes the following API endpoints:

- `/api/status` - Get the status of the Armada server
- `/api/kv` - Get, put, or delete key-value pairs
- `/api/cluster` - Get information about the Armada cluster
- `/api/metrics` - Get metrics from the Armada server

#### Using the Armada Client

To use the Armada client in your code:

1. Import the armada package:
   ```
   import "github.com/armadakv/console/backend/armada"
   ```

2. Create a new client:
   ```
   client, err := armada.NewClient("localhost:8081")
   if err != nil {
       // Handle error
   }
   defer client.Close()
   ```

3. Get server status:
   ```
   ctx := context.Background()
   status, err := client.GetStatus(ctx)
   if err != nil {
       // Handle error
   }
   fmt.Printf("Server status: %s - %s\n", status.Status, status.Message)
   ```

4. Get cluster information:
   ```
   clusterInfo, err := client.GetClusterInfo(ctx)
   if err != nil {
       // Handle error
   }
   fmt.Printf("Cluster leader: %s\n", clusterInfo.Leader)
   ```

5. Get key-value pairs:
   ```
   pairs, err := client.GetKeyValuePairs(ctx, "prefix", 100)
   if err != nil {
       // Handle error
   }
   for _, pair := range pairs {
       fmt.Printf("Key: %s, Value: %s\n", pair.Key, pair.Value)
   }
   ```

6. Put a key-value pair:
   ```
   err = client.PutKeyValue(ctx, "key", "value")
   if err != nil {
       // Handle error
   }
   ```

7. Delete a key:
   ```
   err = client.DeleteKey(ctx, "key")
   if err != nil {
       // Handle error
   }
   ```

## AI Assistant Guidelines

The project uses AI assistants (like Junie or Claude) to help with development. Here are guidelines for effective AI usage with this project:

### Effective Prompting

- **Be specific**: Provide detailed context about the Armada KV database and console when asking questions
- **Include file paths**: When asking about specific code, include the file path for better context
- **Share examples**: Where possible, provide examples of expected input/output
- **Iterative refinement**: For complex tasks, break them into smaller steps and refine iteratively

### Common AI Use Cases

- Code generation for new features
- Debugging and troubleshooting
- Documentation improvements
- Code refactoring
- Test case creation
- API design feedback

### Example Prompts

1. **Adding a new API endpoint**:
   ```
   I need to add a new API endpoint to the backend that retrieves metrics history.
   The route should be "/api/metrics/history" and should accept query params for
   timeframe and metric names. Here's the existing metrics endpoint for reference:
   [paste relevant code]
   ```

2. **Improving React component**:
   ```
   This component in frontend/src/components/ClusterStatus.tsx is loading data 
   but not handling errors properly. Help me implement proper error handling with
   a user-friendly message when the API call fails.
   ```

3. **Documentation improvement**:
   ```
   Review this documentation section about API integration and suggest improvements
   for clarity, especially around authentication and error handling.
   ```

### AI Limitations

- AI may not understand the specific architecture of Armada KV without sufficient context
- Code suggestions may need testing and validation
- Security-related code should always be carefully reviewed
- Generated code might not follow all project conventions without specific guidance

### Best Practices

- Always review and test AI-generated code
- Use AI suggestions as a starting point, not the final solution
- Share context about Armada's specific requirements and constraints
- For complex domain-specific tasks, provide more detailed background information

`