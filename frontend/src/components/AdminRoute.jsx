import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but NOT admin → silently redirect to dashboard for security
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
