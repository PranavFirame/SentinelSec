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
  Zap,
  UserCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/scans/new', label: 'New Audit', icon: SearchCode },
    { to: '/history', label: 'Audit History', icon: History },
    { to: '/dependencies', label: 'Dependencies', icon: PackageSearch },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings/profile', label: 'Account Profile', icon: UserCheck },
    { to: '/settings', label: 'Engine Settings', icon: Settings },
    { to: '/docs', label: 'Docs', icon: BookOpen },
  ];


  return (
    <aside className="w-60 bg-white border-r border-[#E5EAE6] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#E5EAE6]">
          {/* Simple Analytics triple-bar mark in brand green */}
          <div className="flex items-end gap-[3px] h-5 mr-0.5 shrink-0">
            <span className="w-1.5 h-3 bg-[#167653] rounded-sm" />
            <span className="w-1.5 h-5 bg-[#167653] rounded-sm" />
            <span className="w-1.5 h-4 bg-[#167653] rounded-sm" />
          </div>
          <div>
            <div className="font-bold text-[#17211D] tracking-tight text-sm leading-none">
              Sentinel<span className="text-[#167653]">Sec</span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[#64716A] mt-1">
              AnalyticsPro
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#EAF5EE] text-[#167653] font-semibold'
                      : 'text-[#64716A] hover:text-[#17211D] hover:bg-[#F7F9F7]'
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

      {/* Footer */}
      <div className="p-4 border-t border-[#E5EAE6] text-xs">
        <div className="flex items-center justify-between text-[11px] text-[#64716A] mb-1.5 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#167653]" />
            <span>Zero Exploits</span>
          </span>
          <span className="font-mono text-[#9aaba3]">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#64716A]">
          <span>Safe Probes</span>
          <span className="inline-flex items-center gap-1.5 text-[#167653] font-medium font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#167653] animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};
