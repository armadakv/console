import { Link } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      <Link to="/" className="text-slate-400 hover:text-slate-200 flex items-center">
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-slate-500" />
          {item.href && !item.current ? (
            <Link to={item.href as any} className="text-slate-400 hover:text-slate-200 truncate">
              {item.label}
            </Link>
          ) : (
            <span
              className={`truncate ${
                item.current ? 'text-slate-100 font-medium' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
