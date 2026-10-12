import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreakdownItem {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  percentage?: number;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

interface Props {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  barColor?: string; // e.g. 'bg-orange-500/15' or 'bg-emerald-500/15'
  accentTextColor?: string;
  onItemClick?: (item: BreakdownItem) => void;
  emptyText?: string;
  maxDisplay?: number;
}

export const SimpleBreakdownTable: React.FC<Props> = ({
  title,
  subtitle,
  items,
  barColor = 'bg-orange-500/15',
  accentTextColor = 'text-orange-400',
  onItemClick,
  emptyText = 'No data recorded',
  maxDisplay = 6,
}) => {
  const [showAll, setShowAll] = useState(false);

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map(i => i.value), 1);

  const displayedItems = showAll ? items : items.slice(0, maxDisplay);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="font-mono text-xs font-semibold text-slate-400">
            {total} Total
          </span>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">{emptyText}</div>
        ) : (
          <div className="space-y-1.5">
            {displayedItems.map(item => {
              const widthPct = Math.max(3, Math.round((item.value / maxValue) * 100));
              const pctOfTotal = total > 0 ? Math.round((item.value / total) * 100) : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => onItemClick && onItemClick(item)}
                  className={`sa-bar-row group p-2.5 rounded-lg flex items-center justify-between relative cursor-pointer hover:bg-slate-800/50 transition`}
                >
                  {/* Subtle Background Proportion Bar */}
                  <div
                    className={`sa-bar-bg ${barColor}`}
                    style={{ width: `${widthPct}%` }}
                  />

                  {/* Left Label */}
                  <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-4">
                    {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 group-hover:text-white transition truncate">
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    {item.badge && <span className="shrink-0">{item.badge}</span>}
                  </div>

                  {/* Right Metric */}
                  <div className="relative z-10 flex items-center gap-3 shrink-0 font-mono text-xs text-right">
                    <span className="font-bold text-slate-200">{item.value}</span>
                    <span className="text-[10px] text-slate-500 w-8">{pctOfTotal}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer view more */}
      {items.length > maxDisplay && (
        <div className="pt-3 border-t border-slate-800/60 mt-3 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-slate-400 hover:text-orange-400 transition font-medium inline-flex items-center gap-1"
          >
            <span>{showAll ? 'Show Fewer' : `View All (${items.length})`}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
