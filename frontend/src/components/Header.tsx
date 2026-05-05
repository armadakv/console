import { Menu } from 'lucide-react';
import React from 'react';

import { useNavigation } from '@/context/NavigationContext';
import { Breadcrumb } from '@/shared/Breadcrumb';

interface HeaderProps {
  onDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onDrawerToggle }) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const { breadcrumbs, pageAction } = useNavigation();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={`fixed top-0 z-30 h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm ${
        isMobile ? 'left-0 right-0' : 'left-56 right-0'
      }`}
    >
      <div className="flex items-center justify-between h-full px-5">
        {isMobile && (
          <button
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            onClick={onDrawerToggle}
            aria-label="open drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center justify-between w-full min-w-0">
          {isMobile ? (
            <span className="text-sm font-medium text-slate-200">Armada Console</span>
          ) : (
            <Breadcrumb items={breadcrumbs} />
          )}
          <div className="flex items-center gap-3 shrink-0 ml-4">{pageAction}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
