import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Cpu,
  Settings,
  Database,
  Table2,
  Server,
} from 'lucide-react';
import React, { useState } from 'react';

import { useTables } from '@/hooks/useApi';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tablesOpen, setTablesOpen] = useState(true);
  const { data: tables, isLoading: tablesLoading } = useTables();

  const nav = (path: string) => {
    navigate({ to: path as any });
    onClose?.();
  };

  const tableNav = (table: string) => {
    navigate({ to: '/data/$table', params: { table } });
    onClose?.();
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const isDataActive = location.pathname.startsWith('/data');

  const linkCls = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-blue-500/10 text-blue-400 font-medium'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`;

  const navItems = [
    { label: 'Cluster', path: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Nodes', path: '/nodes', icon: <Server className="h-4 w-4" /> },
    { label: 'Resources', path: '/resources', icon: <Cpu className="h-4 w-4" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 gap-2.5 border-b border-slate-800 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-blue-400 fill-current shrink-0"
          aria-hidden="true"
        >
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.5 3.75v7.14L12 18.82l-7.5-3.75V7.93L12 4.18zm-2 9.82v2l2 1 2-1v-2l-2-1-2 1zm5.5-5.5l-5.5-2.75L4.5 8.5l5.5 2.75 5.5-2.75z" />
        </svg>
        <span className="text-sm font-semibold text-slate-100">Armada Console</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => nav(item.path)}
            className={linkCls(isActive(item.path))}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Data with submenu */}
        <button onClick={() => setTablesOpen(!tablesOpen)} className={linkCls(isDataActive)}>
          <Database className="h-4 w-4" />
          <span className="flex-1 text-left">Data</span>
          {tablesOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {tablesOpen && (
          <div className="ml-3 pl-3 border-l border-slate-800 space-y-0.5">
            <button onClick={() => nav('/data')} className={linkCls(isActive('/data'))}>
              <Table2 className="h-3.5 w-3.5" />
              All Tables
            </button>
            {!tablesLoading &&
              tables?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => tableNav(t.name)}
                  className={linkCls(isActive(`/data/${t.name}`))}
                >
                  <Table2 className="h-3.5 w-3.5" />
                  {t.name}
                </button>
              ))}
            {tablesLoading && <p className="px-3 py-1.5 text-xs text-slate-500">Loading…</p>}
            {!tablesLoading && !tables?.length && (
              <p className="px-3 py-1.5 text-xs text-slate-500">No tables</p>
            )}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <p className="text-xs text-center text-slate-600">ArmadaKV</p>
      </div>
    </div>
  );
};

export default Sidebar;
