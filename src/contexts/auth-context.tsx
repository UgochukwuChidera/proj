
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { type AuthError, type Session, type User as SupabaseUser } from '@supabase/supabase-js';

interface User { 
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<void>;
  updateUserMetadata: (metadata: { name?: string; avatarUrl?: string }) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Helper function to process a Supabase user into our app's User object
const processSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    let isAdmin = false;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // Ignore "row not found" error
        console.error('Error fetching profile for admin status:', profileError.message);
      } else if (profile) {
        isAdmin = profile.is_admin || false;
      }
    } catch (e) {
        console.error('Error fetching user profile:', e);
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User',
      avatarUrl: supabaseUser.user_metadata?.avatar_url as string || `https://placehold.co/100x100.png?text=${(supabaseUser.user_metadata?.name as string || supabaseUser.email || 'U').charAt(0).toUpperCase()}`,
      isAdmin: isAdmin,
    };
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // isLoading is now only for the very first authentication check when the app loads.
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    // 1. Run an initial check to see if a session exists.
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const appUser = await processSupabaseUser(session?.user || null);
        setUser(appUser);
      } catch (e) {
        console.error("Error checking initial session:", e);
        setUser(null);
      } finally {
        // Crucially, set loading to false only after this first check completes.
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // 2. Set up a listener for subsequent auth changes (login, logout, token refresh).
    // This listener will update the user state silently without triggering the global loader.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const appUser = await processSupabaseUser(session?.user || null);
        setUser(appUser);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // The onAuthStateChange listener will handle updating the user state.
    return { error };
  };

  const register = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          avatar_url: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`,
        },
      },
    });
    // The onAuthStateChange listener will handle the state if auto-confirmation is on.
    return { error };
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will set the user to null.
  };

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.updateUser({
      data: {
        name: metadata.name,
        avatar_url: metadata.avatarUrl,
      },
    });
    // The onAuthStateChange listener (event: USER_UPDATED) will handle refreshing the user state.
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUserMetadata }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
