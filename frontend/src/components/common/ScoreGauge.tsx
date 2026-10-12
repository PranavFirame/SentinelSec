import React from 'react';

interface Props {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<Props> = ({ score, size = 'md', showLabel = true }) => {
  if (score === undefined || score === null) {
    return (
      <div className="flex flex-col items-center justify-center text-[#64716A]">
        <span className="text-xl font-bold font-mono">--</span>
        {showLabel && <span className="text-xs text-[#64716A]">Not Scored</span>}
      </div>
    );
  }

  const s = Math.max(0, Math.min(100, score));

  // Determine Grade & Color
  let grade = 'F';
  let colorClass = 'text-red-600';
  let strokeClass = '#DC2626';

  if (s >= 90) {
    grade = 'A';
    colorClass = 'text-[#167653]';
    strokeClass = '#167653';
  } else if (s >= 80) {
    grade = 'B';
    colorClass = 'text-emerald-600';
    strokeClass = '#059669';
  } else if (s >= 65) {
    grade = 'C';
    colorClass = 'text-amber-600';
    strokeClass = '#D97706';
  } else if (s >= 45) {
    grade = 'D';
    colorClass = 'text-orange-600';
    strokeClass = '#EA580C';
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
            stroke="#E5EAE6"
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
          <span className={`font-semibold text-[#64716A] leading-none mt-0.5 ${dimensions.grade}`}>
            Grade {grade}
          </span>
        </div>
      </div>

      {showLabel && (
        <span className="text-xs text-[#64716A] mt-2 font-medium tracking-wide">
          Security Score
        </span>
      )}
    </div>
  );
};
