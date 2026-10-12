import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { OverviewMetrics, AnalyticsTrends } from '../types';
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
  Sparkles,
  Trash2,
  RefreshCw,
  Globe,
  ArrowRight,
  TrendingUp,
  ChevronDown,
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#64716A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#167653] mb-3" />
        <span className="text-sm font-medium">Aggregating telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Error Loading Dashboard</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium"
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
        (s.security_score ?? 0) >= 80 ? 'text-[#167653]' :
        (s.security_score ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600'
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
        <div className="p-3 bg-[#EAF5EE] border border-[#C6E6D5] text-[#167653] rounded-xl text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Hero Header Section — Simple Analytics Clean Style */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#E5EAE6] space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#167653] tracking-widest uppercase">
              For Developers & DevOps
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17211D] tracking-tight leading-tight">
              Vulnerability telemetry you can <span className="text-[#167653]">actually understand</span>
            </h1>
            <p className="text-[#64716A] text-xs sm:text-sm max-w-2xl leading-relaxed">
              See where misconfigurations lurk, which headers protect your stack, and what packages carry known CVEs. No invasive crawlers, no exploit payloads, no confusing 100-page reports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              to="/scans/new"
              className="px-6 py-2.5 rounded-full bg-[#167653] hover:bg-[#125e43] text-white font-semibold shadow-sm transition-all text-xs"
            >
              Launch Fast Audit
            </Link>
            {metrics.total_scans === 0 ? (
              <button
                onClick={handleSeedDemo}
                className="px-5 py-2.5 rounded-full border border-[#167653] text-[#167653] hover:bg-[#EAF5EE] font-semibold transition-all text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>See live demo →</span>
              </button>
            ) : metrics.is_demo_mode ? (
              <button
                onClick={handleClearDemo}
                className="px-4 py-2 rounded-full border border-[#E5EAE6] text-[#64716A] hover:text-red-600 font-medium transition-all text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Demo</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Trust Signals Row */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#64716A] pt-2 border-t border-[#E5EAE6]">
          <span className="flex items-center gap-1.5 text-[#167653] font-medium">✓ No destructive payloads</span>
          <span className="flex items-center gap-1.5 text-[#167653] font-medium">✓ SSRF protected</span>
          <span className="flex items-center gap-1.5 text-[#167653] font-medium">✓ 100% free & local</span>
          <span className="flex items-center gap-1.5 text-[#64716A] font-mono text-[11px] ml-auto">
            16 modular audit checks
          </span>
        </div>
      </div>

      {/* Target Domain Selector, Timeframe Pills & Drill-down Active Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        {/* Left: Target Domain Dropdown & Filter Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-flex items-center bg-white border border-[#E5EAE6] rounded-xl px-3 py-1.5 text-xs text-[#17211D]">
            <Globe className="w-3.5 h-3.5 text-[#167653] mr-2 shrink-0" />
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#17211D] pr-6 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all">🌐 All Monitored Targets ({availableTargets.length})</option>
              {availableTargets.map((t, idx) => (
                <option key={idx} value={t} className="font-mono">{t}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#64716A] absolute right-2.5 pointer-events-none" />
          </div>

          {activeFilter && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]">
              <span>Filtered: {activeFilter}</span>
              <button onClick={() => setActiveFilter(null)} className="hover:text-[#17211D] font-bold ml-1">✕</button>
            </div>
          )}

          {metrics.is_demo_mode && (
            <span className="text-[11px] font-mono text-[#167653] bg-[#EAF5EE] px-2 py-0.5 rounded border border-[#C6E6D5]">
              Simulated Demo Mode
            </span>
          )}
        </div>

        {/* Right: Timeframe Pills */}
        <div className="flex items-center bg-white border border-[#E5EAE6] rounded-xl p-1 text-xs font-semibold">
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition ${
                timeRange === range
                  ? 'bg-[#167653] text-white shadow-xs'
                  : 'text-[#64716A] hover:text-[#17211D]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPI Grid (Simple Analytics Clean White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Security Posture Score */}
        <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64716A] font-semibold">
              Security Score
            </span>
            <div className="mt-1 text-3xl font-extrabold font-mono text-[#17211D] tracking-tight">
              {metrics.overall_score}
              <span className="text-xs text-[#64716A] font-sans ml-1 font-normal">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-[#167653]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{passRate}% checks passed</span>
            </div>
          </div>
          <ScoreGauge score={metrics.overall_score} size="sm" showLabel={false} />
        </div>

        {/* KPI 2: Completed Audits */}
        <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64716A] font-semibold">
              Audits Executed
            </span>
            <History className="w-4 h-4 text-[#64716A]" />
          </div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-[#17211D] tracking-tight">
            {metrics.total_scans}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#64716A] mt-1">
            <span className="text-[#167653] font-mono font-medium">{passedTotal} passed</span>
            <span>•</span>
            <span className="text-red-600 font-mono font-medium">{failedTotal} failed</span>
          </div>
        </div>

        {/* KPI 3: Total Exposures */}
        <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64716A] font-semibold">
              Active Exposures
            </span>
            <Shield className="w-4 h-4 text-[#167653]" />
          </div>
          <div className="mt-1 text-3xl font-extrabold font-mono text-red-600 tracking-tight">
            {metrics.total_findings}
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-1 font-mono">
            <span className="text-red-600 font-semibold">{metrics.critical_findings} Crit</span>
            <span className="text-[#E5EAE6]">•</span>
            <span className="text-orange-600 font-semibold">{metrics.high_findings} High</span>
            <span className="text-[#E5EAE6]">•</span>
            <span className="text-amber-600 font-semibold">{metrics.medium_findings} Med</span>
          </div>
        </div>

        {/* KPI 4: Compliance Ratio Mini-Bar */}
        <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64716A] font-semibold">
              Pass Compliance
            </span>
            <ShieldCheck className="w-4 h-4 text-[#167653]" />
          </div>

          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-[#167653]">
              {passRate}%
            </div>
            {/* Horizontal Mini Bar */}
            <div className="w-full h-1.5 bg-[#F7F9F7] rounded-full overflow-hidden mt-1 flex border border-[#E5EAE6]">
              <div className="bg-[#167653] h-full" style={{ width: `${passRate}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${100 - passRate}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-[#64716A] font-mono">
            {checkTotal} check validations
          </p>
        </div>
      </div>

      {/* Simple Analytics Hero Chart Card: Posture & Finding Velocity */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17211D] tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#167653]" />
              Posture & Finding Velocity Scrubber
            </h3>
            <p className="text-[11px] text-[#64716A] mt-0.5">
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
          barColor="bg-red-50"
          accentTextColor="text-red-700"
          onItemClick={item => setActiveFilter(item.label)}
          emptyText="No recurring vulnerabilities detected"
        />

        {/* Widget 2: Evaluated Targets & Posture */}
        <SimpleBreakdownTable
          title="Monitored Endpoints & Hosts"
          subtitle="Audited targets with individual posture scores"
          items={targetHostItems}
          barColor="bg-[#EAF5EE]"
          accentTextColor="text-[#167653]"
          onItemClick={item => setSelectedTarget(item.label)}
          emptyText="No endpoints scanned yet"
        />

        {/* Widget 3: Vulnerability Categories */}
        <SimpleBreakdownTable
          title="Attack Surface Categories"
          subtitle="Classification across security layers"
          items={categoryItems}
          barColor="bg-[#EAF5EE]"
          accentTextColor="text-[#167653]"
          emptyText="No categories categorized yet"
        />

        {/* Widget 4: Severity Distribution Card with Donut */}
        <div className="bg-white border border-[#E5EAE6] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE6] mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#17211D] tracking-tight">Severity Tier Spread</h3>
              <p className="text-[11px] text-[#64716A] mt-0.5">Proportional breakdown of open issues</p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#64716A]">
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

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#E5EAE6] text-center font-mono text-xs">
            <div>
              <div className="text-red-600 font-bold">{metrics.critical_findings}</div>
              <div className="text-[10px] text-[#64716A] font-sans">Critical</div>
            </div>
            <div>
              <div className="text-orange-600 font-bold">{metrics.high_findings}</div>
              <div className="text-[10px] text-[#64716A] font-sans">High</div>
            </div>
            <div>
              <div className="text-amber-600 font-bold">{metrics.medium_findings}</div>
              <div className="text-[10px] text-[#64716A] font-sans">Medium</div>
            </div>
            <div>
              <div className="text-blue-600 font-bold">{metrics.low_findings}</div>
              <div className="text-[10px] text-[#64716A] font-sans">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Section */}
      <div className="pt-4 border-t border-[#E5EAE6] space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#17211D]">Built for clarity, not analyst overload</h2>
          <p className="text-xs text-[#64716A] max-w-lg mx-auto">
            Traditional security tools are powerful, but developers do not need 100-page PDF reports. They need fast, actionable answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Legacy Scanners (Left Card) */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5EAE6] space-y-4">
            <div>
              <div className="text-[10px] font-mono text-[#64716A] uppercase tracking-wider">Traditional Scanners</div>
              <h3 className="text-base font-bold text-[#17211D] mt-0.5">Heavy, noisy, and invasive</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-[#64716A]">
              <li className="flex items-start gap-2 text-red-600">
                <span className="font-bold">✕</span>
                <span>Floods endpoints with aggressive fuzzer requests</span>
              </li>
              <li className="flex items-start gap-2 text-red-600">
                <span className="font-bold">✕</span>
                <span>False alarms on benign or intentionally missing headers</span>
              </li>
              <li className="flex items-start gap-2 text-red-600">
                <span className="font-bold">✕</span>
                <span>Complex cloud agents requiring expensive enterprise tiers</span>
              </li>
              <li className="flex items-start gap-2 text-red-600">
                <span className="font-bold">✕</span>
                <span>Requires dedicated security personnel to interpret</span>
              </li>
            </ul>
          </div>

          {/* SentinelSec (Right Card with Green Highlight Border) */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#167653] shadow-xs space-y-4">
            <div>
              <div className="text-[10px] font-mono text-[#167653] uppercase tracking-wider font-semibold">SentinelSec</div>
              <h3 className="text-base font-bold text-[#17211D] mt-0.5">Clear, fast, and defensive</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-[#17211D]">
              <li className="flex items-start gap-2 text-[#167653]">
                <span className="font-bold">✓</span>
                <span>One glanceable, single-screen telemetry dashboard</span>
              </li>
              <li className="flex items-start gap-2 text-[#167653]">
                <span className="font-bold">✓</span>
                <span>Non-destructive, safe checks with SSRF protection</span>
              </li>
              <li className="flex items-start gap-2 text-[#167653]">
                <span className="font-bold">✓</span>
                <span>Deterministic risk scoring with duplicate dampening</span>
              </li>
              <li className="flex items-start gap-2 text-[#167653]">
                <span className="font-bold">✓</span>
                <span>Runs 100% locally or on free cloud tiers with zero setup</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4-Column Feature Block */}
      <div className="pt-4 border-t border-[#E5EAE6] space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#17211D]">What you can assess with SentinelSec</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5EAE6] space-y-2 shadow-xs">
            <div className="text-[#167653] text-lg font-bold">📊</div>
            <h4 className="text-xs font-bold text-[#17211D]">HTTP Security Headers</h4>
            <p className="text-[11px] text-[#64716A] leading-relaxed">
              Audit HSTS, CSP, X-Frame-Options, Referrer-Policy, and Permissions-Policy in one non-destructive pass.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5EAE6] space-y-2 shadow-xs">
            <div className="text-[#167653] text-lg font-bold">🔒</div>
            <h4 className="text-xs font-bold text-[#17211D]">TLS & Certificates</h4>
            <p className="text-[11px] text-[#64716A] leading-relaxed">
              Verify certificate validity, expiry timelines, SAN matching, and negotiated protocol versions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5EAE6] space-y-2 shadow-xs">
            <div className="text-[#167653] text-lg font-bold">📦</div>
            <h4 className="text-xs font-bold text-[#17211D]">Dependency CVEs</h4>
            <p className="text-[11px] text-[#64716A] leading-relaxed">
              Parse package-lock.json and requirements.txt against the live Open Source Vulnerability (OSV) database.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5EAE6] space-y-2 shadow-xs">
            <div className="text-[#167653] text-lg font-bold">🛡️</div>
            <h4 className="text-xs font-bold text-[#17211D]">Risk Scoring Engine</h4>
            <p className="text-[11px] text-[#64716A] leading-relaxed">
              Deterministic 0–100 security scoring with dampening so similar header warnings don't zero your score.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EAE6]">
          <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
            <History className="w-4 h-4 text-[#167653]" />
            Recent Security Audits
          </h3>
          <Link to="/history" className="text-xs text-[#167653] hover:text-[#125e43] font-semibold flex items-center gap-1 transition">
            <span>View Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredScans.length === 0 ? (
          <div className="text-xs text-[#64716A] py-6 text-center">No assessments recorded for this scope.</div>
        ) : (
          <div className="divide-y divide-[#E5EAE6]">
            {filteredScans.slice(0, 5).map(scan => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="py-3 flex items-center justify-between hover:bg-[#F7F9F7] px-3 rounded-xl transition group"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-xs font-mono font-medium text-[#17211D] truncate group-hover:text-[#167653] transition">
                    {scan.target}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64716A]">
                    <span className="capitalize">{scan.profile}</span>
                    <span>•</span>
                    <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={scan.status} />
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-[#17211D]">
                      {scan.security_score ?? '--'}
                    </span>
                    <span className="text-[10px] text-[#64716A]"> / 100</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA & Trust Section */}
      <div className="text-center py-6 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#17211D]">Try the simpler way to understand your security</h2>
        <p className="text-xs text-[#64716A] max-w-md mx-auto">
          Audit your public web assets in seconds and review real vulnerability telemetry without the noise.
        </p>

        <div className="flex justify-center items-center gap-3 pt-1">
          <Link
            to="/scans/new"
            className="px-6 py-2.5 rounded-full bg-[#167653] hover:bg-[#125e43] text-white font-semibold text-xs shadow-sm transition-all"
          >
            Launch fast audit
          </Link>
          <Link
            to="/docs"
            className="px-6 py-2.5 rounded-full border border-[#167653] text-[#167653] hover:bg-[#EAF5EE] font-semibold text-xs transition-all"
          >
            Read documentation →
          </Link>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-5 text-[11px] text-[#64716A] pt-2">
          <span className="flex items-center gap-1 text-[#167653]">✓ No credit card required</span>
          <span className="flex items-center gap-1 text-[#167653]">✓ 100% open source</span>
          <span className="flex items-center gap-1 text-[#167653]">✓ Deploy anywhere free</span>
        </div>
      </div>

      {/* Waveform line in brand green */}
      <div className="w-full h-10 overflow-hidden opacity-60">
        <svg className="w-full h-full" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <polyline points="0,20 40,32 80,18 120,35 160,15 200,28 240,12 280,38 320,24 360,16 400,30 440,10 480,26 520,38 560,15 600,22 640,36 680,14 720,28 760,18 800,34 840,12 880,30 920,22 960,38 1000,16 1040,24 1080,10 1120,32 1160,18 1200,26" fill="none" stroke="#167653" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
