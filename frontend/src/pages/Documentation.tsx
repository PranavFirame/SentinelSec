import React from 'react';
import { BookOpen, ShieldCheck, Lock, AlertTriangle, Layers, Database, ExternalLink } from 'lucide-react';

export const Documentation: React.FC = () => {
  const checksList = [
    {
      id: 'SEC-HTTP-001',
      name: 'HTTPS Availability',
      cat: 'Transport Security',
      sev: 'High',
      cwe: 'CWE-319',
      desc: 'Probes port 443 with TLS to confirm encrypted transit availability.',
    },
    {
      id: 'SEC-HTTP-002',
      name: 'HTTP to HTTPS Redirect',
      cat: 'Transport Security',
      sev: 'Medium',
      cwe: 'CWE-319',
      desc: 'Checks if cleartext HTTP requests return 301/308 redirects to HTTPS on the same host.',
    },
    {
      id: 'SEC-CSP-003',
      name: 'Content-Security-Policy (CSP)',
      cat: 'HTTP Headers',
      sev: 'Medium',
      cwe: 'CWE-1021',
      desc: 'Inspects presence of CSP and flags dangerous directives like unsafe-inline, unsafe-eval, or missing default-src.',
    },
    {
      id: 'SEC-HSTS-004',
      name: 'Strict-Transport-Security (HSTS)',
      cat: 'HTTP Headers',
      sev: 'Medium',
      cwe: 'CWE-523',
      desc: 'Validates HSTS presence, max-age duration (>= 180 days), and includeSubDomains.',
    },
    {
      id: 'SEC-XCTO-005',
      name: 'X-Content-Type-Options',
      cat: 'HTTP Headers',
      sev: 'Low',
      cwe: 'CWE-16',
      desc: 'Checks for nosniff header directive preventing MIME-type confusion attacks.',
    },
    {
      id: 'SEC-FRAME-006',
      name: 'Frame Protection (Clickjacking Defense)',
      cat: 'HTTP Headers',
      sev: 'Medium',
      cwe: 'CWE-1021',
      desc: 'Validates CSP frame-ancestors and X-Frame-Options (DENY or SAMEORIGIN) against UI redressing.',
    },
    {
      id: 'SEC-REFPOL-007',
      name: 'Referrer-Policy',
      cat: 'HTTP Headers',
      sev: 'Low',
      cwe: 'CWE-200',
      desc: 'Audits Referrer-Policy against URL token leakage on external cross-origin links.',
    },
    {
      id: 'SEC-PERMPOL-008',
      name: 'Permissions-Policy',
      cat: 'HTTP Headers',
      sev: 'Informational',
      cwe: 'CWE-16',
      desc: 'Reports whether browser capabilities (camera, microphone, geolocation) are restricted.',
    },
    {
      id: 'SEC-CORS-009',
      name: 'Cross-Origin Resource Sharing (CORS)',
      cat: 'Access Control',
      sev: 'High',
      cwe: 'CWE-942',
      desc: 'Probes CORS responses for arbitrary origin reflection paired with Access-Control-Allow-Credentials: true.',
    },
    {
      id: 'SEC-COOKIE-010',
      name: 'Cookie Security Attributes',
      cat: 'HTTP Headers',
      sev: 'Medium',
      cwe: 'CWE-614 / CWE-1004',
      desc: 'Inspects Set-Cookie headers for missing Secure, HttpOnly, and SameSite directives.',
    },
    {
      id: 'SEC-INFODISC-011',
      name: 'Server Information Disclosure',
      cat: 'Information Disclosure',
      sev: 'Low',
      cwe: 'CWE-200',
      desc: 'Inspects Server, X-Powered-By, and runtime banners disclosing precise software versions.',
    },
    {
      id: 'SEC-DIRLIST-012',
      name: 'Directory Listing Indicators',
      cat: 'Information Disclosure',
      sev: 'Medium',
      cwe: 'CWE-548',
      desc: 'Detects index signatures (Index of /, Parent Directory) on accessible responses without recursion.',
    },
    {
      id: 'SEC-PATH-013',
      name: 'Sensitive Path Exposure (Non-destructive)',
      cat: 'Information Disclosure',
      sev: 'High',
      cwe: 'CWE-538',
      desc: 'Safely probes a small whitelist of common dotfiles (/.env, /.git/HEAD) without downloading payloads.',
    },
    {
      id: 'SEC-TLS-014',
      name: 'TLS Certificate Expiry',
      cat: 'Certificate',
      sev: 'High / Critical',
      cwe: 'CWE-298',
      desc: 'Computes days remaining until TLS certificate expiry, flagging certificates expiring soon or already expired.',
    },
    {
      id: 'SEC-TLS-015',
      name: 'Certificate Hostname & Chain Trust',
      cat: 'Certificate',
      sev: 'High',
      cwe: 'CWE-295 / CWE-297',
      desc: 'Validates Subject Alternative Names (SANs) and verifies root Certificate Authority trust chain.',
    },
    {
      id: 'SEC-TLS-016',
      name: 'TLS Protocol Configuration',
      cat: 'Transport Security',
      sev: 'High',
      cwe: 'CWE-326',
      desc: 'Inspects negotiated TLS version and flags obsolete protocols (SSLv3, TLS 1.0, TLS 1.1).',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          Scanner Architecture & Technical Documentation
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Complete specification of implemented defensive checks, scoring math, advisory feeds, and safety constraints.
        </p>
      </div>

      {/* Section 1: Implemented Security Checks */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Implemented Security Checks (16 Checks)
        </h3>
        <p className="text-xs text-slate-400">
          Every check runs non-destructively, generates sanitized evidence, and maps to standard CWE identifiers.
        </p>

        <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Check Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Severity</th>
                <th className="p-3">CWE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {checksList.map(chk => (
                <tr key={chk.id} className="hover:bg-slate-800/20">
                  <td className="p-3 font-mono text-emerald-400 text-xs">{chk.id}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{chk.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{chk.desc}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-400 text-xs">{chk.cat}</td>
                  <td className="p-3 font-mono text-xs text-slate-300">{chk.sev}</td>
                  <td className="p-3 font-mono text-xs text-slate-400">{chk.cwe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Deterministic Risk Formula */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Risk Scoring Math & Deduplication Formula
        </h3>

        <p className="text-slate-300">
          SentinelSec calculates a deterministic score from 0 to 100 using a baseline deduction model:
        </p>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-emerald-300 text-xs">
          Score = max(0, min(100, round(100 - sum(Finding_Penalties))))
        </div>

        <div className="space-y-1.5 pt-2">
          <span className="font-semibold text-slate-200 block">Base Severity Penalties:</span>
          <ul className="list-disc list-inside text-slate-400 space-y-1">
            <li><strong className="text-rose-400">Critical:</strong> 25.0 points</li>
            <li><strong className="text-orange-400">High:</strong> 15.0 points</li>
            <li><strong className="text-amber-400">Medium:</strong> 8.0 points</li>
            <li><strong className="text-sky-400">Low:</strong> 3.0 points</li>
            <li><strong className="text-slate-400">Informational:</strong> 0.0 points</li>
          </ul>
        </div>

        <div className="space-y-1.5 pt-2">
          <span className="font-semibold text-slate-200 block">Deduplication Dampening:</span>
          <p className="text-slate-400">
            To prevent artificially plummeting scores when multiple instances of the same root rule occur (e.g., 6 cookies missing HttpOnly on a single application), repeat occurrences are scaled: 1st instance (100% weight), 2nd instance (35% weight), 3rd instance (15% weight), subsequent instances (5% weight).
          </p>
        </div>
      </div>

      {/* Section 3: OSV Advisory Feed Integration */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Open Source Vulnerabilities (OSV) Integration
        </h3>
        <p className="text-slate-300">
          Dependency vulnerability audits query the official public OSV batch API (<code className="text-emerald-400">https://api.osv.dev/v1/querybatch</code>). The client batches requests in chunks of 40, caches results locally for 1 hour, and maps upstream advisory aliases directly to CVE identifiers.
        </p>
      </div>

      {/* Section 4: SSRF & Defensive Boundaries */}
      <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3 text-xs leading-relaxed">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          SSRF Boundaries & Safe-Use Guarantee
        </h3>
        <p className="text-slate-300">
          SentinelSec resolves hostnames prior to connection, rejecting all private RFC 1918, loopback, link-local, multicast, and cloud metadata (169.254.169.254) addresses by default.
        </p>
        <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-200">
          <strong>Defensive Assessment Scope:</strong> SentinelSec strictly excludes destructive payloads, SQL injection testing, password spraying, command injection, and denial-of-service attempts. A score of 100 confirms compliance with the tested configurations, but does not guarantee the absence of zero-day vulnerabilities.
        </div>
      </div>
    </div>
  );
};
