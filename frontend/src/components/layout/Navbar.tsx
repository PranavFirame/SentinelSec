import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchCode, Sparkles, Activity } from 'lucide-react';

interface Props {
  isDemoMode?: boolean;
}

export const Navbar: React.FC<Props> = ({ isDemoMode }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Telemetry Dashboard';
    if (path.startsWith('/scans/new')) return 'Initiate Assessment';
    if (path.startsWith('/scans/')) return 'Assessment Results';
    if (path.startsWith('/findings/')) return 'Vulnerability Dossier';
    if (path.startsWith('/history')) return 'Historical Assessment Registry';
    if (path.startsWith('/dependencies')) return 'Dependency Intelligence & CVEs';
    if (path.startsWith('/analytics')) return 'Threat & Posture Analytics';
    if (path.startsWith('/settings')) return 'Scanner Preferences & Health';
    if (path.startsWith('/docs')) return 'Methodology & Documentation';
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-100 tracking-tight m-0">
          {getPageTitle()}
        </h1>
        {isDemoMode && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-purple-950/80 text-purple-300 border border-purple-700/60">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Demo Mode Active
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Engine Active</span>
        </div>

        <Link
          to="/scans/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition shadow-md shadow-emerald-500/10"
        >
          <SearchCode className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>
    </header>
  );
};
