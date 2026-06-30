import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Compass, User, Mail, Lock, Save, Loader, ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import NotificationBell from '../components/NotificationBell';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      setLoading(true); setMessage('');
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters'); return;
    }
    try {
      setLoading(true); setMessage('');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Password changed successfully!');
      setNewPassword('');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setLoading(true); setMessage('');
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await signOut();
      navigate('/');
    } catch (err) {
      setMessage('Error: ' + err.message);
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#f8fafc' }}>
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-emerald-100/20 blur-[100px] -z-10" />

      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        {/* Desktop Header */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 hidden md:flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-800">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> NextraPath
          </Link>
          <Link to="/dashboard" className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">← Back to Dashboard</Link>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex flex-col gap-3 px-4 py-3">
          {/* Row 1: Brand Logo & Notification Bell */}
          <div className="flex items-center justify-between">
            <Link to="/" className="text-base font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
              <Compass className="text-emerald-500 h-5 w-5" /> NextraPath
            </Link>
            <NotificationBell />
          </div>

          {/* Row 2: Segmented Navigation Tabs */}
          <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/20">
            <Link to="/dashboard" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">
              Dashboard
            </Link>
            <Link to="/explorer" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors">
              Explore
            </Link>
            <Link to="/resume" className="flex-1 text-center text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1.5 transition-colors flex items-center justify-center gap-0.5">
              Resume <span className="text-[9px]">✨</span>
            </Link>
            <Link to="/profile" className="flex-1 text-center bg-white text-emerald-600 text-[11px] font-bold py-1.5 rounded-lg shadow-sm border border-slate-200/40 transition-all">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Profile Settings</h1>
          <button 
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-red-500/10 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl mb-6 text-sm ${message.startsWith('Error') ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {/* Profile Info */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-sm mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2"><User className="h-5 w-5 text-emerald-500" /> Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 text-sm sm:text-base transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="email" value={user?.email || ''} disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-400 cursor-not-allowed text-sm sm:text-base" />
              </div>
            </div>
            <button disabled={loading} type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-70 shadow-sm text-sm sm:text-base">
              {loading ? <><Loader className="animate-spin h-4 w-4" /> Saving Changes...</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-sm mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2"><Lock className="h-5 w-5 text-purple-500" /> Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                  placeholder="Min 6 characters" />
              </div>
            </div>
            <button disabled={loading} type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all disabled:opacity-70 shadow-sm text-sm sm:text-base">
              {loading ? <><Loader className="animate-spin h-4 w-4" /> Updating Password...</> : <><Lock className="h-4 w-4" /> Update Password</>}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl border border-red-200 shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-2 flex items-center gap-2">Danger Zone</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">Deleting your account is permanent. All your profile data, progress, and saved careers will be permanently deleted.</p>
          <button onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm text-sm sm:text-base">
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-sm w-full border border-red-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Delete your account?</h3>
            <p className="text-slate-500 text-sm mb-4">This will permanently delete your profile and career learning progress. This cannot be undone.</p>
            <p className="text-slate-500 text-xs mb-2">Please type <span className="text-red-600 font-bold">delete my account</span> to confirm:</p>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-300 text-slate-800 placeholder-slate-400 mb-6 text-sm transition-all"
              placeholder="type delete my account..."
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">Cancel</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toLowerCase() !== 'delete my account' || loading}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
