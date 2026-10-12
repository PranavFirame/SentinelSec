import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must accept the terms of service and defensive scanning policy.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        terms_accepted: agreeTerms,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="flex items-end gap-[3px] h-6 mr-1">
            <span className="w-1.5 h-3.5 bg-[#167653] rounded-xs" />
            <span className="w-1.5 h-6 bg-[#167653] rounded-xs" />
            <span className="w-1.5 h-4.5 bg-[#167653] rounded-xs" />
          </div>
          <span className="font-bold text-xl text-[#17211D] tracking-tight">
            Sentinel<span className="text-[#167653]">Sec</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-[#17211D] tracking-tight">
          Create your private security workspace
        </h2>
        <p className="mt-2 text-xs text-[#64716A]">
          Audit authorized targets with strict multi-tenant data isolation and real-time posture scoring.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#E5EAE6] rounded-3xl shadow-xs space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#E5EAE6] text-[#167653] focus:ring-[#167653] accent-[#167653] w-3.5 h-3.5 shrink-0"
                />
                <span className="text-[11px] text-[#64716A] leading-relaxed">
                  I agree to the Terms of Service, Privacy Policy, and certify that I will only scan domains I own or have explicit authorization to assess.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E5EAE6] text-center text-xs text-[#64716A]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#167653] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Isolation assurance */}
        <div className="mt-6 p-4 rounded-2xl bg-white border border-[#E5EAE6] text-center text-xs text-[#64716A] space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-[#167653] text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Complete Multi-Tenant Privacy Guarantee
          </div>
          <p className="text-[11px] leading-relaxed">
            Your scan findings, domain targets, and telemetry analytics are strictly isolated in your database tenant. No other user can access or view your reports.
          </p>
        </div>
      </div>
    </div>
  );
};
