import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({
        email: email.trim().toLowerCase(),
        password,
        remember_me: rememberMe,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
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
          Sign in to your private workspace
        </h2>
        <p className="mt-2 text-xs text-[#64716A]">
          Access your defensive security audits, telemetry trends, and isolated reports.
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#17211D]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#167653] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#E5EAE6] text-[#167653] focus:ring-[#167653] accent-[#167653] w-3.5 h-3.5"
                />
                <span className="text-xs text-[#64716A]">Keep session persistent (30 days)</span>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#E5EAE6] text-center text-xs text-[#64716A]">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-[#167653] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex justify-center items-center gap-4 text-[11px] text-[#64716A]">
          <span className="flex items-center gap-1 text-[#167653]">
            <Shield className="w-3.5 h-3.5" /> Argon2id Protected
          </span>
          <span>•</span>
          <span>HttpOnly Session</span>
          <span>•</span>
          <span>Tenant Isolated</span>
        </div>
      </div>
    </div>
  );
};
