import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Scan, ScanComparisonResult } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  History,
  GitCompare,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const ScanHistory: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Profile Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState('all');

  // Compare Scans state
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ScanComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getScans({ limit: 50 });
      setScans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    try {
      setComparing(true);
      setComparisonError(null);
      const res = await api.compareScans(compareA, compareB);
      setComparisonResult(res);
    } catch (err: any) {
      setComparisonError(err.message || 'Failed to compare scans');
    } finally {
      setComparing(false);
    }
  };

  const filteredScans = scans.filter(s => {
    if (profileFilter !== 'all' && s.profile !== profileFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return s.target.toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#17211D] flex items-center gap-2">
            <History className="w-5 h-5 text-[#167653]" />
            Historical Assessment Registry
          </h2>
          <p className="text-sm text-[#64716A] mt-1">
            Browse previous security assessments, examine score evolution, and execute side-by-side comparisons.
          </p>
        </div>

        <Link
          to="/scans/new"
          className="px-5 py-2.5 bg-[#167653] hover:bg-[#125e43] text-white font-semibold rounded-full text-xs transition shadow-xs shrink-0"
        >
          Initiate New Assessment
        </Link>
      </div>

      {/* Comparison Selector Widget */}
      <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#17211D] uppercase tracking-wide flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-[#167653]" />
            Historical Comparison Tool
          </span>
          <span className="text-xs text-[#64716A]">
            Select 2 scans below using the radio selectors
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#64716A]">Baseline (Scan A):</span>
            <span className="text-[#167653] font-bold">{compareA ? compareA.slice(0, 8) : 'Not selected'}</span>
          </div>
          <span className="text-[#64716A]">vs</span>
          <div className="flex items-center gap-2">
            <span className="text-[#64716A]">Target (Scan B):</span>
            <span className="text-[#167653] font-bold">{compareB ? compareB.slice(0, 8) : 'Not selected'}</span>
          </div>

          <button
            onClick={handleCompare}
            disabled={!compareA || !compareB || compareA === compareB || comparing}
            className="ml-auto px-5 py-2 bg-[#167653] hover:bg-[#125e43] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full transition flex items-center gap-1.5 shadow-xs"
          >
            {comparing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
            <span>Compare Selected Scans</span>
          </button>
        </div>

        {comparisonError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            {comparisonError}
          </div>
        )}
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="p-5 bg-white border border-[#167653] rounded-xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5EAE6] pb-3">
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#167653]" />
              Comparison: {comparisonResult.scan_a_target} vs {comparisonResult.scan_b_target}
            </h3>
            <button
              onClick={() => setComparisonResult(null)}
              className="text-xs text-[#64716A] hover:text-[#17211D]"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
              <span className="text-[#64716A]">Scan A Score</span>
              <div className="text-base font-bold text-[#17211D] mt-0.5">{comparisonResult.scan_a_score ?? '--'} pts</div>
            </div>
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
              <span className="text-[#64716A]">Scan B Score</span>
              <div className="text-base font-bold text-[#17211D] mt-0.5">{comparisonResult.scan_b_score ?? '--'} pts</div>
            </div>
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
              <span className="text-[#64716A]">Score Delta</span>
              <div className={`text-base font-bold mt-0.5 ${
                (comparisonResult.score_delta ?? 0) > 0 ? 'text-[#167653]' :
                (comparisonResult.score_delta ?? 0) < 0 ? 'text-red-600' : 'text-[#64716A]'
              }`}>
                {(comparisonResult.score_delta ?? 0) > 0 ? `+${comparisonResult.score_delta}` : comparisonResult.score_delta} pts
              </div>
            </div>
            <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
              <span className="text-[#64716A]">Resolved vs New</span>
              <div className="text-base font-bold text-[#17211D] mt-0.5">
                <span className="text-[#167653]">{comparisonResult.resolved_findings.length} fixed</span> /{' '}
                <span className="text-red-600">{comparisonResult.new_findings.length} new</span>
              </div>
            </div>
          </div>

          {/* New Findings in B */}
          {comparisonResult.new_findings.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                New Vulnerabilities Introduced in Scan B ({comparisonResult.new_findings.length}):
              </span>
              <div className="space-y-1.5">
                {comparisonResult.new_findings.map((f, i) => (
                  <div key={i} className="p-2 bg-red-50 border border-red-200 rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-800">{f.title}</span>
                    <SeverityBadge severity={f.severity} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Findings in B */}
          {comparisonResult.resolved_findings.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#167653] uppercase tracking-wide">
                Vulnerabilities Successfully Resolved ({comparisonResult.resolved_findings.length}):
              </span>
              <div className="space-y-1.5">
                {comparisonResult.resolved_findings.map((f, i) => (
                  <div key={i} className="p-2 bg-[#EAF5EE] border border-[#C6E6D5] rounded flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#167653]">{f.title}</span>
                    <SeverityBadge severity={f.severity} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <select
            value={profileFilter}
            onChange={e => setProfileFilter(e.target.value)}
            className="bg-[#F7F9F7] border border-[#E5EAE6] rounded-lg px-3 py-1.5 text-xs text-[#17211D] focus:outline-none"
          >
            <option value="all">All Assessment Profiles</option>
            <option value="standard">Standard</option>
            <option value="quick">Quick</option>
            <option value="tls_headers">TLS & Headers</option>
            <option value="dependency">Dependency</option>
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#64716A] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search target domain..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F7F9F7] border border-[#E5EAE6] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#17211D] placeholder-[#64716A] focus:outline-none focus:border-[#167653]"
          />
        </div>
      </div>

      {/* Scans Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-[#64716A]">
          <RefreshCw className="w-7 h-7 animate-spin text-[#167653] mb-2" />
          <span className="text-xs">Loading records...</span>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="p-8 bg-white border border-[#E5EAE6] rounded-xl text-center text-[#64716A] shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-[#64716A] mx-auto mb-2" />
          <span className="text-sm font-semibold text-[#17211D] block">No Scans Found</span>
          <p className="text-xs text-[#64716A] mt-1">Start a scan to begin recording telemetry.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5EAE6] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9F7] text-[#64716A] uppercase font-mono text-[10px] tracking-wider border-b border-[#E5EAE6]">
                <tr>
                  <th className="p-3 w-16 text-center">Compare</th>
                  <th className="p-3">Target & ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Profile</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Findings</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAE6] font-mono">
                {filteredScans.map(s => (
                  <tr key={s.id} className="hover:bg-[#F7F9F7] transition">
                    {/* Compare Radios */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="radio"
                          name="compareA"
                          checked={compareA === s.id}
                          onChange={() => setCompareA(s.id)}
                          title="Set as Scan A"
                          className="accent-[#167653]"
                        />
                        <input
                          type="radio"
                          name="compareB"
                          checked={compareB === s.id}
                          onChange={() => setCompareB(s.id)}
                          title="Set as Scan B"
                          className="accent-[#167653]"
                        />
                      </div>
                    </td>

                    <td className="p-3 font-sans">
                      <div className="font-semibold text-[#17211D] max-w-xs truncate">{s.target}</div>
                      <span className="font-mono text-[10px] text-[#64716A]">{s.id.slice(0, 8)}</span>
                    </td>

                    <td className="p-3 text-[#64716A]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>

                    <td className="p-3 uppercase text-[#17211D] text-[11px]">
                      {s.profile}
                    </td>

                    <td className="p-3 font-sans">
                      <StatusBadge status={s.status} />
                    </td>

                    <td className="p-3 font-sans">
                      {s.findings_summary ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-red-600 font-mono font-semibold">{s.findings_summary.critical}C</span>
                          <span className="text-orange-600 font-mono font-semibold">{s.findings_summary.high}H</span>
                          <span className="text-amber-600 font-mono font-semibold">{s.findings_summary.medium}M</span>
                        </div>
                      ) : (
                        <span className="text-[#64716A]">--</span>
                      )}
                    </td>

                    <td className="p-3 text-[#64716A]">
                      {s.duration_seconds ? `${s.duration_seconds}s` : '--'}
                    </td>

                    <td className="p-3 text-center">
                      <ScoreGauge score={s.security_score} size="sm" showLabel={false} />
                    </td>

                    <td className="p-3 text-right font-sans">
                      <Link
                        to={`/scans/${s.id}`}
                        className="px-2.5 py-1 bg-[#F7F9F7] hover:bg-[#EAF5EE] text-[#17211D] hover:text-[#167653] rounded text-xs font-medium inline-flex items-center gap-1 transition border border-[#E5EAE6]"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 text-[#167653]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
