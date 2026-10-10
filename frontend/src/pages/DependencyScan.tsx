import React, { useState } from 'react';
import { api } from '../services/api';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  PackageSearch,
  UploadCloud,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Code2
} from 'lucide-react';

export const DependencyScan: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawContent, setRawContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('requirements.txt');
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Preset sample manifests for quick testing
  const sampleRequirements = `# Example Python requirements with known advisories
flask==2.2.2
jinja2==2.11.2
requests==2.25.1
urllib3==1.26.4
cryptography==3.3.2`;

  const samplePackageLock = `{
  "name": "sample-vulnerable-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/lodash": {
      "version": "4.17.20"
    },
    "node_modules/axios": {
      "version": "0.21.1"
    },
    "node_modules/minimist": {
      "version": "1.2.5"
    }
  }
}`;

  const handleScan = async () => {
    setError(null);
    if (activeTab === 'upload' && !selectedFile) {
      setError('Please choose a lockfile to upload.');
      return;
    }
    if (activeTab === 'paste' && !rawContent.trim()) {
      setError('Please paste manifest or lockfile text content.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.scanDependencies({
        file: activeTab === 'upload' ? selectedFile! : undefined,
        rawContent: activeTab === 'paste' ? rawContent : undefined,
        filename: activeTab === 'paste' ? filename : selectedFile?.name,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Dependency assessment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <PackageSearch className="w-5 h-5 text-emerald-400" />
          Software Supply Chain & Dependency Intelligence
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Audit project manifests and lockfiles for known public CVE advisories via the official Open Source Vulnerabilities (OSV) database.
        </p>
      </div>

      {/* Input Card */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-5">
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-4 border-b-2 transition ${
              activeTab === 'paste'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Manifest Code
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-4 border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Lockfile File
          </button>
        </div>

        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Manifest Format Type:</label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Insert Sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilename('requirements.txt');
                    setRawContent(sampleRequirements);
                  }}
                  className="text-emerald-400 hover:underline font-mono text-[11px]"
                >
                  requirements.txt
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilename('package-lock.json');
                    setRawContent(samplePackageLock);
                  }}
                  className="text-emerald-400 hover:underline font-mono text-[11px]"
                >
                  package-lock.json
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              >
                <option value="requirements.txt">Python (requirements.txt)</option>
                <option value="package-lock.json">Node.js (package-lock.json)</option>
                <option value="poetry.lock">Python Poetry (poetry.lock)</option>
              </select>
            </div>

            <textarea
              rows={8}
              value={rawContent}
              onChange={e => setRawContent(e.target.value)}
              placeholder="Paste manifest or lockfile contents here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-3">
            <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40">
              <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select package-lock.json or requirements.txt'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Supported: package-lock.json, requirements.txt, poetry.lock
              </span>
              <input
                type="file"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying OSV Advisory Database...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Manifest for CVEs</span>
            </>
          )}
        </button>
      </div>

      {/* Results Presentation */}
      {result && (
        <div className="space-y-5">
          {/* Results Header Card */}
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-slate-500 font-semibold">
                Manifest: {result.filename}
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                Supply Chain Security Evaluation
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span>{result.total_dependencies} dependencies analyzed</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{result.vulnerabilities_found} CVE advisories</span>
                <span>•</span>
                <span>{result.unpinned_dependencies} unpinned</span>
              </div>
            </div>

            <ScoreGauge score={result.security_score} size="md" />
          </div>

          {/* Vulnerabilities Table */}
          {result.findings && result.findings.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200">
                Discovered Security Advisories ({result.findings.length})
              </h4>
              <div className="space-y-3">
                {result.findings.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={f.severity} size="sm" />
                        <span className="font-mono font-bold text-slate-200">{f.rule_id}</span>
                        <span className="text-slate-500 font-mono">[{f.affected_component}]</span>
                      </div>
                    </div>

                    <h5 className="font-semibold text-slate-100">{f.title}</h5>

                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-emerald-400 font-mono">
                      Remediation: {f.remediation}
                    </div>

                    {f.evidence && f.evidence.fixed_versions?.length > 0 && (
                      <div className="text-[11px] text-slate-400">
                        Fixed in versions: <span className="font-mono text-slate-200">{f.evidence.fixed_versions.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-center text-xs text-emerald-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span className="font-bold block text-sm">No Known CVE Advisories Identified</span>
              <p className="text-slate-400 mt-1">
                All parsed packages currently match clean records in the OSV database feed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
