import { Menu } from 'lucide-react';
import React from 'react';

import ThemeToggle from './ThemeToggle';

import { useNavigation } from '@/context/NavigationContext';

interface HeaderProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onDrawerToggle }) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { pageTitle, pageAction } = useNavigation();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={`fixed top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm ${
        isMobile ? 'left-0 right-0' : `left-60 right-0`
      }`}
    >
      <div className="flex items-center justify-between h-full px-6">
        {isMobile && (
          <button
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onDrawerToggle}
            aria-label="open drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center justify-between w-full">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {isMobile ? 'Armada Console' : pageTitle}
          </h1>

          <div className="flex items-center gap-4">
            {pageAction}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
