import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchCode, Sparkles } from 'lucide-react';

interface Props {
  isDemoMode?: boolean;
}

export const Navbar: React.FC<Props> = ({ isDemoMode }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Security Overview';
    if (path.startsWith('/scans/new')) return 'New Security Audit';
    if (path.startsWith('/scans/')) return 'Assessment Results';
    if (path.startsWith('/findings/')) return 'Finding Details';
    if (path.startsWith('/history')) return 'Audit History';
    if (path.startsWith('/dependencies')) return 'Dependencies';
    if (path.startsWith('/analytics')) return 'Analytics';
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

        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]">
            <Sparkles className="w-3 h-3" />
            Demo Mode
          </span>
        )}
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
      </div>
    </header>
  );
};
