import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = location.state?.from || null;

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      const redirectUrl = from ? `${window.location.origin}${from}` : `${window.location.origin}/dashboard`;
      const { error } = await signInWithGoogle(redirectUrl);
      if (error) throw error;
    } catch (err) {
      setError(err.message);
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-slate-800">Get Started</h2>
          <p className="text-slate-500 text-sm sm:text-base">Sign in or create an account instantly.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 border border-slate-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-70 shadow-sm text-sm sm:text-base gap-2.5 active:scale-[0.98] cursor-pointer"
        >
          {loading ? <Loader className="animate-spin h-5 w-5" /> : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>
      </div>
    </div>
  );
}
