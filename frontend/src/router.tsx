import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';

import App from './App';
import { LoadingState } from './components/shared/LoadingState';

const ClusterPage = lazy(() => import('./routes/cluster/ClusterPage'));
const NodesPage = lazy(() => import('./routes/nodes/NodesPage'));
const NodePage = lazy(() => import('./routes/nodes/NodePage'));
const QueryPage = lazy(() => import('./routes/query/QueryPage'));
const SettingsPage = lazy(() => import('./routes/settings/SettingsPage'));

const Lazy: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState />}>{children}</Suspense>
);

export const rootRoute = createRootRoute({ component: App });

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Lazy>
      <ClusterPage />
    </Lazy>
  ),
});

export const nodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nodes',
  component: () => (
    <Lazy>
      <NodesPage />
    </Lazy>
  ),
});

export const nodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nodes/$nodeId',
  component: () => (
    <Lazy>
      <NodePage />
    </Lazy>
  ),
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <Lazy>
      <SettingsPage />
    </Lazy>
  ),
});

export const queryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/query',
  component: () => (
    <Lazy>
      <QueryPage />
    </Lazy>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  nodesRoute,
  nodeRoute,
  queryRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
