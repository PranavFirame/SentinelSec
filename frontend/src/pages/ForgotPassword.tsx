import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, AlertCircle, ArrowRight, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.forgotPassword({ email: email.trim().toLowerCase() });
      setSubmitted(true);
      // In development mode, the backend returns dev_token for testing when SMTP is not configured
      if (res.dev_token) {
        setDevResetToken(res.dev_token);
      }
    } catch (err: any) {

      setError(err.message || 'Unable to process reset request. Please try again.');
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
          Reset your password
        </h2>
        <p className="mt-2 text-xs text-[#64716A]">
          Enter your registered email address to receive secure reset instructions.
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

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EAF5EE] border border-[#C6E6D5] rounded-2xl text-xs text-[#167653] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Instructions Dispatched</span>
                </div>
                <p className="leading-relaxed">
                  If an account exists for <strong className="font-mono">{email}</strong>, a single-use password reset link with a 15-minute expiration has been generated.
                </p>
              </div>

              {devResetToken && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
                  <div className="font-bold">Development Sandbox Mode:</div>
                  <p className="text-[11px]">
                    No external SMTP server is configured. You can use this development token directly:
                  </p>
                  <div className="font-mono text-[11px] bg-white p-2 rounded border border-amber-200 break-all select-all">
                    {devResetToken}
                  </div>
                  <Link
                    to={`/reset-password?token=${devResetToken}`}
                    className="inline-flex items-center gap-1 font-bold text-[#167653] hover:underline pt-1"
                  >
                    Click to proceed with reset →
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-full border border-[#E5EAE6] hover:bg-[#F7F9F7] text-[#17211D] text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#17211D] mb-1">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing request...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-[#E5EAE6] text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#64716A] hover:text-[#17211D]"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
