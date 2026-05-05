import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { router } from './router';
import './index.css';

declare global {
  interface Window {
    hideSplashScreen?: () => void;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    window.hideSplashScreen?.();
  }, []);
  return <>{children}</>;
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppInitializer>
        <RouterProvider router={router} />
      </AppInitializer>
    </QueryClientProvider>
  </React.StrictMode>,
);
