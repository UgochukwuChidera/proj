
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

// Helper function to generate two-initial placeholder
const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Helper function to process a Supabase user into our app's User object
const processSupabaseUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) return null;

    let profileData = {
      isAdmin: false,
      name: '',
      avatarUrl: ''
    };

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, name, avatar_url')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // Ignore "row not found" error
        console.error('Error fetching profile:', profileError.message);
      } else if (profile) {
        profileData.isAdmin = profile.is_admin || false;
        profileData.name = profile.name || '';
        profileData.avatarUrl = profile.avatar_url || '';
      }
    } catch (e) {
        console.error('Exception when fetching user profile:', e);
    }
    
    const fallbackName = supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User';
    const finalName = profileData.name || fallbackName;
    const fallbackAvatar = `https://placehold.co/128x128.png?text=${getInitials(finalName)}`;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      // Prioritize data from the 'profiles' table, then user_metadata, then fallbacks.
      name: finalName,
      avatarUrl: profileData.avatarUrl || supabaseUser.user_metadata?.avatar_url || fallbackAvatar,
      isAdmin: profileData.isAdmin,
    };
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

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
    const initials = getInitials(name);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          avatar_url: `https://placehold.co/128x128.png?text=${initials}`,
        },
      },
    });
    return { error };
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const updateUserMetadata = async (): Promise<{ user: User | null; error: AuthError | null }> => {
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
      updateUserMetadata
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
