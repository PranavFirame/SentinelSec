import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchCode, Sparkles, Radio, Globe, Shield } from 'lucide-react';

interface Props {
  isDemoMode?: boolean;
}

export const Navbar: React.FC<Props> = ({ isDemoMode }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Security Overview';
    if (path.startsWith('/scans/new')) return 'New Security Audit';
    if (path.startsWith('/scans/')) return 'Assessment Dossier';
    if (path.startsWith('/findings/')) return 'Finding Investigation';
    if (path.startsWith('/history')) return 'Audit Registry';
    if (path.startsWith('/dependencies')) return 'Dependency Intel';
    if (path.startsWith('/analytics')) return 'Posture Analytics';
    if (path.startsWith('/settings')) return 'Preferences & Health';
    if (path.startsWith('/docs')) return 'Documentation';
    return 'Telemetry';
  };

  return (
    <header className="h-16 bg-[#172123]/95 backdrop-blur border-b border-sa px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Simple Analytics triple bar mark */}
        <div className="flex items-end gap-1 h-4 mr-1">
          <span className="w-1 h-2.5 bg-coral rounded-xs"></span>
          <span className="w-1 h-4 bg-coral rounded-xs"></span>
          <span className="w-1 h-3 bg-coral rounded-xs"></span>
        </div>

        <h1 className="text-base font-bold text-slate-100 tracking-tight m-0">
          {getPageTitle()}
        </h1>

        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-coral/15 text-coral border border-coral/30">
            <Sparkles className="w-3 h-3 text-coral" />
            Demo Mode Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Simple Analytics Style Live Beacon */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2c2e] border border-sa text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="text-[11px] text-slate-300 font-medium">Telemetry Live</span>
        </div>

        {/* Theme Sun Indicator */}
        <span className="text-amber-400 cursor-pointer p-1 hover:text-amber-300 text-sm" title="Simple Analytics Sun">
          ☀️
        </span>

        {/* Coral-red pill New Scan button matching Simple Analytics CTA */}
        <Link
          to="/scans/new"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-coral hover:bg-rose-500 text-white transition-all shadow-sm"
        >
          <SearchCode className="w-3.5 h-3.5" />
          <span>New Audit</span>
        </Link>
      </div>
    </header>
  );
};
