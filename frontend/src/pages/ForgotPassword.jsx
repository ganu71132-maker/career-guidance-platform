import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft, Loader, Compass, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      // Redirect user to the reset password page on click
      const redirectToUrl = `${window.location.origin}/reset-password`;
      const { error: resetError } = await resetPassword(email, redirectToUrl);
      if (resetError) throw resetError;

      setSubmitted(true);
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
          <Link to="/" className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800 mb-5 sm:mb-6">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 sm:h-7 sm:w-7 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-800">Reset Password</h2>
          <p className="text-slate-500 text-sm sm:text-base">We will send you a secure link to reset your password.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Check your email</h3>
              <p className="text-slate-500 text-sm">
                We have sent a password reset link to <span className="text-slate-800 font-medium">{email}</span>. Please check your inbox and spam folder.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-500 font-medium transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Log In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="email" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <button disabled={loading} type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 shadow-md shadow-emerald-600/20 text-sm sm:text-base">
              {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
                <ArrowLeft className="h-4 w-4" /> Back to Log In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
