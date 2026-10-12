import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchCode,
  History,
  PackageSearch,
  BarChart3,
  Settings,
  BookOpen,
  Zap,
  UserCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [location.pathname]);

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
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5EAE6] flex flex-col justify-between shrink-0 select-none transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-14 md:h-16 flex items-center justify-between px-5 border-b border-[#E5EAE6]">
            <div className="flex items-center gap-3">
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

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-[#64716A] hover:text-[#17211D] hover:bg-[#F7F9F7] rounded-lg transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/settings' || item.to === '/dashboard'}
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
    </>
  );
};
