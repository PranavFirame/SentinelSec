import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SearchCode, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Security Overview';
    if (path.startsWith('/scans/new')) return 'New Security Audit';
    if (path.startsWith('/scans/')) return 'Assessment Results';
    if (path.startsWith('/findings/')) return 'Finding Details';
    if (path.startsWith('/history')) return 'Audit History';
    if (path.startsWith('/dependencies')) return 'Dependencies';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/settings/profile')) return 'Profile & Security';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/docs')) return 'Documentation';
    return 'Dashboard';
  };

  return (
    <header className="h-14 bg-white border-b border-[#E5EAE6] px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-[#17211D] tracking-tight m-0">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F9F7] border border-[#E5EAE6] text-xs text-[#64716A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#167653] animate-pulse" />
          <span className="text-[11px] font-medium">Live</span>
        </div>

        {/* New Audit CTA — Simple Analytics green pill */}
        <Link
          to="/scans/new"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold bg-[#167653] hover:bg-[#125e43] text-white transition-colors shadow-sm"
        >
          <SearchCode className="w-3.5 h-3.5" />
          <span>New Audit</span>
        </Link>

        {/* User Account / Sign Out */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5EAE6]">
            <Link
              to="/settings/profile"
              className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium text-[#17211D] hover:bg-[#F7F9F7] transition"
              title={user.email}
            >
              <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#167653] font-bold text-[11px] flex items-center justify-center">
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#64716A] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-semibold text-[#167653] hover:underline"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

