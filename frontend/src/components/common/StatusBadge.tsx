import React from 'react';
import { ScanStatus } from '../../types';
import { CheckCircle2, AlertCircle, Clock, Loader2, XCircle } from 'lucide-react';

interface Props {
  status: ScanStatus | string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const s = (status || 'queued').toLowerCase();

  switch (s) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-950/60 text-sky-400 border border-sky-800/60 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Scanning
        </span>
      );
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
          <Clock className="w-3.5 h-3.5" />
          Queued
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-800/60">
          <AlertCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
          {status}
        </span>
      );
  }
};
