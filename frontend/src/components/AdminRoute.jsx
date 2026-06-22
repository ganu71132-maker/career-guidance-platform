import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but NOT admin → show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="glass p-8 rounded-2xl text-center max-w-md border border-red-500/20">
          <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 mb-6">Your account role is not set to <span className="text-white font-medium">admin</span>. Change your role in the Supabase database to get access.</p>
          <div className="flex gap-3">
            <a href="/" className="flex-1 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors text-center text-sm">← Home</a>
            <a href="/login" className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-500 transition-colors text-center text-sm">Try Again</a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
