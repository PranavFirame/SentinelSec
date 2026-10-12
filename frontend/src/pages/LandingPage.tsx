import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  SearchCode,
  Lock,
  ArrowRight,
  PackageSearch,
  Activity,
  Layers,
  CheckCircle2,
  FileCheck,
  Zap,
  Globe2,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-[#17211D] flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5EAE6]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-end gap-[3px] h-5 mr-0.5 shrink-0">
              <span className="w-1.5 h-3 bg-[#167653] rounded-sm" />
              <span className="w-1.5 h-5 bg-[#167653] rounded-sm" />
              <span className="w-1.5 h-4 bg-[#167653] rounded-sm" />
            </div>
            <div className="font-bold text-[#17211D] tracking-tight text-base leading-none">
              Sentinel<span className="text-[#167653]">Sec</span>
            </div>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#64716A]">
            <a href="#features" className="hover:text-[#17211D] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#17211D] transition-colors">How it Works</a>
            <a href="#transparency" className="hover:text-[#17211D] transition-colors">Principles</a>
            <Link to="/docs" className="hover:text-[#17211D] transition-colors">Docs</Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold text-[#17211D] hover:text-[#167653] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/scans/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#167653] hover:bg-[#125e43] text-white transition-colors shadow-sm"
            >
              <span>Audit Target</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-6 border-b border-[#E5EAE6] bg-[#F7F9F7]/60">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#167653] animate-pulse" />
            Defensive Security & Threat Telemetry Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#17211D] leading-[1.12]">
            See your security posture cleanly. <br className="hidden sm:inline" />
            <span className="text-[#167653]">Without the noise.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-[#64716A] leading-relaxed">
            SentinelSec performs safe, non-destructive web audits, inspecting TLS configurations, HTTP hardening headers, and package supply-chain CVE advisories in a clean, privacy-first interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/scans/new"
              className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-semibold bg-[#167653] hover:bg-[#125e43] text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <SearchCode className="w-4 h-4" />
              <span>Start Free Security Audit</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-semibold bg-white hover:bg-[#F7F9F7] text-[#17211D] border border-[#E5EAE6] transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore Live Telemetry</span>
              <ChevronRight className="w-4 h-4 text-[#64716A]" />
            </Link>
          </div>

          {/* Safe scanning disclaimer badge */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#64716A]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#167653]" />
              Non-invasive checks only
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#167653]" />
              Zero exploitation code
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#167653]" />
              100% Local & Open Source
            </span>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#17211D]">
            Precision intelligence designed for clarity
          </h2>
          <p className="text-sm text-[#64716A]">
            Eliminate alert fatigue with deterministic risk scoring and actionable remediation guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl bg-white border border-[#E5EAE6] space-y-4 hover:border-[#C6E6D5] transition-colors shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[#167653] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17211D]">TLS & Certificate Guard</h3>
            <p className="text-xs text-[#64716A] leading-relaxed">
              Detect expired or short-lived certificates, legacy protocol negotiations (TLS 1.0/1.1), insecure cipher suites, and missing SAN parameters before outages strike.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E5EAE6] space-y-4 hover:border-[#C6E6D5] transition-colors shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[#167653] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17211D]">HTTP Security Headers</h3>
            <p className="text-xs text-[#64716A] leading-relaxed">
              Assess HSTS preload enforcement, Content Security Policy (CSP), anti-clickjacking headers, X-Content-Type-Options, and referrer policy protections.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E5EAE6] space-y-4 hover:border-[#C6E6D5] transition-colors shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[#167653] flex items-center justify-center">
              <PackageSearch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17211D]">Supply Chain CVE Audit</h3>
            <p className="text-xs text-[#64716A] leading-relaxed">
              Parse requirements.txt and package-lock.json manifests directly against the official OSV database to detect vulnerable open-source dependencies without exposing tokens.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-[#F7F9F7] border-y border-[#E5EAE6]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#17211D]">
              Three steps to complete assessment
            </h2>
            <p className="text-xs text-[#64716A]">Simple, fast, and entirely non-intrusive.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#167653] bg-[#EAF5EE] px-2.5 py-1 rounded">01</span>
              <h4 className="text-sm font-bold text-[#17211D]">Enter Target URL</h4>
              <p className="text-xs text-[#64716A] leading-relaxed">
                Provide your authorized web host. SentinelSec strictly verifies host resolution and enforces SSRF guardrails before sending requests.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#167653] bg-[#EAF5EE] px-2.5 py-1 rounded">02</span>
              <h4 className="text-sm font-bold text-[#17211D]">Automated Safe Probing</h4>
              <p className="text-xs text-[#64716A] leading-relaxed">
                Execute modular security checks in parallel: inspect response headers, negotiate TLS ciphers, and parse robots.txt for exposure.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#167653] bg-[#EAF5EE] px-2.5 py-1 rounded">03</span>
              <h4 className="text-sm font-bold text-[#17211D]">Review Actionable Fixes</h4>
              <p className="text-xs text-[#64716A] leading-relaxed">
                Receive prioritized findings with explicit code remediation snippets, server configurations, and download executive JSON summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-[#E5EAE6] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#64716A]">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px] h-4">
              <span className="w-1 h-2.5 bg-[#167653] rounded-xs" />
              <span className="w-1 h-4 bg-[#167653] rounded-xs" />
              <span className="w-1 h-3 bg-[#167653] rounded-xs" />
            </div>
            <span className="font-bold text-[#17211D]">SentinelSec</span>
            <span>— Lightweight Security Assessment Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-[#17211D] transition-colors">Dashboard</Link>
            <Link to="/history" className="hover:text-[#17211D] transition-colors">History</Link>
            <Link to="/docs" className="hover:text-[#17211D] transition-colors">Docs</Link>
            <a
              href="https://github.com/PranavFirame/SentinelSec"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#17211D] transition-colors font-medium text-[#167653]"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
