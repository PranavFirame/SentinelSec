import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Scan, Finding } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Download,
  Clock,
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export const ScanResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'findings' | 'breakdown'>('findings');

  // Expanded evidence drawer
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, f] = await Promise.all([
          api.getScan(id),
          api.getScanFindings(id),
        ]);
        setScan(s);
        setFindings(f);
      } catch (err: any) {
        setError(err.message || 'Failed to load scan results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#64716A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#167653] mb-3" />
        <span className="text-sm font-medium">Loading assessment dossier...</span>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>Error Loading Results</span>
        </div>
        <p className="text-sm">{error || 'Scan not found'}</p>
        <Link to="/history" className="mt-4 inline-block px-4 py-2 bg-white border border-[#E5EAE6] text-[#17211D] rounded-lg text-sm font-semibold">
          Return to History
        </Link>
      </div>
    );
  }

  // Filter findings
  const filteredFindings = findings.filter(f => {
    if (severityFilter !== 'all' && f.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (categoryFilter !== 'all' && f.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && f.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        f.title.toLowerCase().includes(term) ||
        f.rule_id.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term) ||
        f.affected_component.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(findings.map(f => f.category)));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/history" className="inline-flex items-center gap-1.5 text-xs text-[#64716A] hover:text-[#17211D] transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessment Registry</span>
        </Link>
      </div>

      {/* Target & Header Card */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={scan.status} />
            <span className="font-mono text-xs text-[#64716A] uppercase">{scan.profile} assessment</span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-[#17211D] break-all leading-tight">
            {scan.target}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64716A]">
            <span className="flex items-center gap-1 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#64716A]" />
              {scan.target_ip || 'Resolved via DNS'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#64716A]" />
              {scan.duration_seconds ? `${scan.duration_seconds}s probe duration` : 'In progress'}
            </span>
            <span>Started {new Date(scan.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Score & Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <ScoreGauge score={scan.security_score} size="md" />

          <div className="flex flex-col gap-2">
            <button
              onClick={() => api.downloadReportJson(scan.id)}
              className="px-5 py-2.5 bg-[#167653] hover:bg-[#125e43] text-white font-semibold rounded-full text-xs transition flex items-center gap-2 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checks Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl shadow-xs">
          <span className="text-[11px] uppercase font-mono text-[#64716A]">Total Checks</span>
          <div className="text-xl font-bold font-mono text-[#17211D] mt-1">{scan.checks_executed}</div>
        </div>
        <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl shadow-xs">
          <span className="text-[11px] uppercase font-mono text-[#167653] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Passed
          </span>
          <div className="text-xl font-bold font-mono text-[#167653] mt-1">{scan.checks_passed}</div>
        </div>
        <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl shadow-xs">
          <span className="text-[11px] uppercase font-mono text-red-600 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Failed
          </span>
          <div className="text-xl font-bold font-mono text-red-600 mt-1">{scan.checks_failed}</div>
        </div>
        <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl shadow-xs">
          <span className="text-[11px] uppercase font-mono text-amber-600 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Skipped
          </span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">{scan.checks_skipped}</div>
        </div>
        <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl shadow-xs">
          <span className="text-[11px] uppercase font-mono text-[#64716A] flex items-center gap-1">
            <Info className="w-3 h-3" /> Exposures
          </span>
          <div className="text-xl font-bold font-mono text-[#17211D] mt-1">{findings.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5EAE6] text-sm">
        <button
          onClick={() => setActiveTab('findings')}
          className={`pb-3 px-4 font-semibold border-b-2 transition ${
            activeTab === 'findings'
              ? 'border-[#167653] text-[#167653]'
              : 'border-transparent text-[#64716A] hover:text-[#17211D]'
          }`}
        >
          Security Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`pb-3 px-4 font-semibold border-b-2 transition ${
            activeTab === 'breakdown'
              ? 'border-[#167653] text-[#167653]'
              : 'border-transparent text-[#64716A] hover:text-[#17211D]'
          }`}
        >
          Score & Penalty Breakdown
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white border border-[#E5EAE6] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Severity Pills */}
              <div className="flex items-center gap-1 bg-[#F7F9F7] p-1 rounded-lg border border-[#E5EAE6] text-xs">
                {['all', 'critical', 'high', 'medium', 'low', 'informational'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-2.5 py-1 rounded font-medium capitalize transition ${
                      severityFilter === s
                        ? 'bg-white text-[#167653] shadow-xs font-semibold'
                        : 'text-[#64716A] hover:text-[#17211D]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-white border border-[#E5EAE6] rounded-lg px-3 py-1.5 text-xs text-[#17211D] focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#64716A] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search findings, rule ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#F7F9F7] border border-[#E5EAE6] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#17211D] placeholder-[#64716A] focus:outline-none focus:border-[#167653]"
              />
            </div>
          </div>

          {/* Findings List */}
          {filteredFindings.length === 0 ? (
            <div className="p-8 bg-white border border-[#E5EAE6] rounded-xl text-center text-[#64716A] shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-[#167653] mx-auto mb-2" />
              <span className="text-sm font-semibold text-[#17211D] block">No Findings Match Your Filters</span>
              <p className="text-xs text-[#64716A] mt-1">Try adjusting the severity filters or search criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map(f => {
                const isExpanded = expandedFindingId === f.id;
                return (
                  <div
                    key={f.id}
                    className="bg-white border border-[#E5EAE6] rounded-xl overflow-hidden transition shadow-xs"
                  >
                    <div
                      onClick={() => setExpandedFindingId(isExpanded ? null : f.id)}
                      className="p-4.5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#F7F9F7] transition"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <SeverityBadge severity={f.severity} size="sm" />
                          <span className="font-mono text-xs text-[#64716A] font-semibold">{f.rule_id}</span>
                          <span className="text-xs text-[#64716A] font-mono">[{f.category}]</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#17211D]">{f.title}</h4>
                        <p className="text-xs text-[#64716A] font-mono truncate">{f.affected_component}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          to={`/findings/${f.id}`}
                          onClick={e => e.stopPropagation()}
                          className="px-2.5 py-1 bg-[#F7F9F7] hover:bg-[#EAF5EE] text-[#17211D] hover:text-[#167653] rounded text-xs font-medium flex items-center gap-1 border border-[#E5EAE6]"
                        >
                          <span>Dossier</span>
                          <ExternalLink className="w-3 h-3 text-[#64716A]" />
                        </Link>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-[#64716A]" /> : <ChevronRight className="w-4 h-4 text-[#64716A]" />}
                      </div>
                    </div>

                    {/* Expanded Drawer */}
                    {isExpanded && (
                      <div className="p-4.5 bg-[#F7F9F7] border-t border-[#E5EAE6] space-y-4 text-xs">
                        {/* Risk Explanation */}
                        <div>
                          <span className="font-bold text-[#17211D] uppercase tracking-wide text-[11px] block mb-1">
                            Risk Explanation
                          </span>
                          <p className="text-[#64716A] leading-relaxed">{f.risk_explanation}</p>
                        </div>

                        {/* Remediation */}
                        <div>
                          <span className="font-bold text-[#167653] uppercase tracking-wide text-[11px] block mb-1">
                            Recommended Remediation
                          </span>
                          <p className="text-[#17211D] leading-relaxed bg-white p-2.5 rounded border border-[#E5EAE6] font-mono">
                            {f.remediation}
                          </p>
                        </div>

                        {/* Redacted Evidence */}
                        {f.evidence && Object.keys(f.evidence).length > 0 && (
                          <div>
                            <span className="font-bold text-[#64716A] uppercase tracking-wide text-[11px] block mb-1">
                              Telemetry Evidence (Sanitized)
                            </span>
                            <pre className="bg-white border border-[#E5EAE6] p-3 rounded text-[11px] font-mono text-[#17211D] overflow-x-auto">
                              {JSON.stringify(f.evidence, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* References */}
                        {f.references && f.references.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5EAE6]">
                            <span className="text-[#64716A] text-[11px]">References:</span>
                            {f.references.map((refUrl, rIdx) => (
                              <a
                                key={rIdx}
                                href={refUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#167653] hover:underline flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>{refUrl.split('/')[2] || 'Documentation'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Score Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-xl space-y-4 text-xs shadow-xs">
          <h3 className="text-sm font-bold text-[#17211D]">Deterministic Scoring Methodology</h3>
          <p className="text-[#64716A] leading-relaxed">
            The security score starts at a baseline of 100 points. Penalties are deducted based on finding severities, detection confidence multipliers, and diminishing penalties for repeated instances of identical root-cause rules to prevent double-counting.
          </p>

          {scan.score_breakdown && (
            <div className="space-y-4 pt-3 border-t border-[#E5EAE6]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
                  <div className="text-[#64716A]">Base Score</div>
                  <div className="text-base font-bold text-[#17211D] mt-0.5">100.0 pts</div>
                </div>
                <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
                  <div className="text-[#64716A]">Total Deductions</div>
                  <div className="text-base font-bold text-red-600 mt-0.5">-{scan.score_breakdown.total_penalty} pts</div>
                </div>
                <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
                  <div className="text-[#64716A]">Final Score</div>
                  <div className="text-base font-bold text-[#167653] mt-0.5">{scan.score_breakdown.final_score} / 100</div>
                </div>
                <div className="p-3 bg-[#F7F9F7] rounded border border-[#E5EAE6]">
                  <div className="text-[#64716A]">Rating</div>
                  <div className="text-base font-bold text-[#17211D] mt-0.5">{scan.score_breakdown.rating}</div>
                </div>
              </div>

              {scan.score_breakdown.deductions.length > 0 && (
                <div className="pt-2">
                  <span className="font-semibold text-[#17211D] block mb-2">Itemized Deductions Table:</span>
                  <div className="border border-[#E5EAE6] rounded-lg overflow-hidden font-mono">
                    <table className="w-full text-left">
                      <thead className="bg-[#F7F9F7] text-[#64716A] text-[11px] border-b border-[#E5EAE6]">
                        <tr>
                          <th className="p-2.5">Rule ID</th>
                          <th className="p-2.5">Title</th>
                          <th className="p-2.5">Severity</th>
                          <th className="p-2.5">Occurrence</th>
                          <th className="p-2.5 text-right">Deduction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5EAE6]">
                        {scan.score_breakdown.deductions.map((d, dIdx) => (
                          <tr key={dIdx} className="hover:bg-[#F7F9F7]">
                            <td className="p-2.5 text-[#17211D]">{d.rule_id}</td>
                            <td className="p-2.5 text-[#17211D] font-sans">{d.title}</td>
                            <td className="p-2.5 uppercase text-[#64716A] text-[10px]">{d.severity}</td>
                            <td className="p-2.5 text-[#64716A]">#{d.occurrence}</td>
                            <td className="p-2.5 text-right font-bold text-red-600">-{d.penalty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
