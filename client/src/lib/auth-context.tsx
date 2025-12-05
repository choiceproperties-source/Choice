import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from './types';
import { supabase, checkSupabaseConfig } from './supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<'user' | 'agent' | 'admin'> {
  if (!supabase) return 'user';
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    return (data?.role as 'user' | 'agent' | 'admin') || 'user';
  } catch {
    return 'user';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!supabase) {
          console.warn('Supabase not configured');
          setLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
            phone: null,
            role,
            profile_image: null,
            bio: null,
            created_at: session.user.created_at,
            updated_at: null
          };
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
            phone: null,
            role,
            profile_image: null,
            bio: null,
            created_at: session.user.created_at,
            updated_at: null
          };
          setUser(userData);
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Missing email or password');
    if (!supabase) throw new Error('Supabase not configured. Please check environment variables.');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, name: string, password: string) => {
    if (!email || !name || !password) throw new Error('Missing required fields');
    if (!supabase) throw new Error('Supabase not configured. Please check environment variables.');
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoggedIn: !!user, isLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
