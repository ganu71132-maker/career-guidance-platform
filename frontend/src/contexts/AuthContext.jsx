import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { id, full_name, email, role }
  const [loading, setLoading] = useState(true);

  // Fetch user profile (role) from the users table
  async function fetchProfile(userId) {
    try {
      console.log('Auth: Fetching profile for user...', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Auth: Supabase error fetching profile:', error);
        throw error;
      }
      
      console.log('Auth: Profile loaded successfully from DB:', data);
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Auth: Error inside fetchProfile:', err);
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    }),
    signOut: () => {
      setProfile(null);
      return supabase.auth.signOut();
    },
    resetPassword: (email, redirectTo) => supabase.auth.resetPasswordForEmail(email, { redirectTo }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    user,
    profile,       // { id, full_name, email, role }
    isAdmin: profile?.role?.toLowerCase() === 'admin' || profile?.role?.toLowerCase() === 'super admin',
    isSuperAdmin: profile?.role?.toLowerCase() === 'super admin',
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
