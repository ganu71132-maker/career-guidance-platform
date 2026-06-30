import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Loader, Compass, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sets recovery session automatically when landing from recovery link.
    // Let's verify that we have a valid session to reset the password.
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your password reset session has expired or is invalid. Please request a new reset link.');
      }
    }
    checkSession();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Subtle background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-100/40 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/40 blur-[100px]" />

      <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800 mb-5 sm:mb-6">
            <Compass className="text-emerald-500 h-6 w-6 sm:h-7 sm:w-7" /> NextraPath
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-800">Create New Password</h2>
          <p className="text-slate-500 text-sm sm:text-base">Please enter your new secure password.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {success ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Password Updated</h3>
              <p className="text-slate-500 text-sm">
                Your password has been successfully updated. Redirecting to the Login page...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="password" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="password" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                  placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>

            <button disabled={loading || error.includes('expired')} type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 shadow-md shadow-emerald-600/20 text-sm sm:text-base">
              {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
