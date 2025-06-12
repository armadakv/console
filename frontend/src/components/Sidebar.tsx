import {
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Cpu,
  Settings,
  Database,
  Table,
} from 'lucide-react';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useTables } from '@/hooks/useApi';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tablesOpen, setTablesOpen] = useState(true);

  // Fetch tables for submenu
  const { data: tables, isLoading: tablesLoading } = useTables();

  // Navigation items
  const navItems = [
    { text: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    { text: 'Resources', path: '/resources', icon: <Cpu className="h-5 w-5" /> },
    { text: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  // Handle navigation
  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  // Toggle tables submenu
  const handleToggleTables = () => {
    setTablesOpen(!tablesOpen);
  };

  // Handle table selection
  const handleTableClick = (tableName: string) => {
    navigate(`/data/${tableName}`);
    if (onClose) {
      onClose();
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isDataActive = location.pathname.startsWith('/data');

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-primary-600 dark:text-primary-400 tracking-wide">
          Armada Console
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {/* Main navigation items */}
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.text}
              </button>
            </li>
          ))}

          {/* Data item with tables submenu */}
          <li>
            <button
              onClick={handleToggleTables}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDataActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-3" />
                Data
              </div>
              {tablesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Tables submenu */}
            {tablesOpen && (
              <ul className="mt-1 ml-6 space-y-1">
                {/* All Tables option */}
                <li>
                  <button
                    onClick={() => handleNavClick('/data')}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive('/data')
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Table className="h-4 w-4 mr-3" />
                    All Tables
                  </button>
                </li>

                {/* Individual tables */}
                {!tablesLoading &&
                  tables &&
                  tables.map((table) => (
                    <li key={table.id}>
                      <button
                        onClick={() => handleTableClick(table.name)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(`/data/${table.name}`)
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Table className="h-4 w-4 mr-3" />
                        {table.name}
                      </button>
                    </li>
                  ))}

                {/* Loading indicator */}
                {tablesLoading && (
                  <li className="px-3 py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Loading tables...
                    </span>
                  </li>
                )}

                {/* No tables message */}
                {!tablesLoading && (!tables || tables.length === 0) && (
                  <li className="px-3 py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      No tables available
                    </span>
                  </li>
                )}
              </ul>
            )}
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">Armada KV Database</p>
      </div>
    </div>
  );
};

export default Sidebar;
