import React, { Suspense, useState, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import { LoadingState } from './components/shared/LoadingState';
import Sidebar from './components/Sidebar';
import { NavigationProvider } from './context/NavigationContext';

// Lazy load route components for code splitting
const DashboardPage = lazy(() => import('./routes/dashboard/DashboardPage'));
const DataPage = lazy(() => import('./routes/data/DataPage'));
const AddKeyValuePage = lazy(() => import('./routes/data/AddKeyValuePage'));
const EditKeyValuePage = lazy(() => import('./routes/data/EditKeyValuePage'));
const ResourcesPage = lazy(() => import('./routes/resources/ResourcesPage'));
const SettingsPage = lazy(() => import('./routes/settings/SettingsPage'));

// Drawer width for the sidebar
const drawerWidth = 240;

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* App bar */}
        <Header drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} />

        {/* Sidebar / Navigation drawer */}
        <nav className={`${isMobile ? 'w-0' : 'w-60'} shrink-0`}>
          {/* Mobile drawer */}
          {isMobile && (
            <div className={`fixed inset-0 z-40 ${mobileOpen ? 'block' : 'hidden'}`}>
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle} />
              <div className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-gray-800 shadow-lg">
                <Sidebar onClose={handleDrawerToggle} />
              </div>
            </div>
          )}

          {/* Desktop drawer - permanent */}
          {!isMobile && (
            <div className="fixed left-0 top-0 h-full w-60 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Sidebar />
            </div>
          )}
        </nav>

        {/* Main content */}
        <main className={`flex flex-col flex-grow ${isMobile ? 'w-full' : 'w-[calc(100%-15rem)]'}`}>
          <div className="h-16" /> {/* This adds spacing below the app bar */}
          <div className="flex-grow px-6 py-6">
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/data" element={<DataPage />} />
                <Route path="/data/:table" element={<DataPage />} />
                <Route path="/data/:table/add" element={<AddKeyValuePage />} />
                <Route path="/data/:table/edit/:key" element={<EditKeyValuePage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </main>
      </div>
    </NavigationProvider>
  );
};

export default App;
