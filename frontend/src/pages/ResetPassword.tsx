import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError('A valid reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.resetPassword({
        token: token.trim(),
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed. The token may be invalid or expired.');
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
          Set a new password
        </h2>
        <p className="mt-2 text-xs text-[#64716A]">
          Ensure your new password contains at least 8 characters.
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

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EAF5EE] border border-[#C6E6D5] rounded-2xl text-xs text-[#167653] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Successfully</span>
                </div>
                <p className="leading-relaxed">
                  Your password has been updated. You will now be redirected to the sign-in page.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full py-2.5 px-4 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!tokenFromUrl && (
                <div>
                  <label className="block text-xs font-semibold text-[#17211D] mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Enter reset token from email"
                    className="w-full px-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs font-mono text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#17211D] mb-1">
                  New Password (min 8 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64716A] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211D] mb-1">
                  Confirm New Password
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm New Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
