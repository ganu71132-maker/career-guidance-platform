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
        
      if (error && error.code === 'PGRST116') {
        // Self-healing: Profile doesn't exist in public.users, let's create it!
        console.log('Auth: Profile not found, attempting to create one...');
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (currentUser) {
          const email = currentUser.email;
          const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || email.split('@')[0];
          
          // Insert into users
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              full_name: fullName,
              email: email,
              role: 'user'
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('Auth: Failed to self-heal profile:', insertError);
            throw insertError;
          }

          // Insert into user_gamification
          const { error: gamificationError } = await supabase
            .from('user_gamification')
            .insert({
              user_id: userId,
              total_xp: 0,
              current_streak: 0,
              longest_streak: 0
            });
          
          if (gamificationError) {
            console.error('Auth: Failed to create gamification row:', gamificationError);
          }

          console.log('Auth: Profile self-healed successfully:', newProfile);
          setProfile(newProfile);
          return newProfile;
        }
      }
      
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
    let lastUserId = null;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(prev => (prev?.id === currentUser?.id ? prev : currentUser));
      if (currentUser) {
        lastUserId = currentUser.id;
        fetchProfile(currentUser.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      
      // Update user state only if the user ID has changed to prevent unnecessary re-renders
      setUser(prev => (prev?.id === currentUser?.id ? prev : currentUser));
      
      if (currentUser) {
        if (currentUser.id !== lastUserId) {
          lastUserId = currentUser.id;
          fetchProfile(currentUser.id);
        }
      } else {
        lastUserId = null;
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signInWithGoogle: (customRedirect) => supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: customRedirect || `${window.location.origin}/dashboard`
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
