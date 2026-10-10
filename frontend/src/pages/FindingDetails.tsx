import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Finding } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  ExternalLink,
  CheckCircle,
  FileCode,
  AlertTriangle,
  RefreshCw,
  Tag
} from 'lucide-react';

export const FindingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchFinding = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getFinding(id);
        setFinding(data);
      } catch (err: any) {
        setError(err.message || 'Finding not found');
      } finally {
        setLoading(false);
      }
    };
    fetchFinding();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!finding) return;
    try {
      setUpdatingStatus(true);
      const updated = await api.updateFindingStatus(finding.id, newStatus);
      setFinding(updated);
      setStatusMessage(`Finding status updated to '${newStatus}'.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <span className="text-sm font-medium">Loading finding dossier...</span>
      </div>
    );
  }

  if (error || !finding) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Finding Not Found</span>
        </div>
        <p className="text-sm">{error || 'Finding does not exist.'}</p>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/scans/${finding.scan_id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessment Dossier</span>
        </Link>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <SeverityBadge severity={finding.severity} size="md" />
            <span className="font-mono text-xs text-slate-400 font-semibold">{finding.rule_id}</span>
            <span className="text-xs text-slate-500 font-mono">[{finding.category}]</span>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={finding.status}
              disabled={updatingStatus}
              onChange={e => handleStatusChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50"
            >
              <option value="open">Open (Active)</option>
              <option value="resolved">Resolved (Mitigated)</option>
              <option value="accepted_risk">Accepted Risk</option>
            </select>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100">{finding.title}</h2>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 break-all">
          <span className="text-slate-500 mr-2">Affected Component:</span>
          {finding.affected_component}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            <span className="text-slate-500">Confidence:</span>{' '}
            <span className="font-semibold text-slate-200 uppercase">{finding.confidence}</span>
          </div>
          {finding.cwe_id && (
            <div>
              <span className="text-slate-500">CWE Identifier:</span>{' '}
              <a
                href={`https://cwe.mitre.org/data/definitions/${finding.cwe_id.replace('CWE-', '')}.html`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline font-mono"
              >
                {finding.cwe_id}
              </a>
            </div>
          )}
          <div>
            <span className="text-slate-500">First Observed:</span>{' '}
            <span>{new Date(finding.first_observed_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-4">
        {/* Description & Overview */}
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2 text-sm">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Finding Description</h3>
          <p className="text-slate-200 leading-relaxed">{finding.description}</p>
        </div>

        {/* Why this matters */}
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2 text-sm">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Threat Context & Risk Impact</h3>
          <p className="text-slate-200 leading-relaxed">{finding.risk_explanation}</p>
        </div>

        {/* Remediation */}
        <div className="p-5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-2 text-sm">
          <h3 className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Recommended Remediation Steps</h3>
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed">
            {finding.remediation}
          </div>
        </div>

        {/* Evidence */}
        {finding.evidence && Object.keys(finding.evidence).length > 0 && (
          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2 text-sm">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Telemetry Evidence</h3>
            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
            <p className="text-[11px] text-slate-500">
              * Sensitive tokens, authorization headers, and cookie payload secrets have been redacted according to security policy.
            </p>
          </div>
        )}

        {/* References */}
        {finding.references && finding.references.length > 0 && (
          <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2 text-sm">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Authoritative Documentation</h3>
            <ul className="space-y-1.5 pt-1">
              {finding.references.map((ref, idx) => (
                <li key={idx}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-mono break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{ref}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
