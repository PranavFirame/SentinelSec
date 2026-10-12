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
        <h2 className="text-xl font-bold text-[#17211D] flex items-center gap-2">
          <SearchCode className="w-5 h-5 text-[#167653]" />
          Initiate Automated Security Assessment
        </h2>
        <p className="text-sm text-[#64716A] mt-1">
          Perform non-destructive, defensive evaluations of transport security, HTTP configurations, and TLS certificates.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target URL Card */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-4 shadow-xs">
          <label className="block">
            <span className="text-sm font-semibold text-[#17211D]">Target Host or URL</span>
            <span className="text-xs text-[#64716A] block mt-0.5">
              Enter fully qualified domain or URL (e.g., https://example.com). Private RFC 1918 and loopback IPs are blocked.
            </span>
            <div className="mt-2 relative">
              <input
                type="text"
                placeholder="https://example.com"
                value={target}
                onChange={e => setTarget(e.target.value)}
                required
                className="w-full bg-[#F7F9F7] border border-[#E5EAE6] rounded-xl px-4 py-2.5 text-sm font-mono text-[#17211D] placeholder-[#64716A] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653]"
              />
            </div>
          </label>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-2 text-xs text-[#64716A]">
            <span>Examples:</span>
            <button
              type="button"
              onClick={() => setTarget('https://example.com')}
              className="text-[#167653] hover:underline font-mono"
            >
              example.com
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setTarget('https://owasp.org')}
              className="text-[#167653] hover:underline font-mono"
            >
              owasp.org
            </button>
          </div>
        </div>

        {/* Assessment Profile Selection */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-3 shadow-xs">
          <span className="text-sm font-semibold text-[#17211D] block">Assessment Profile</span>
          
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
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  profile === p.id
                    ? 'bg-[#EAF5EE] border-[#167653] text-[#17211D] shadow-xs'
                    : 'bg-[#F7F9F7] border-[#E5EAE6] text-[#64716A] hover:border-[#C6E6D5]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-xs text-[#17211D]">{p.name}</span>
                  <input
                    type="radio"
                    name="profile"
                    value={p.id}
                    checked={profile === p.id}
                    onChange={() => setProfile(p.id)}
                    className="accent-[#167653] focus:ring-[#167653] mt-0.5"
                  />
                </div>
                <p className="text-[11px] text-[#64716A] mt-2 leading-relaxed">{p.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Granular Checks Accordion */}
        <div className="p-5 bg-white border border-[#E5EAE6] rounded-xl space-y-3 shadow-xs">
          <button
            type="button"
            onClick={() => setShowAdvancedChecks(!showAdvancedChecks)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-[#17211D]"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#167653]" />
              <span>Configure Granular Security Checks ({selectedChecks.length} Enabled)</span>
            </div>
            {showAdvancedChecks ? <ChevronUp className="w-4 h-4 text-[#64716A]" /> : <ChevronDown className="w-4 h-4 text-[#64716A]" />}
          </button>

          {showAdvancedChecks && (
            <div className="pt-3 border-t border-[#E5EAE6] space-y-2 max-h-64 overflow-y-auto pr-1">
              {allChecks.map(chk => (
                <label
                  key={chk.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#F7F9F7] cursor-pointer text-xs transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedChecks.includes(chk.id)}
                    onChange={() => handleToggleCheck(chk.id)}
                    className="rounded border-[#E5EAE6] text-[#167653] focus:ring-[#167653] mt-0.5 accent-[#167653]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#17211D]">{chk.name}</span>
                      <span className="font-mono text-[10px] text-[#64716A]">{chk.id}</span>
                      <span className="text-[10px] text-[#64716A] font-mono">[{chk.category}]</span>
                    </div>
                    <p className="text-[#64716A] text-[11px] mt-0.5">{chk.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Probe Timeout */}
        <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#17211D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#64716A]" />
              Per-Request Probe Timeout: {timeoutSeconds}s
            </span>
            <span className="text-xs font-mono text-[#64716A]">Max allowed: 60s</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={timeoutSeconds}
            onChange={e => setTimeoutSeconds(Number(e.target.value))}
            className="w-full accent-[#167653]"
          />
        </div>

        {/* Legal & Authorization Notice */}
        <div className="p-6 bg-[#EAF5EE] border border-[#C6E6D5] rounded-2xl space-y-3 text-xs">
          <div className="flex items-start gap-2.5 text-[#167653]">
            <Lock className="w-4 h-4 text-[#167653] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Defensive Assessment Notice:</span> SentinelSec executes purely non-invasive automated checks. You must verify ownership or explicit permission before assessing public systems.
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-[#C6E6D5] text-[#17211D]">
            <input
              type="checkbox"
              checked={permissionConfirmed}
              onChange={e => setPermissionConfirmed(e.target.checked)}
              required
              className="rounded border-[#167653] text-[#167653] focus:ring-[#167653] accent-[#167653]"
            />
            <span className="font-medium">
              I certify that I am authorized to assess the specified target host.
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Pill Button */}
        <button
          type="submit"
          disabled={loading || !permissionConfirmed || !target.trim()}
          className="w-full py-3.5 bg-[#167653] hover:bg-[#125e43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-full text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validating Target & Launching Probes...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Launch Automated Audit</span>
            </>
          )}
        </button>
      </form>

      {/* Live Scan Progress Modal */}
      {activeScanId && progress && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAE6] rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#17211D]">
                <SearchCode className="w-5 h-5 text-[#167653]" />
                <span>Running Assessment</span>
              </div>
              <span className="font-mono text-xs text-[#64716A]">{activeScanId.slice(0, 8)}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#64716A]">{progress.current_check || 'Processing checks...'}</span>
                <span className="text-[#167653] font-bold">{progress.percent_complete}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-[#F7F9F7] rounded-full overflow-hidden border border-[#E5EAE6]">
                <div
                  className="h-full bg-[#167653] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(5, progress.percent_complete)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64716A] pt-1">
                <span>Checks executed: {progress.checks_executed} / {progress.checks_total}</span>
                <span>Status: {progress.status}</span>
              </div>
            </div>

            {progress.status === 'completed' && (
              <div className="p-3 bg-[#EAF5EE] border border-[#C6E6D5] rounded-lg text-[#167653] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#167653]" />
                <span>Assessment finished! Redirecting to report dossier...</span>
              </div>
            )}

            {progress.status === 'cancelled' && (
              <div className="p-3 bg-[#F7F9F7] border border-[#E5EAE6] rounded-lg text-[#64716A] text-xs flex items-center justify-between">
                <span>Assessment was cancelled.</span>
                <button
                  onClick={() => setActiveScanId(null)}
                  className="px-2 py-1 bg-white border border-[#E5EAE6] hover:bg-[#F7F9F7] rounded text-xs text-[#17211D]"
                >
                  Close
                </button>
              </div>
            )}

            {progress.status === 'failed' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
                <span>Assessment worker encountered an error.</span>
                <button
                  onClick={() => setActiveScanId(null)}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs"
                >
                  Close
                </button>
              </div>
            )}

            {progress.status === 'running' && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#64716A]">Cooperative non-destructive probe</span>
                <button
                  type="button"
                  onClick={handleCancelScan}
                  disabled={cancelling}
                  className="px-3 py-1.5 bg-white hover:bg-red-50 border border-[#E5EAE6] text-[#64716A] hover:text-red-700 rounded-md text-xs font-medium transition flex items-center gap-1.5"
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
