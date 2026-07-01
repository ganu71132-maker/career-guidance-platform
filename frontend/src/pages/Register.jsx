import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Lock, UserPlus, User, Loader, Compass } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    try {
      setError(''); setMessage(''); setLoading(true);

      // Check if email already exists using RPC
      const { data: exists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_to_check: email.trim().toLowerCase() });

      if (checkError) console.error("Email verification check failed:", checkError);
      
      if (exists) {
        throw new Error('This email is already registered. If you already have an account, please log in instead!');
      }

      const { error } = await signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw error;

      setMessage('Registration successful! A confirmation email has been sent. Please check your inbox (and spam folder) to verify your account, then you can log in. Redirecting to login page shortly...');
      setTimeout(() => navigate('/login'), 8000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#f8fafc' }}>
      {/* Subtle background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-100/40 blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-100/40 blur-[100px]" />

      <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-800 mb-5 sm:mb-6">
            <img src="/logo.png" alt="NextraPath Logo" className="h-6 w-6 sm:h-7 sm:w-7 object-contain drop-shadow-sm" /> NextraPath
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-800">Create Account</h2>
          <p className="text-slate-500 text-sm sm:text-base">Start your career planning journey.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type={showPassword ? "text" : "password"} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-lg hover:scale-110 transition-transform focus:outline-none select-none cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👀"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type={showConfirmPassword ? "text" : "password"} required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-2.5 text-lg hover:scale-110 transition-transform focus:outline-none select-none cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "🙈" : "👀"}
              </button>
            </div>
          </div>
          <button disabled={loading} type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 mt-2 shadow-md shadow-emerald-600/20 text-sm sm:text-base">
            {loading ? <><Loader className="animate-spin h-5 w-5 mr-2" /> Creating Account...</> : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 border border-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 shadow-sm text-sm sm:text-base gap-2.5 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors">Log in</Link>
        </div>
      </div>
    </div>
  );
}
