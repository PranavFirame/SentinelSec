import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SearchCode, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
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
    <header className="h-14 bg-white border-b border-[#E5EAE6] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-[#64716A] hover:text-[#17211D] hover:bg-[#F7F9F7] rounded-lg transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-[14px] sm:text-[15px] font-semibold text-[#17211D] tracking-tight m-0 truncate max-w-[160px] sm:max-w-none">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Live indicator — hidden on mobile to avoid overcrowding */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7F9F7] border border-[#E5EAE6] text-xs text-[#64716A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#167653] animate-pulse" />
          <span className="text-[11px] font-medium">Live</span>
        </div>

        {/* New Audit CTA — Compact on mobile */}
        <Link
          to="/scans/new"
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold bg-[#167653] hover:bg-[#125e43] text-white transition-colors shadow-sm shrink-0"
          title="Launch New Audit"
        >
          <SearchCode className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Audit</span>
          <span className="xs:hidden">Audit</span>
        </Link>

        {/* User Account / Sign Out */}
        {user ? (
          <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-[#E5EAE6]">
            <Link
              to="/settings/profile"
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 rounded-full text-xs font-medium text-[#17211D] hover:bg-[#F7F9F7] transition"
              title={user.email}
            >
              <div className="w-6 h-6 rounded-full bg-[#EAF5EE] text-[#167653] font-bold text-[11px] flex items-center justify-center shrink-0">
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{user.full_name}</span>
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

