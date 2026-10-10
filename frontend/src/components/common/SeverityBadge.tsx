import React from 'react';
import { SeverityLevel } from '../../types';

interface Props {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'sm' }) => {
  const sev = (severity || 'informational').toLowerCase();

  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    critical: {
      bg: 'bg-rose-950/70',
      text: 'text-rose-400',
      border: 'border-rose-700/60',
      label: 'Critical',
    },
    high: {
      bg: 'bg-orange-950/70',
      text: 'text-orange-400',
      border: 'border-orange-700/60',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-950/70',
      text: 'text-amber-300',
      border: 'border-amber-700/60',
      label: 'Medium',
    },
    low: {
      bg: 'bg-cyan-950/70',
      text: 'text-cyan-400',
      border: 'border-cyan-700/60',
      label: 'Low',
    },
    informational: {
      bg: 'bg-slate-800/70',
      text: 'text-slate-300',
      border: 'border-slate-700/60',
      label: 'Info',
    },
  };

  const current = configs[sev] || configs.informational;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-mono tracking-wide uppercase border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {current.label}
    </span>
  );
};
