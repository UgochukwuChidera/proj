
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

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ user: User | null; error: AuthError | null }> => {
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        name: metadata.name,
        avatar_url: metadata.avatarUrl,
      },
    });

    if (updateError) {
      return { user: null, error: updateError };
    }

    // After a successful update, explicitly refresh the session to get the latest user data
    // and update the local state, rather than relying solely on the listener.
    const { user: updatedUser, error: refreshError } = await refreshUser();
    return { user: updatedUser, error: refreshError };
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
