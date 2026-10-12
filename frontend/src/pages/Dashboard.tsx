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
  ChevronDown,
  Layers,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simple Analytics style target switcher, timeframe filter, and click-to-filter tag
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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
        <RefreshCw className="w-8 h-8 animate-spin text-coral mb-3" />
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

  // Extract unique target hosts for domain selector
  const availableTargets = Array.from(
    new Set((metrics.recent_scans || []).map(s => s.target.replace(' [Simulated Demo]', '').trim()))
  );

  // Filtered scans based on selected domain
  const filteredScans = (metrics.recent_scans || []).filter(s => {
    if (selectedTarget === 'all') return true;
    return s.target.includes(selectedTarget);
  });

  // Prepare data for SimpleBreakdownTables
  const rawWeaknessItems: BreakdownItem[] = (metrics.top_issues || []).map(i => ({
    id: i.rule_id,
    label: i.title,
    sublabel: `${i.rule_id} • ${i.category}`,
    value: i.count,
    badge: <SeverityBadge severity={i.severity} size="sm" />,
  }));

  const weaknessItems = activeFilter
    ? rawWeaknessItems.filter(i => i.label.toLowerCase().includes(activeFilter.toLowerCase()))
    : rawWeaknessItems;

  const categoryItems: BreakdownItem[] = (trends?.category_breakdown || []).map(c => ({
    id: c.category,
    label: c.category,
    sublabel: 'Attack Surface Layer',
    value: c.count,
    percentage: c.percentage,
  }));

  const targetHostItems: BreakdownItem[] = filteredScans.map(s => ({
    id: s.id,
    label: s.target.replace(' [Simulated Demo]', ''),
    sublabel: `${s.profile} • ${new Date(s.created_at).toLocaleDateString()}`,
    value: s.security_score ?? 0,
    badge: (
      <span className={`font-mono text-xs font-bold ${
        (s.security_score ?? 0) >= 80 ? 'text-emerald-400' :
        (s.security_score ?? 0) >= 60 ? 'text-amber-400' : 'text-coral'
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Hero Header Section — Modeled directly on Simple Analytics Screenshot 1 */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#1f2c2e] border border-sa space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-coral tracking-widest uppercase">
              For Developers & DevOps
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Vulnerability telemetry you can <span className="text-coral">actually understand</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              See where misconfigurations lurk, which headers protect your stack, and what packages carry known CVEs. No invasive crawlers, no exploit payloads, no confusing 100-page reports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              to="/scans/new"
              className="px-6 py-2.5 rounded-full bg-coral hover:bg-rose-500 text-white font-semibold shadow-md transition-all text-xs"
            >
              Launch Fast Audit
            </Link>
            {metrics.total_scans === 0 ? (
              <button
                onClick={handleSeedDemo}
                className="px-5 py-2.5 rounded-full border border-coral text-coral hover:bg-coral-subtle font-semibold transition-all text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>See live demo →</span>
              </button>
            ) : metrics.is_demo_mode ? (
              <button
                onClick={handleClearDemo}
                className="px-4 py-2 rounded-full border border-slate-700 text-slate-400 hover:text-rose-400 font-medium transition-all text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Demo</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Trust Signals Row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 pt-2 border-t border-sa">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">✓ No destructive payloads</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">✓ SSRF protected</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">✓ 100% free & local</span>
          <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] ml-auto">
            16 modular audit checks
          </span>
        </div>
      </div>

      {/* Target Domain Selector, Timeframe Pills & Drill-down Active Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        {/* Left: Target Domain Dropdown & Filter Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-flex items-center bg-[#1f2c2e] border border-sa rounded-xl px-3 py-1.5 text-xs text-slate-200">
            <Globe className="w-3.5 h-3.5 text-coral mr-2 shrink-0" />
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-100 pr-6 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all" className="bg-[#172123]">🌐 All Monitored Targets ({availableTargets.length})</option>
              {availableTargets.map((t, idx) => (
                <option key={idx} value={t} className="bg-[#172123] font-mono">{t}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {activeFilter && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-coral-subtle text-coral border border-coral/30">
              <span>Filtered: {activeFilter}</span>
              <button onClick={() => setActiveFilter(null)} className="hover:text-white font-bold ml-1">✕</button>
            </div>
          )}

          {metrics.is_demo_mode && (
            <span className="text-[11px] font-mono text-coral bg-coral-subtle px-2 py-0.5 rounded border border-coral/30">
              Simulated Demo Mode
            </span>
          )}
        </div>

        {/* Right: Timeframe Pills */}
        <div className="flex items-center bg-[#1f2c2e] border border-sa rounded-xl p-1 text-xs font-semibold">
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition ${
                timeRange === range
                  ? 'bg-coral text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPI Grid (Simple Analytics Clean Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Security Posture Score */}
        <div className="p-5 bg-[#1f2c2e] border border-sa rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Security Score
            </span>
            <div className="mt-1 text-3xl font-extrabold font-mono text-white tracking-tight">
              {metrics.overall_score}
              <span className="text-xs text-slate-400 font-sans ml-1 font-normal">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{passRate}% checks passed</span>
            </div>
          </div>
          <ScoreGauge score={metrics.overall_score} size="sm" showLabel={false} />
        </div>

        {/* KPI 2: Completed Audits */}
        <div className="p-5 bg-[#1f2c2e] border border-sa rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Audits Executed
            </span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-white tracking-tight">
            {metrics.total_scans}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-mono font-medium">{passedTotal} passed</span>
            <span>•</span>
            <span className="text-coral font-mono font-medium">{failedTotal} failed</span>
          </div>
        </div>

        {/* KPI 3: Total Exposures */}
        <div className="p-5 bg-[#1f2c2e] border border-sa rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Active Exposures
            </span>
            <Shield className="w-4 h-4 text-coral" />
          </div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-coral tracking-tight">
            {metrics.total_findings}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1 font-mono">
            <span className="text-coral font-semibold">{metrics.critical_findings} Crit</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">{metrics.high_findings} High</span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-400 font-semibold">{metrics.medium_findings} Med</span>
          </div>
        </div>

        {/* KPI 4: Compliance Ratio Mini-Bar */}
        <div className="p-5 bg-[#1f2c2e] border border-sa rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Pass Compliance
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {passRate}%
            </div>
            {/* Horizontal Mini Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 flex border border-sa">
              <div className="bg-emerald-400 h-full" style={{ width: `${passRate}%` }} />
              <div className="bg-coral h-full" style={{ width: `${100 - passRate}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            {checkTotal} check validations
          </p>
        </div>
      </div>

      {/* Simple Analytics Hero Chart Card: Posture & Finding Velocity */}
      <div className="p-6 bg-[#1f2c2e] border border-sa rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-coral" />
              Posture & Finding Velocity Scrubber
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Historical timeline across audited targets (click metric to toggle focus)
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

      {/* Simple Analytics Signature 2x2 Proportional Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Top Recurring Vulnerabilities */}
        <SimpleBreakdownTable
          title="Top Security Weaknesses"
          subtitle="Ranked by recurring detection frequency"
          items={weaknessItems}
          barColor="bg-coral-subtle"
          accentTextColor="text-coral"
          onItemClick={item => setActiveFilter(item.label)}
          emptyText="No recurring vulnerabilities detected"
        />

        {/* Widget 2: Evaluated Targets & Posture */}
        <SimpleBreakdownTable
          title="Monitored Endpoints & Hosts"
          subtitle="Audited targets with individual posture scores"
          items={targetHostItems}
          barColor="bg-emerald-500/15"
          accentTextColor="text-emerald-400"
          onItemClick={item => setSelectedTarget(item.label)}
          emptyText="No endpoints scanned yet"
        />

        {/* Widget 3: Vulnerability Categories */}
        <SimpleBreakdownTable
          title="Attack Surface Categories"
          subtitle="Classification across security layers"
          items={categoryItems}
          barColor="bg-coral-subtle"
          accentTextColor="text-coral"
          emptyText="No categories categorized yet"
        />

        {/* Widget 4: Severity Distribution Card with Donut */}
        <div className="bg-[#1f2c2e] border border-sa rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-sa mb-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Severity Tier Spread</h3>
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

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-sa text-center font-mono text-xs">
            <div>
              <div className="text-coral font-bold">{metrics.critical_findings}</div>
              <div className="text-[10px] text-slate-400 font-sans">Critical</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{metrics.high_findings}</div>
              <div className="text-[10px] text-slate-400 font-sans">High</div>
            </div>
            <div>
              <div className="text-sky-400 font-bold">{metrics.medium_findings}</div>
              <div className="text-[10px] text-slate-400 font-sans">Medium</div>
            </div>
            <div>
              <div className="text-slate-400 font-bold">{metrics.low_findings}</div>
              <div className="text-[10px] text-slate-400 font-sans">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Section — Modeled directly on Simple Analytics Screenshot 3 */}
      <div className="pt-4 border-t border-sa space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Built for clarity, not analyst overload</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Traditional security tools are powerful, but developers do not need 100-page PDF reports. They need fast, actionable answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Legacy Scanners (Left Card) */}
          <div className="p-6 rounded-2xl bg-[#1f2c2e] border border-sa space-y-4">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Traditional Scanners</div>
              <h3 className="text-base font-bold text-white mt-0.5">Heavy, noisy, and invasive</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2 text-rose-400">
                <span className="font-bold">✕</span>
                <span>Floods endpoints with aggressive fuzzer requests</span>
              </li>
              <li className="flex items-start gap-2 text-rose-400">
                <span className="font-bold">✕</span>
                <span>False alarms on benign or intentionally missing headers</span>
              </li>
              <li className="flex items-start gap-2 text-rose-400">
                <span className="font-bold">✕</span>
                <span>Complex cloud agents requiring expensive enterprise tiers</span>
              </li>
              <li className="flex items-start gap-2 text-rose-400">
                <span className="font-bold">✕</span>
                <span>Requires dedicated security personnel to interpret</span>
              </li>
            </ul>
          </div>

          {/* SentinelSec (Right Card with Green Highlight Border) */}
          <div className="p-6 rounded-2xl bg-[#1f2c2e] border-2 border-emerald-500/60 shadow-lg space-y-4">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">SentinelSec</div>
              <h3 className="text-base font-bold text-white mt-0.5">Clear, fast, and defensive</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-start gap-2 text-emerald-400">
                <span className="font-bold">✓</span>
                <span>One glanceable, single-screen telemetry dashboard</span>
              </li>
              <li className="flex items-start gap-2 text-emerald-400">
                <span className="font-bold">✓</span>
                <span>Non-destructive, safe checks with SSRF protection</span>
              </li>
              <li className="flex items-start gap-2 text-emerald-400">
                <span className="font-bold">✓</span>
                <span>Deterministic risk scoring with duplicate dampening</span>
              </li>
              <li className="flex items-start gap-2 text-emerald-400">
                <span className="font-bold">✓</span>
                <span>Runs 100% locally or on free cloud tiers with zero setup</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4-Column Feature Block — Modeled directly on Simple Analytics Screenshot 4 */}
      <div className="pt-4 border-t border-sa space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-white">What you can assess with SentinelSec</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#1f2c2e] border border-sa space-y-2">
            <div className="text-coral text-lg font-bold">📊</div>
            <h4 className="text-xs font-bold text-white">HTTP Security Headers</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Audit HSTS, CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy in one non-destructive pass.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#1f2c2e] border border-sa space-y-2">
            <div className="text-coral text-lg font-bold">🔒</div>
            <h4 className="text-xs font-bold text-white">TLS & Certificates</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Verify certificate validity, expiry timelines, SAN matching, and negotiated protocol versions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#1f2c2e] border border-sa space-y-2">
            <div className="text-coral text-lg font-bold">📦</div>
            <h4 className="text-xs font-bold text-white">Dependency CVEs</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Parse package-lock.json and requirements.txt against the live Open Source Vulnerability (OSV) database.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#1f2c2e] border border-sa space-y-2">
            <div className="text-coral text-lg font-bold">🛡️</div>
            <h4 className="text-xs font-bold text-white">Risk Scoring Engine</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deterministic 0–100 security scoring with dampening so similar header warnings don't zero your score.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="p-6 bg-[#1f2c2e] border border-sa rounded-2xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-sa">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-coral" />
            Recent Security Audits
          </h3>
          <Link to="/history" className="text-xs text-coral hover:text-rose-400 font-semibold flex items-center gap-1 transition">
            <span>View Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredScans.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">No assessments recorded for this scope.</div>
        ) : (
          <div className="divide-y divide-sa">
            {filteredScans.slice(0, 5).map(scan => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition group"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-xs font-mono font-medium text-slate-200 truncate group-hover:text-coral transition">
                    {scan.target}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
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
                    <span className="text-[10px] text-slate-400"> / 100</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA & Trust Section — Modeled directly on Simple Analytics Screenshot 5 */}
      <div className="text-center py-6 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Try the simpler way to understand your security</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Audit your public web assets in seconds and review real vulnerability telemetry without the noise.
        </p>

        <div className="flex justify-center items-center gap-3 pt-1">
          <Link
            to="/scans/new"
            className="px-6 py-2.5 rounded-full bg-coral hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            Launch fast audit
          </Link>
          <Link
            to="/docs"
            className="px-6 py-2.5 rounded-full border border-coral text-coral hover:bg-coral-subtle font-semibold text-xs transition-all"
          >
            Read documentation →
          </Link>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-5 text-[11px] text-slate-400 pt-2">
          <span className="flex items-center gap-1 text-emerald-400">✓ No credit card required</span>
          <span className="flex items-center gap-1 text-emerald-400">✓ 100% open source</span>
          <span className="flex items-center gap-1 text-emerald-400">✓ Deploy anywhere free</span>
        </div>
      </div>

      {/* Signature Jagged Line Chart — Modeled directly on Simple Analytics waveform in Screenshots 1 & 5 */}
      <div className="w-full h-10 overflow-hidden opacity-60">
        <svg className="w-full h-full" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <polyline points="0,20 40,32 80,18 120,35 160,15 200,28 240,12 280,38 320,24 360,16 400,30 440,10 480,26 520,38 560,15 600,22 640,36 680,14 720,28 760,18 800,34 840,12 880,30 920,22 960,38 1000,16 1040,24 1080,10 1120,32 1160,18 1200,26" fill="none" stroke="#ff4d4d" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
