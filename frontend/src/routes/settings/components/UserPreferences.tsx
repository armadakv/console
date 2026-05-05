import { Moon } from 'lucide-react';
import React from 'react';

const UserPreferences: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-1">User Preferences</h2>
        <p className="text-sm text-slate-400">Customize your console experience.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Theme</h3>
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-700 bg-slate-800 w-fit">
          <Moon className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium text-slate-200">Dark</p>
            <p className="text-xs text-slate-400 mt-0.5">The console always uses dark mode.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
