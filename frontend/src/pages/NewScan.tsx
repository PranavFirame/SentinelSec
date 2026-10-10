import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CheckDefinition, ScanProgress } from '../types';
import {
  SearchCode,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const NewScan: React.FC = () => {
  const navigate = useNavigate();

  const [target, setTarget] = useState('');
  const [profile, setProfile] = useState('standard');
  const [timeoutSeconds, setTimeoutSeconds] = useState(15);
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);

  const [allChecks, setAllChecks] = useState<CheckDefinition[]>([]);
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [showAdvancedChecks, setShowAdvancedChecks] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Scan Progress Modal State
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchChecks = async () => {
      try {
        const checks = await api.getAvailableChecks();
        setAllChecks(checks);
        setSelectedChecks(checks.map(c => c.id));
      } catch (err: any) {
        console.error('Failed to load checks:', err);
      }
    };
    fetchChecks();
  }, []);

  // Update selected checks when profile changes
  useEffect(() => {
    if (allChecks.length > 0) {
      if (profile === 'standard') {
        setSelectedChecks(allChecks.map(c => c.id));
      } else {
        const filtered = allChecks.filter(c => c.profiles.includes(profile)).map(c => c.id);
        setSelectedChecks(filtered);
      }
    }
  }, [profile, allChecks]);

  // Live polling for scan progress
  useEffect(() => {
    if (!activeScanId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const p = await api.getScanProgress(activeScanId);
        if (!isMounted) return;
        setProgress(p);

        if (p.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/scans/${activeScanId}`);
          }, 800);
        } else if (p.status === 'failed' || p.status === 'cancelled') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling scan progress:', err);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeScanId, navigate]);

  const handleToggleCheck = (checkId: string) => {
    setSelectedChecks(prev =>
      prev.includes(checkId) ? prev.filter(id => id !== checkId) : [...prev, checkId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!target.trim()) {
      setError('Please provide a valid target URL.');
      return;
    }

    if (!permissionConfirmed) {
      setError('You must confirm that you have explicit authorization to assess this target.');
      return;
    }

    try {
      setLoading(true);
      const newScan = await api.createScan({
        target: target.trim(),
        profile,
        enabled_checks: selectedChecks,
        timeout_seconds: timeoutSeconds,
        permission_confirmed: permissionConfirmed,
      });

      setActiveScanId(newScan.id);
      setProgress({
        scan_id: newScan.id,
        status: 'queued',
        checks_executed: 0,
        checks_total: selectedChecks.length || 16,
        percent_complete: 0,
        current_check: 'Initiating SSRF validations...',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start scan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async () => {
    if (!activeScanId) return;
    try {
      setCancelling(true);
      await api.cancelScan(activeScanId);
      setProgress(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err: any) {
      console.error('Failed to cancel scan:', err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SearchCode className="w-5 h-5 text-emerald-400" />
          Initiate Automated Security Assessment
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Perform non-destructive, defensive evaluations of transport security, HTTP configurations, and TLS certificates.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target URL Card */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-200">Target Host or URL</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Enter fully qualified domain or URL (e.g., https://example.com). Internal RFC 1918 and loopback IPs are blocked.
            </span>
            <div className="mt-2 relative">
              <input
                type="text"
                placeholder="https://example.com"
                value={target}
                onChange={e => setTarget(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </label>

          {/* Quick Target Presets for testing */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Examples:</span>
            <button
              type="button"
              onClick={() => setTarget('https://example.com')}
              className="text-emerald-400 hover:underline font-mono"
            >
              example.com
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setTarget('https://owasp.org')}
              className="text-emerald-400 hover:underline font-mono"
            >
              owasp.org
            </button>
          </div>
        </div>

        {/* Assessment Profile Selection */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
          <span className="text-sm font-semibold text-slate-200 block">Assessment Profile</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'standard',
                name: 'Standard Assessment',
                desc: 'All 16 non-destructive HTTP & TLS security checks',
              },
              {
                id: 'quick',
                name: 'Quick Assessment',
                desc: 'Essential HTTPS availability, TLS expiry, core headers',
              },
              {
                id: 'tls_headers',
                name: 'TLS & Headers Only',
                desc: 'Strict TLS certificate audit and HTTP security headers',
              },
            ].map(p => (
              <label
                key={p.id}
                className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                  profile === p.id
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-slate-100 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-xs text-slate-200">{p.name}</span>
                  <input
                    type="radio"
                    name="profile"
                    value={p.id}
                    checked={profile === p.id}
                    onChange={() => setProfile(p.id)}
                    className="text-emerald-500 focus:ring-emerald-500 mt-0.5"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Granular Checks Accordion */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvancedChecks(!showAdvancedChecks)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Configure Granular Security Checks ({selectedChecks.length} Enabled)</span>
            </div>
            {showAdvancedChecks ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showAdvancedChecks && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2 max-h-64 overflow-y-auto pr-1">
              {allChecks.map(chk => (
                <label
                  key={chk.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/40 cursor-pointer text-xs transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedChecks.includes(chk.id)}
                    onChange={() => handleToggleCheck(chk.id)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{chk.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{chk.id}</span>
                      <span className="text-[10px] text-slate-400 font-mono">[{chk.category}]</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{chk.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Scan Parameters: Timeout */}
        <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Per-Request Probe Timeout: {timeoutSeconds}s
            </span>
            <span className="text-xs font-mono text-slate-500">Max allowed: 60s</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={timeoutSeconds}
            onChange={e => setTimeoutSeconds(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Legal & Authorization Notice */}
        <div className="p-5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3 text-xs">
          <div className="flex items-start gap-2.5 text-amber-300">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Authorization Notice:</span> SentinelSec executes purely defensive, non-invasive automated checks. However, scanning systems without permission may violate acceptable-use policies. You must verify ownership or explicit permission.
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-amber-900/40 text-slate-200">
            <input
              type="checkbox"
              checked={permissionConfirmed}
              onChange={e => setPermissionConfirmed(e.target.checked)}
              required
              className="rounded border-amber-600 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="font-medium">
              I certify that I am authorized to assess the specified target.
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !permissionConfirmed || !target.trim()}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Target & Launching Worker...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Security Assessment</span>
            </>
          )}
        </button>
      </form>

      {/* Live Scan Progress Modal */}
      {activeScanId && progress && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <SearchCode className="w-5 h-5 text-emerald-400" />
                <span>Running Assessment</span>
              </div>
              <span className="font-mono text-xs text-slate-500">{activeScanId.slice(0, 8)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{progress.current_check || 'Processing checks...'}</span>
                <span className="text-emerald-400 font-bold">{progress.percent_complete}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(5, progress.percent_complete)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Checks executed: {progress.checks_executed} / {progress.checks_total}</span>
                <span>Status: {progress.status}</span>
              </div>
            </div>

            {progress.status === 'completed' && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Assessment finished! Redirecting to report dossier...</span>
              </div>
            )}

            {progress.status === 'cancelled' && (
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs flex items-center justify-between">
                <span>Assessment was cancelled.</span>
                <button
                  onClick={() => setActiveScanId(null)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
                >
                  Close
                </button>
              </div>
            )}

            {progress.status === 'failed' && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center justify-between">
                <span>Assessment worker encountered an error.</span>
                <button
                  onClick={() => setActiveScanId(null)}
                  className="px-2 py-1 bg-rose-900 rounded text-xs"
                >
                  Close
                </button>
              </div>
            )}

            {progress.status === 'running' && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">Cooperative non-destructive probe</span>
                <button
                  type="button"
                  onClick={handleCancelScan}
                  disabled={cancelling}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-slate-300 hover:text-rose-200 rounded-md text-xs font-medium transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{cancelling ? 'Cancelling...' : 'Cancel Scan'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
