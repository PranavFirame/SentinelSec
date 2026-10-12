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
    <aside className="w-60 bg-[#0d121f] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Shield className="w-4 h-4 fill-orange-400/20" />
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight text-sm leading-none flex items-center gap-1.5">
              <span>Sentinel</span>
              <span className="text-orange-400">Sec</span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-slate-500 mt-1">
              Defensive Telemetry
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
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>Zero-Cookie Engine</span>
          </span>
          <span className="font-mono text-slate-500">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Non-destructive Probes</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};
