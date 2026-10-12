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
    <header className="h-16 bg-[#0b0f19]/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-100 tracking-tight m-0">
          {getPageTitle()}
        </h1>

        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-orange-950/70 text-orange-300 border border-orange-700/60">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Demo Mode Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-3.5">
        {/* Simple Analytics Style Live Beacon */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span className="text-[11px] text-slate-400">Live Posture Active</span>
        </div>

        <Link
          to="/scans/new"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 transition shadow-sm shadow-orange-500/20"
        >
          <SearchCode className="w-3.5 h-3.5" />
          <span>Audit URL</span>
        </Link>
      </div>
    </header>
  );
};
