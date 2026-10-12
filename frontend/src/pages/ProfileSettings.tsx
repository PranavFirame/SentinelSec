import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Lock, Trash2, CheckCircle2, AlertTriangle, RefreshCw, Shield, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileSettings: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account deletion fields
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    try {
      setProfileLoading(true);
      setProfileMsg(null);
      await api.updateProfile({ full_name: fullName.trim() });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMsg(null);
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDeleteMsg({ type: 'error', text: 'Please type "DELETE" to confirm account deletion.' });
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteMsg(null);
      await api.deleteAccount({
        password: deletePassword,
      });
      await logout();
      navigate('/login');
    } catch (err: any) {

      setDeleteMsg({ type: 'error', text: err.message || 'Failed to delete account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#17211D] flex items-center gap-2">
          <User className="w-5 h-5 text-[#167653]" />
          User Profile & Security Settings
        </h2>
        <p className="text-sm text-[#64716A] mt-1">
          Manage your account profile details, credentials, and tenant data.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE6]">
          <div>
            <h3 className="text-sm font-bold text-[#17211D]">Account Identity</h3>
            <p className="text-xs text-[#64716A]">Registered security analyst details</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]">
            Tenant: {user?.id.slice(0, 8)}...
          </span>
        </div>

        {profileMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            profileMsg.type === 'success'
              ? 'bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1">
                Email Address (Primary Identity)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-[#F7F9F7] border border-[#E5EAE6] rounded-xl text-xs text-[#64716A] cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-[#64716A] mt-1 block">Email address cannot be modified once verified.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="px-5 py-2 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            {profileLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Update Profile Details</span>
          </button>
        </form>
      </div>

      {/* Security Credentials Card */}
      <div className="p-6 bg-white border border-[#E5EAE6] rounded-2xl shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EAE6]">
          <div>
            <h3 className="text-sm font-bold text-[#17211D] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#167653]" />
              Update Account Password
            </h3>
            <p className="text-xs text-[#64716A]">Keep your tenant account protected with a strong password</p>
          </div>
          <span className="text-xs text-[#64716A] flex items-center gap-1 font-mono">
            <Shield className="w-3.5 h-3.5 text-[#167653]" /> Argon2id
          </span>
        </div>

        {passwordMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            passwordMsg.type === 'success'
              ? 'bg-[#EAF5EE] text-[#167653] border border-[#C6E6D5]'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-white border border-[#E5EAE6] rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-[#167653] focus:ring-1 focus:ring-[#167653]"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-5 py-2 rounded-full bg-[#167653] hover:bg-[#125e43] text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            {passwordLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Save New Password</span>
          </button>
        </form>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="p-6 bg-red-50/50 border border-red-200 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            Delete Account and Data Tenant
          </h3>
          <p className="text-xs text-red-600 mt-0.5">
            Permanently delete your user profile and all associated audits, telemetry findings, and generated reports. This action cannot be reversed.
          </p>
        </div>

        {deleteMsg && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{deleteMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md pt-2">
          <div>
            <label className="block text-xs font-semibold text-red-900 mb-1">
              Confirm Account Password
            </label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs text-[#17211D] focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-900 mb-1">
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              required
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-mono text-[#17211D] focus:outline-none focus:border-red-600"
            />
          </div>

          <button
            type="submit"
            disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
            className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-40"
          >
            {deleteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Permanently Delete Account</span>
          </button>
        </form>
      </div>
    </div>
  );
};
