
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthApiError, type AuthError, type Session, type User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setIsLoading(true); 
        try {
          const supabaseUser = session?.user;
          if (supabaseUser) {
            let isAdmin = false;
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', supabaseUser.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') { 
              console.error('Error fetching profile for admin status:', profileError.message);
            } else if (profile) {
              isAdmin = profile.is_admin || false;
            }

            const appUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email,
              name: supabaseUser.user_metadata?.name as string || supabaseUser.email?.split('@')[0] || 'User',
              avatarUrl: supabaseUser.user_metadata?.avatar_url as string || `https://placehold.co/100x100.png?text=${(supabaseUser.user_metadata?.name as string || supabaseUser.email || 'U').charAt(0).toUpperCase()}`,
              isAdmin: isAdmin,
            };
            setUser(appUser);
          } else {
            setUser(null);
          }
        } catch (error: any) {
          console.error("Error in onAuthStateChange handler:", error);
          if (error instanceof AuthApiError && 
              (error.message.includes('Invalid Refresh Token') || 
               error.message.includes('Token not found') ||
               error.status === 401 || error.status === 400 ||
               (error.message.toLowerCase().includes("failed to fetch") && error.message.toLowerCase().includes("refresh")) 
              )) {
            console.warn("Invalid session token or refresh error detected in onAuthStateChange, attempting to sign out locally to clear state.", error.message);
            await supabase.auth.signOut().catch(signOutError => {
              console.error("Error during explicit signOut attempt after auth error:", signOutError);
            });
          }
          setUser(null); 
        } finally {
          setIsLoading(false); 
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed toast from dependency array as it's stable, router was already removed

  const login = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // User state will be updated by onAuthStateChange
    setIsLoading(false);
    return { error };
  };

  const register = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          avatar_url: `https://placehold.co/100x100.png?text=${name.charAt(0).toUpperCase()}`,
        },
      },
    });
     if (error) {
      setIsLoading(false);
      return { error };
    }
    // If sign up is successful but requires email confirmation, user object might be in data.user
    // If auto-confirm is on, session will be set and onAuthStateChange will handle it.
    // If confirmation is needed, user object will be set in onAuthStateChange after confirmation.
    // For now, we assume onAuthStateChange will handle the user state.
    setIsLoading(false);
    return { error: null };
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // User state will be set to null by onAuthStateChange
    setUser(null); // Explicitly set user to null immediately for faster UI update
    setIsLoading(false);
  };

  const updateUserMetadata = async (metadata: { name?: string; avatarUrl?: string }): Promise<{ error: AuthError | null }> => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      data: {
        name: metadata.name,
        avatar_url: metadata.avatarUrl,
      },
    });
    if (!error && data.user) {
      // Manually update local user state to reflect changes immediately
      setUser(prevUser => {
        if (!prevUser) return null;
        // Fetch admin status again if necessary or assume it doesn't change on metadata update
        // For simplicity, we keep the existing admin status
        return {
            ...prevUser,
            name: data.user!.user_metadata.name as string || prevUser.name,
            avatarUrl: data.user!.user_metadata.avatar_url as string || prevUser.avatarUrl,
        };
      });
    }
    setIsLoading(false);
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
