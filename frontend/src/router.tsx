import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';

import App from './App';
import { LoadingState } from './components/shared/LoadingState';

const ClusterPage = lazy(() => import('./routes/dashboard/ClusterPage'));
const DataPage = lazy(() => import('./routes/data/DataPage'));
const AddKeyValuePage = lazy(() => import('./routes/data/AddKeyValuePage'));
const EditKeyValuePage = lazy(() => import('./routes/data/EditKeyValuePage'));
const NodesPage = lazy(() => import('./routes/nodes/NodesPage'));
const NodePage = lazy(() => import('./routes/nodes/NodePage'));
const ResourcesPage = lazy(() => import('./routes/resources/ResourcesPage'));
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

export const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: () => (
    <Lazy>
      <DataPage />
    </Lazy>
  ),
});

export const dataTableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data/$table',
  component: () => (
    <Lazy>
      <DataPage />
    </Lazy>
  ),
});

export const dataTableAddRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data/$table/add',
  component: () => (
    <Lazy>
      <AddKeyValuePage />
    </Lazy>
  ),
});

export const dataTableEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data/$table/edit/$key',
  component: () => (
    <Lazy>
      <EditKeyValuePage />
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

export const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources',
  component: () => (
    <Lazy>
      <ResourcesPage />
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  dataRoute,
  dataTableRoute,
  dataTableAddRoute,
  dataTableEditRoute,
  nodesRoute,
  nodeRoute,
  resourcesRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
