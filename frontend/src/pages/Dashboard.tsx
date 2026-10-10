import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { OverviewMetrics, AnalyticsTrends } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityDonutChart } from '../components/charts/SeverityDonutChart';
import { CategoryBarChart } from '../components/charts/CategoryBarChart';
import { ScoreTrendChart } from '../components/charts/ScoreTrendChart';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  History,
  SearchCode,
  Sparkles,
  Trash2,
  RefreshCw,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [m, t] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsTrends(),
      ]);
      setMetrics(m);
      setTrends(t);
    } catch (err: any) {
      setError(err.message || 'Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDemo = async () => {
    try {
      const res = await api.seedDemoData();
      setActionMessage(res.message);
      await loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClearDemo = async () => {
    try {
      const res = await api.clearDemoData();
      setActionMessage(res.message);
      await loadData();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <span className="text-sm font-medium">Loading security telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Error Loading Dashboard</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-lg text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Demo Controls */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {metrics.is_demo_mode && (
        <div className="p-4 bg-purple-950/30 border border-purple-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="font-semibold">Simulated Telemetry Mode:</span> Displaying representative baseline scans. You can initiate real assessments against authorized URLs anytime.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearDemo}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-medium transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo Scans</span>
            </button>
          </div>
        </div>
      )}

      {!metrics.is_demo_mode && metrics.total_scans === 0 && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <SearchCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">No Assessment Records Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Initiate your first automated security scan against an authorized target, or seed simulated baseline data to explore telemetry charts.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/scans/new"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition"
            >
              Start First Scan
            </Link>
            <button
              onClick={handleSeedDemo}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg text-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Seed Demo Data</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Security Posture
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
              {metrics.overall_score}
              <span className="text-xs text-slate-500 font-sans ml-1">/ 100</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Weighted automated score</p>
          </div>
          <ScoreGauge score={metrics.overall_score} size="sm" showLabel={false} />
        </div>

        {/* Total Scans Card */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Assessments Run
            </span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {metrics.total_scans}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="text-emerald-400 font-medium">{metrics.passed_checks} passed checks</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">{metrics.failed_checks} failed</span>
          </div>
        </div>

        {/* Vulnerabilities Found Card */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Active Findings
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {metrics.total_findings}
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <span className="text-rose-400 font-mono font-medium">{metrics.critical_findings} Crit</span>
            <span className="text-slate-600">•</span>
            <span className="text-orange-400 font-mono font-medium">{metrics.high_findings} High</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-mono font-medium">{metrics.medium_findings} Med</span>
          </div>
        </div>

        {/* Active Scan Status */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Active Workers
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {metrics.running_scans}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.running_scans > 0 ? 'Assessment tasks in progress' : 'Ready for new targets'}
          </p>
        </div>
      </div>

      {/* D3 Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution Donut */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-200">Severity Distribution</h3>
            <span className="text-xs text-slate-500 font-mono">D3 Telemetry</span>
          </div>
          <SeverityDonutChart
            data={{
              critical: metrics.critical_findings,
              high: metrics.high_findings,
              medium: metrics.medium_findings,
              low: metrics.low_findings,
              informational: metrics.info_findings,
            }}
            width={260}
            height={200}
          />
          <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-800/60 text-center text-xs">
            <div>
              <div className="text-rose-400 font-mono font-bold">{metrics.critical_findings}</div>
              <div className="text-[10px] text-slate-500">Critical</div>
            </div>
            <div>
              <div className="text-orange-400 font-mono font-bold">{metrics.high_findings}</div>
              <div className="text-[10px] text-slate-500">High</div>
            </div>
            <div>
              <div className="text-amber-400 font-mono font-bold">{metrics.medium_findings}</div>
              <div className="text-[10px] text-slate-500">Medium</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-200">Vulnerability Categories</h3>
            <span className="text-xs text-slate-500 font-mono">Classification</span>
          </div>
          <div className="flex items-center justify-center">
            <CategoryBarChart
              data={trends?.category_breakdown || []}
              width={320}
              height={230}
            />
          </div>
        </div>

        {/* Score Trend Over Time */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-200">Risk Score History</h3>
            <span className="text-xs text-slate-500 font-mono">Trends</span>
          </div>
          <div className="flex items-center justify-center">
            <ScoreTrendChart
              data={trends?.trends || []}
              width={340}
              height={230}
            />
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Scans & Top Recurring Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Recent Security Assessments
            </h3>
            <Link to="/history" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {metrics.recent_scans.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No assessments recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {metrics.recent_scans.map(scan => (
                <Link
                  key={scan.id}
                  to={`/scans/${scan.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg transition group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-sm font-mono font-medium text-slate-200 truncate group-hover:text-emerald-400 transition">
                      {scan.target}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="capitalize">{scan.profile}</span>
                      <span>•</span>
                      <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={scan.status} />
                    <ScoreGauge score={scan.security_score} size="sm" showLabel={false} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Recurring Security Issues */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Top Recurring Weaknesses
            </h3>
            <span className="text-xs text-slate-500">Aggregated</span>
          </div>

          {metrics.top_issues.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No recurring issues detected.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {metrics.top_issues.map((issue, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">
                      {issue.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span className="font-mono text-slate-400">{issue.rule_id}</span>
                      <span>•</span>
                      <span>{issue.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SeverityBadge severity={issue.severity} size="sm" />
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-xs text-slate-300">
                      {issue.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
