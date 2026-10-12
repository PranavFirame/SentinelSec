import React from 'react';
import { SeverityLevel } from '../../types';

interface Props {
  severity: SeverityLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'sm' }) => {
  const sev = (severity || 'informational').toLowerCase();

  const configs: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-600',
      label: 'Critical',
    },
    high: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-600',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Medium',
    },
    low: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Low',
    },
    informational: {
      bg: 'bg-[#F7F9F7]',
      text: 'text-[#64716A]',
      border: 'border-[#E5EAE6]',
      dot: 'bg-[#9aaba3]',
      label: 'Info',
    },
  };

  const current = configs[sev] || configs.informational;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-mono tracking-wide uppercase border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
};
