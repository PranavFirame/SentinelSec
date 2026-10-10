import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Shield,
  Activity,
  Database,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Radio
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [allowLocal, setAllowLocal] = useState(false);
  const [defaultTimeout, setDefaultTimeout] = useState(15);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setConfig(data);
      setAllowLocal(data.allow_local_targets);
      setDefaultTimeout(data.default_timeout_seconds);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.updateSettings({
        allow_local_targets: allowLocal,
        default_timeout: defaultTimeout,
      });
      setSuccessMsg('Settings updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await api.seedDemoData();
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    try {
      const res = await api.clearDemoData();
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <span className="text-sm font-medium">Loading preferences & health telemetry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-400" />
          Scanner Engine Settings & System Posture
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure security policy constraints, SSRF protections, system health, and telemetry seed controls.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System Health Card */}
      <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Runtime Health & Environment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500">Service Name</span>
            <div className="text-slate-200 font-bold mt-0.5">{config?.project_name}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500">Scanner Engine Version</span>
            <div className="text-emerald-400 font-bold mt-0.5">v{config?.version}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-500">Database Engine</span>
            <div className="text-slate-200 font-bold mt-0.5">SQLite (Local Persistent)</div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          SSRF Boundaries & Scanning Controls
        </h3>

        {/* Local Targets Toggle */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                Allow Localhost & Private RFC 1918 Targets (Local Development Only)
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                When disabled (default), the scanner strictly blocks loopback (127.0.0.1, ::1), RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and link-local ranges to prevent Server-Side Request Forgery (SSRF). Enable this only when testing against locally hosted development servers. Cloud metadata (169.254.169.254) remains permanently blocked.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowLocal}
              onChange={e => setAllowLocal(e.target.checked)}
              className="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
            />
          </label>
        </div>

        {/* Default Timeout */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Default Request Timeout: {defaultTimeout}s
          </label>
          <input
            type="range"
            min="5"
            max="60"
            value={defaultTimeout}
            onChange={e => setDefaultTimeout(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <span className="text-[11px] text-slate-500 block">
            Applied to non-destructive HTTP and TLS socket probes (5s - 60s).
          </span>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>Save Preferences</span>
        </button>
      </form>

      {/* Demo Data Management */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Simulated Baseline Telemetry Management
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          SentinelSec supports clearly tagged simulated baseline scans so you can immediately experience telemetry dashboards, score history trends, and historical comparison tools. Demo records are tagged with <span className="font-mono text-purple-300">[Simulated Demo]</span>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/60 text-purple-200 font-semibold rounded-lg text-xs transition flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Seed 3 Demo Baseline Scans</span>
          </button>

          <button
            onClick={handleClear}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 text-slate-300 hover:text-rose-200 font-semibold rounded-lg text-xs transition flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Demo Baseline Scans</span>
          </button>
        </div>
      </div>

      {/* Scope Matrix */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-200">Capabilities & Safeguards Matrix</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-bold text-emerald-400 uppercase tracking-wide text-[11px] block">
              Authorized Capabilities (Defensive)
            </span>
            <ul className="space-y-1 text-slate-300 list-disc list-inside leading-relaxed">
              {config?.capabilities?.enabled?.map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-rose-400 uppercase tracking-wide text-[11px] block">
              Excluded Actions (Out of Scope)
            </span>
            <ul className="space-y-1 text-slate-400 list-disc list-inside leading-relaxed">
              {config?.capabilities?.disabled_out_of_scope?.map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
