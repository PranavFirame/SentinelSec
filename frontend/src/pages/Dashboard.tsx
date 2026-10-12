import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { OverviewMetrics, AnalyticsTrends, Scan } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityDonutChart } from '../components/charts/SeverityDonutChart';
import { ScoreTrendChart } from '../components/charts/ScoreTrendChart';
import { SimpleBreakdownTable, BreakdownItem } from '../components/common/SimpleBreakdownTable';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  History,
  SearchCode,
  Sparkles,
  Trash2,
  RefreshCw,
  Globe,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
  ChevronDown
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simple Analytics style target switcher and time-range filter
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

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
        <RefreshCw className="w-8 h-8 animate-spin text-orange-400 mb-3" />
        <span className="text-sm font-medium">Aggregating telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-300">
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

  // Extract unique target hosts for the Simple Analytics domain selector
  const availableTargets = Array.from(
    new Set((metrics.recent_scans || []).map(s => s.target.replace(' [Simulated Demo]', '').trim()))
  );

  // Prepare data for SimpleBreakdownTables
  const weaknessItems: BreakdownItem[] = (metrics.top_issues || []).map(i => ({
    id: i.rule_id,
    label: i.title,
    sublabel: `${i.rule_id} • ${i.category}`,
    value: i.count,
    badge: <SeverityBadge severity={i.severity} size="sm" />,
  }));

  const categoryItems: BreakdownItem[] = (trends?.category_breakdown || []).map(c => ({
    id: c.category,
    label: c.category,
    sublabel: 'Standardized Category',
    value: c.count,
    percentage: c.percentage,
  }));

  const targetHostItems: BreakdownItem[] = (metrics.recent_scans || []).map(s => ({
    id: s.id,
    label: s.target.replace(' [Simulated Demo]', ''),
    sublabel: `${s.profile} • ${new Date(s.created_at).toLocaleDateString()}`,
    value: s.security_score ?? 0,
    badge: (
      <span className={`font-mono text-xs font-bold ${
        (s.security_score ?? 0) >= 80 ? 'text-emerald-400' :
        (s.security_score ?? 0) >= 60 ? 'text-amber-400' : 'text-rose-400'
      }`}>
        {s.security_score ?? '--'} pts
      </span>
    ),
  }));

  const passedTotal = metrics.passed_checks || 0;
  const failedTotal = metrics.failed_checks || 0;
  const checkTotal = passedTotal + failedTotal || 1;
  const passRate = Math.round((passedTotal / checkTotal) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Simple Analytics Style Top Bar: Website Selector & Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        {/* Left: Target Domain Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <Globe className="w-3.5 h-3.5 text-orange-400 mr-2 shrink-0" />
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-100 pr-6 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all" className="bg-slate-900">All Monitored Targets ({availableTargets.length})</option>
              {availableTargets.map((t, idx) => (
                <option key={idx} value={t} className="bg-slate-900 font-mono">{t}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
          </div>

          {metrics.is_demo_mode && (
            <span className="text-[11px] font-mono text-orange-400/90 bg-orange-950/30 px-2 py-0.5 rounded border border-orange-800/40">
              Demo Baseline
            </span>
          )}
        </div>

        {/* Right: Time Range Pills & Quick Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
            {(['7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition ${
                  timeRange === range
                    ? 'bg-slate-800 text-orange-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {metrics.is_demo_mode ? (
            <button
              onClick={handleClearDemo}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Demo</span>
            </button>
          ) : metrics.total_scans === 0 ? (
            <button
              onClick={handleSeedDemo}
              className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Demo Scans</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* AI Posture Insights Card (Inspired by Simple Analytics AI Summary) */}
      <div className="p-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/90 rounded-2xl flex items-start gap-3.5 text-xs shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-200 flex items-center gap-2">
            <span>Automated Posture Summary</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
              Evaluated
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {metrics.total_scans > 0 ? (
              <>
                Across <strong>{metrics.total_scans} assessments</strong>, the average posture score stands at <strong>{metrics.overall_score}/100</strong>. Non-destructive probes identified <strong>{metrics.critical_findings + metrics.high_findings} high-priority exposures</strong>. Primary recommended mitigation: enforce strict HSTS and restrict CORS origin reflection.
              </>
            ) : (
              <>
                No targets currently recorded. Enter an authorized URL to run automated transport security, HTTP header, and TLS certificate audits without invasive payloads.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Simple Analytics Style KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Posture Score */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Security Posture
            </span>
            <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {metrics.overall_score}
              <span className="text-xs text-slate-500 font-sans ml-1 font-normal">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Passing {passRate}% of checks</span>
            </div>
          </div>
          <ScoreGauge score={metrics.overall_score} size="sm" showLabel={false} />
        </div>

        {/* KPI 2: Completed Audits */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Audits Executed
            </span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
            {metrics.total_scans}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-mono font-medium">{passedTotal} passed</span>
            <span>•</span>
            <span className="text-rose-400 font-mono font-medium">{failedTotal} failed</span>
          </div>
        </div>

        {/* KPI 3: Total Exposures */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Vulnerabilities
            </span>
            <Shield className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
            {metrics.total_findings}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1 font-mono">
            <span className="text-rose-400 font-semibold">{metrics.critical_findings} Crit</span>
            <span className="text-slate-600">•</span>
            <span className="text-orange-400 font-semibold">{metrics.high_findings} High</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">{metrics.medium_findings} Med</span>
          </div>
        </div>

        {/* KPI 4: Active Check Ratio Bar */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Compliance Ratio
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="my-1.5">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {passRate}%
            </div>
            {/* Horizontal Mini Bar */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 flex border border-slate-800">
              <div className="bg-emerald-400 h-full" style={{ width: `${passRate}%` }} />
              <div className="bg-rose-500 h-full" style={{ width: `${100 - passRate}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {checkTotal} automated check validations
          </p>
        </div>
      </div>

      {/* Simple Analytics Hero Chart: Posture & Exposures Over Time */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Posture & Finding Velocity
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical evaluation trend across monitored endpoints
            </p>
          </div>
        </div>

        <div className="pt-2">
          <ScoreTrendChart
            data={trends?.trends || []}
            width={720}
            height={220}
          />
        </div>
      </div>

      {/* Simple Analytics Signature Proportional Breakdown Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Top Recurring Vulnerabilities */}
        <SimpleBreakdownTable
          title="Top Security Weaknesses"
          subtitle="Ranked by recurring detection frequency"
          items={weaknessItems}
          barColor="bg-orange-500/15"
          emptyText="No recurring vulnerabilities detected"
        />

        {/* Widget 2: Evaluated Targets & Posture */}
        <SimpleBreakdownTable
          title="Monitored Endpoints & Hosts"
          subtitle="Audited targets with individual posture scores"
          items={targetHostItems}
          barColor="bg-emerald-500/15"
          emptyText="No endpoints scanned yet"
        />

        {/* Widget 3: Vulnerability Categories */}
        <SimpleBreakdownTable
          title="Vulnerability Categories"
          subtitle="Classification across security layers"
          items={categoryItems}
          barColor="bg-sky-500/15"
          emptyText="No categories categorized yet"
        />

        {/* Widget 4: Severity Distribution Card with Donut */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Severity Tier Distribution</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Proportional breakdown of open issues</p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-400">
              {metrics.total_findings} Total
            </span>
          </div>

          <div className="flex items-center justify-center my-auto py-2">
            <SeverityDonutChart
              data={{
                critical: metrics.critical_findings,
                high: metrics.high_findings,
                medium: metrics.medium_findings,
                low: metrics.low_findings,
                informational: metrics.info_findings,
              }}
              width={260}
              height={180}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/60 text-center font-mono text-xs">
            <div>
              <div className="text-rose-400 font-bold">{metrics.critical_findings}</div>
              <div className="text-[10px] text-slate-500 font-sans">Critical</div>
            </div>
            <div>
              <div className="text-orange-400 font-bold">{metrics.high_findings}</div>
              <div className="text-[10px] text-slate-500 font-sans">High</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{metrics.medium_findings}</div>
              <div className="text-[10px] text-slate-500 font-sans">Medium</div>
            </div>
            <div>
              <div className="text-sky-400 font-bold">{metrics.low_findings}</div>
              <div className="text-[10px] text-slate-500 font-sans">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-orange-400" />
            Recent Security Audits
          </h3>
          <Link to="/history" className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition">
            <span>View Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
                className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition group"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-xs font-mono font-medium text-slate-200 truncate group-hover:text-orange-400 transition">
                    {scan.target}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="capitalize">{scan.profile}</span>
                    <span>•</span>
                    <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={scan.status} />
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-slate-200">
                      {scan.security_score ?? '--'}
                    </span>
                    <span className="text-[10px] text-slate-500"> / 100</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
