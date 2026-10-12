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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Scanning
        </span>
      );
    case 'queued':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Clock className="w-3.5 h-3.5" />
          Queued
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F9F7] text-[#64716A] border border-[#E5EAE6]">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F7F9F7] text-[#64716A] border border-[#E5EAE6]">
          {status}
        </span>
      );
  }
};
