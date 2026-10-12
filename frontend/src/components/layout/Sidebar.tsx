import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchCode,
  History,
  PackageSearch,
  BarChart3,
  Settings,
  BookOpen,
  Shield,
  Activity,
  Zap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scans/new', label: 'New Audit', icon: SearchCode },
    { to: '/history', label: 'Audit History', icon: History },
    { to: '/dependencies', label: 'Dependencies', icon: PackageSearch },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <aside className="w-60 bg-[#172123] border-r border-sa flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sa">
          <div className="flex items-end gap-1 h-5 mr-0.5">
            <span className="w-1.5 h-3 bg-coral rounded-xs"></span>
            <span className="w-1.5 h-5 bg-coral rounded-xs"></span>
            <span className="w-1.5 h-4 bg-coral rounded-xs"></span>
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight text-sm leading-none flex items-center gap-1.5">
              <span>Sentinel</span>
              <span className="text-coral">Sec</span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-slate-400 mt-1">
              AnalyticsPro
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
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-coral/15 text-coral border border-coral/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2c2e] border border-transparent'
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
      <div className="p-4 border-t border-sa bg-[#131b1d] text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-coral" />
            <span>Zero Exploits</span>
          </span>
          <span className="font-mono text-slate-500">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Safe Probes</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};
