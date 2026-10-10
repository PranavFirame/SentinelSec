import React from 'react';

interface Props {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<Props> = ({ score, size = 'md', showLabel = true }) => {
  if (score === undefined || score === null) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-500">
        <span className="text-xl font-bold font-mono">--</span>
        {showLabel && <span className="text-xs text-slate-400">Not Scored</span>}
      </div>
    );
  }

  const s = Math.max(0, Math.min(100, score));

  // Determine Grade & Color
  let grade = 'F';
  let colorClass = 'text-rose-500';
  let strokeClass = '#f43f5e';
  let bgClass = 'bg-rose-950/20 border-rose-900/40';

  if (s >= 90) {
    grade = 'A';
    colorClass = 'text-emerald-400';
    strokeClass = '#34d399';
    bgClass = 'bg-emerald-950/20 border-emerald-900/40';
  } else if (s >= 80) {
    grade = 'B';
    colorClass = 'text-teal-400';
    strokeClass = '#2dd4bf';
    bgClass = 'bg-teal-950/20 border-teal-900/40';
  } else if (s >= 65) {
    grade = 'C';
    colorClass = 'text-amber-400';
    strokeClass = '#fbbf24';
    bgClass = 'bg-amber-950/20 border-amber-900/40';
  } else if (s >= 45) {
    grade = 'D';
    colorClass = 'text-orange-400';
    strokeClass = '#fb923c';
    bgClass = 'bg-orange-950/20 border-orange-900/40';
  }

  const dimensions = {
    sm: { size: 54, stroke: 5, text: 'text-base', grade: 'text-xs' },
    md: { size: 90, stroke: 7, text: 'text-2xl', grade: 'text-sm' },
    lg: { size: 140, stroke: 10, text: 'text-4xl', grade: 'text-lg' },
  }[size];

  const radius = (dimensions.size - dimensions.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (s / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.size}
          height={dimensions.size}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={dimensions.stroke}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke={strokeClass}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-bold leading-none ${dimensions.text} ${colorClass}`}>
            {s}
          </span>
          <span className={`font-semibold text-slate-400 leading-none mt-0.5 ${dimensions.grade}`}>
            Grade {grade}
          </span>
        </div>
      </div>

      {showLabel && (
        <span className="text-xs text-slate-400 mt-2 font-medium tracking-wide">
          Security Score
        </span>
      )}
    </div>
  );
};
