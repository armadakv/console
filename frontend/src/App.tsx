import { Outlet } from '@tanstack/react-router';
import React, { useState } from 'react';

import Footer from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { NavigationProvider } from './context/NavigationContext';

const App: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-slate-950">
        <Header onDrawerToggle={() => setMobileOpen(!mobileOpen)} />

        {/* Sidebar */}
        {isMobile && (
          <div className={`fixed inset-0 z-40 ${mobileOpen ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-56 bg-slate-900">
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full w-56 border-r border-slate-800 bg-slate-900">
            <Sidebar />
          </div>
        )}

        {/* Main */}
        <main className={`flex flex-col flex-grow ${isMobile ? 'w-full' : 'ml-56'}`}>
          <div className="h-14" />
          <div className="flex-grow px-6 py-6">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </NavigationProvider>
  );
};

export default App;
