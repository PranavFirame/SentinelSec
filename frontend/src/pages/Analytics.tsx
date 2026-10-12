import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsTrends, OverviewMetrics } from '../types';
import { SeverityDonutChart } from '../components/charts/SeverityDonutChart';
import { CategoryBarChart } from '../components/charts/CategoryBarChart';
import { ScoreTrendChart } from '../components/charts/ScoreTrendChart';
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  PieChart,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [t, m] = await Promise.all([
        api.getAnalyticsTrends(),
        api.getAnalyticsOverview(),
      ]);
      setTrends(t);
      setMetrics(m);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#64716A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#167653] mb-3" />
        <span className="text-sm font-medium">Rendering threat & posture telemetry...</span>
      </div>
    );
  }

  if (error || !trends || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Error Loading Telemetry</span>
        </div>
        <p className="text-sm">{error || 'Telemetry data unavailable'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-white border border-[#E5EAE6] text-[#17211D] rounded-lg text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const passedTotal = trends.checks_ratio?.passed || 0;
  const failedTotal = trends.checks_ratio?.failed || 0;
  const ratioTotal = passedTotal + failedTotal || 1;
  const passedPct = Math.round((passedTotal / ratioTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#17211D] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#167653]" />
          Security Analytics & Telemetry Visualizations
        </h2>
        <p className="text-xs text-[#64716A] mt-1">
          Explore interactive D3 telemetry on severity distributions, vulnerability category breakdown, and historical posture drift.
        </p>
      </div>

      {/* Row 1: Donut & Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Donut */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl flex flex-col items-center shadow-xs">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#167653]" />
              Severity Tier Breakdown
            </h3>
            <span className="text-xs font-mono text-[#64716A]">Interactive D3.js</span>
          </div>

          <SeverityDonutChart
            data={trends.severity_distribution}
            width={320}
            height={240}
          />

          <div className="w-full grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-[#E5EAE6] text-center text-xs">
            <div>
              <div className="text-red-600 font-mono font-bold">{trends.severity_distribution.critical || 0}</div>
              <div className="text-[10px] text-[#64716A]">Critical</div>
            </div>
            <div>
              <div className="text-orange-600 font-mono font-bold">{trends.severity_distribution.high || 0}</div>
              <div className="text-[10px] text-[#64716A]">High</div>
            </div>
            <div>
              <div className="text-amber-600 font-mono font-bold">{trends.severity_distribution.medium || 0}</div>
              <div className="text-[10px] text-[#64716A]">Medium</div>
            </div>
            <div>
              <div className="text-blue-600 font-mono font-bold">{trends.severity_distribution.low || 0}</div>
              <div className="text-[10px] text-[#64716A]">Low</div>
            </div>
            <div>
              <div className="text-[#64716A] font-mono font-bold">{trends.severity_distribution.informational || 0}</div>
              <div className="text-[10px] text-[#64716A]">Info</div>
            </div>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#167653]" />
              Category Classification Breakdown
            </h3>
            <span className="text-xs font-mono text-[#64716A]">Proportions</span>
          </div>

          <div className="flex items-center justify-center">
            <CategoryBarChart
              data={trends.category_breakdown}
              width={380}
              height={260}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Score Trend Chart & Passed vs Failed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Over Time */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#167653]" />
              Security Score Timeline
            </h3>
            <span className="text-xs font-mono text-[#64716A]">Historical Evolution</span>
          </div>

          <div className="flex items-center justify-center">
            <ScoreTrendChart
              data={trends.trends}
              width={560}
              height={250}
            />
          </div>
        </div>

        {/* Checks Passed vs Failed Progress Card */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#167653]" />
              Compliance Ratio
            </h3>
            <p className="text-xs text-[#64716A]">
              Aggregated ratio of non-destructive checks that passed vs those that failed.
            </p>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-end justify-between font-mono">
              <span className="text-2xl font-bold text-[#167653]">{passedPct}%</span>
              <span className="text-xs text-[#64716A]">{passedTotal} / {ratioTotal} checks</span>
            </div>

            <div className="w-full h-3 bg-[#F7F9F7] rounded-full overflow-hidden border border-[#E5EAE6] flex">
              <div className="bg-[#167653] h-full" style={{ width: `${passedPct}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${100 - passedPct}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#167653] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {passedTotal} Passed
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> {failedTotal} Failed
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E5EAE6] text-[11px] text-[#64716A]">
            Total historical scans evaluated: <span className="font-mono text-[#17211D] font-bold">{metrics.total_scans}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
