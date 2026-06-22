import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, Loader, Compass } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
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
    try {
      setError('');
      setLoading(true);

      const emailTrimmed = email.trim().toLowerCase();

      // Step 1: Check if email exists
      const { data: exists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_to_check: emailTrimmed });
      
      if (checkError) console.error("Email verification check failed:", checkError);

      if (!exists) {
        throw new Error('This email is not registered. Please sign up first!');
      }

      // Step 2: Sign in
      const { data, error } = await signIn({ email: emailTrimmed, password });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Wrong password. Please check your password and try again.');
        }
        throw error;
      }

      // Step 3: Small delay to let session propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Fetch role directly using the authenticated session
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      console.log('Profile fetched:', profile, 'Error:', profileError);

      // Step 5: Redirect based on role
      if (profile && profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
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
            <Compass className="text-emerald-500 h-6 w-6 sm:h-7 sm:w-7" /> NaviCareer
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm sm:text-base">Log in to continue your career journey.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
                placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type={showPassword ? "text" : "password"} required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 text-slate-800 placeholder-slate-400 text-sm sm:text-base transition-all"
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
          <button disabled={loading} type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 shadow-md shadow-emerald-600/20 text-sm sm:text-base">
            {loading ? <Loader className="animate-spin h-5 w-5" /> : <><LogIn className="mr-2 h-5 w-5" /> Log In</>}
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
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.247-3.125C18.232 1.765 15.437.5 12.24.5 5.86.5.69 5.67.69 12s5.17 11.5 11.55 11.5c6.67 0 11.1-4.685 11.1-11.3 0-.76-.08-1.34-.18-1.915H12.24Z"
            />
          </svg>
          Google
        </button>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
