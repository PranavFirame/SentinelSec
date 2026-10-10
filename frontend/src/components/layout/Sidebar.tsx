import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  SearchCode,
  History,
  PackageSearch,
  BarChart3,
  Settings,
  BookOpen,
  Activity,
  Lock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scans/new', label: 'New Scan', icon: SearchCode },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/dependencies', label: 'Dependency Intel', icon: PackageSearch },
    { to: '/analytics', label: 'Security Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Scanner Settings', icon: Settings },
    { to: '/docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight text-base leading-none">
              Sentinel<span className="text-emerald-400">Sec</span>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">
              AnalyticsPro Engine
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] mb-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Defensive Non-Destructive</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine v1.0.0</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </aside>
  );
};
