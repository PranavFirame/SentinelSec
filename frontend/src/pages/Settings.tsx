import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Activity,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
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

  if (loading) {

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#64716A]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#167653] mb-3" />
        <span className="text-sm font-medium">Loading preferences & health telemetry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#17211D] flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#167653]" />
          Scanner Engine Settings & System Posture
        </h2>
        <p className="text-sm text-[#64716A] mt-1">
          Configure security policy constraints, SSRF protections, system health, and telemetry seed controls.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#EAF5EE] border border-[#C6E6D5] text-[#167653] rounded-lg text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="underline">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* System Health Card */}
      <div className="p-5 bg-white border border-[#E5EAE6] rounded-2xl space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#167653]" />
          Runtime Health & Environment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E5EAE6]">
            <span className="text-[#64716A]">Service Name</span>
            <div className="text-[#17211D] font-bold mt-0.5">{config?.project_name}</div>
          </div>
          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E5EAE6]">
            <span className="text-[#64716A]">Scanner Engine Version</span>
            <div className="text-[#167653] font-bold mt-0.5">v{config?.version}</div>
          </div>
          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E5EAE6]">
            <span className="text-[#64716A]">Database Engine</span>
            <div className="text-[#17211D] font-bold mt-0.5">SQLite (Local Persistent)</div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#167653]" />
          SSRF Boundaries & Scanning Controls
        </h3>

        {/* Local Targets Toggle */}
        <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#E5EAE6] space-y-2">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-[#17211D] block">
                Allow Localhost & Private RFC 1918 Targets (Local Development Only)
              </span>
              <p className="text-[11px] text-[#64716A] mt-1 leading-relaxed">
                When disabled (default), the scanner strictly blocks loopback (127.0.0.1, ::1), RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and link-local ranges to prevent Server-Side Request Forgery (SSRF). Enable this only when testing against locally hosted development servers. Cloud metadata (169.254.169.254) remains permanently blocked.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowLocal}
              onChange={e => setAllowLocal(e.target.checked)}
              className="mt-1 rounded border-[#E5EAE6] text-[#167653] focus:ring-[#167653] accent-[#167653] w-4 h-4"
            />
          </label>
        </div>

        {/* Default Timeout */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#17211D] block">
            Default Request Timeout: {defaultTimeout}s
          </label>
          <input
            type="range"
            min="5"
            max="60"
            value={defaultTimeout}
            onChange={e => setDefaultTimeout(Number(e.target.value))}
            className="w-full accent-[#167653]"
          />
          <span className="text-[11px] text-[#64716A] block">
            Applied to non-destructive HTTP and TLS socket probes (5s - 60s).
          </span>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#167653] hover:bg-[#125e43] text-white font-bold rounded-full text-xs transition flex items-center gap-2 disabled:opacity-50 shadow-xs"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>Save Preferences</span>
        </button>
      </form>

      {/* Scope Matrix */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl space-y-4 text-xs shadow-xs">
        <h3 className="text-sm font-bold text-[#17211D]">Capabilities & Safeguards Matrix</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-bold text-[#167653] uppercase tracking-wide text-[11px] block">
              Authorized Capabilities (Defensive)
            </span>
            <ul className="space-y-1 text-[#17211D] list-disc list-inside leading-relaxed">
              {config?.capabilities?.enabled?.map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-red-600 uppercase tracking-wide text-[11px] block">
              Excluded Actions (Out of Scope)
            </span>
            <ul className="space-y-1 text-[#64716A] list-disc list-inside leading-relaxed">
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
