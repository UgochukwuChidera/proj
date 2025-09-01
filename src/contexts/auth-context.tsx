
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  // This function is no longer needed on the client, as the Edge Function handles it.
  // We keep the definition here to prevent breaking other components that might import the type,
  // but it will no longer be implemented or returned by the provider.
  updateUserMetadata: (metadata: { name?: string; avatarUrl?: string }) => Promise<{ user: User | null, error: AuthError | null }>;
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
  const [isLoading, setIsLoading] = useState(true); 

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      const appUser = await processSupabaseUser(supabaseUser);
      setUser(appUser);
      return { user: appUser, error: null };
    } catch (error) {
      // If refresh fails, it might mean the session is truly invalid.
      // The onAuthStateChange listener will likely catch a SIGNED_OUT event.
      console.error("Error refreshing user session:", error);
      setUser(null);
      return { user: null, error: error as AuthError };
    }
  }, []);

  useEffect(() => {
    const checkInitialSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const appUser = await processSupabaseUser(session?.user || null);
        setUser(appUser);
      } catch (e) {
        console.error("Error checking initial session:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // When a user signs in, signs out, or their token is refreshed, this will fire.
        // It's crucial for keeping the client-side user state in sync with the auth server.
        // E.g., if a password update logs the user out from other sessions, this listener will catch it.
        const appUser = await processSupabaseUser(session?.user || null);
        setUser(appUser);
        if (_event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    return { error };
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const updateUserMetadata = async (): Promise<{ user: User | null; error: AuthError | null }> => {
    // This function is now intentionally blank on the client.
    // The logic has been moved to a secure Edge Function.
    // We return a resolved promise to maintain type consistency for any components
    // that might still reference it during the refactor.
    console.warn("updateUserMetadata is now handled by an Edge Function and should not be called from the client context.");
    return Promise.resolve({ user: null, error: null });
  };
  
  const value = {
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUserMetadata // Provide the (now blank) function to maintain the context shape
  };

  return (
    <AuthContext.Provider value={value}>
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
