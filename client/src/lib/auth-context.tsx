import { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType, UserRole } from './types';
import { supabase } from './supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserRole(userId: string): Promise<UserRole> {
  if (!supabase) return 'user';
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    return (data?.role as UserRole) || 'user';
  } catch {
    return 'user';
  }
}

async function fetchUserProfile(userId: string): Promise<Partial<User>> {
  if (!supabase) return {};
  try {
    const { data } = await supabase
      .from('users')
      .select('full_name, phone, profile_image, bio')
      .eq('id', userId)
      .single();
    return data || {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const [role, profile] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchUserProfile(session.user.id)
          ]);
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile.full_name || session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
            phone: profile.phone || session.user.phone || null,
            role,
            profile_image: profile.profile_image || session.user.user_metadata?.avatar_url || null,
            bio: profile.bio || null,
            created_at: session.user.created_at,
            updated_at: null
          };
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          return;
        }
        
        if (session?.user) {
          const [role, profile] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchUserProfile(session.user.id)
          ]);
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile.full_name || session.user.user_metadata?.name || session.user.user_metadata?.full_name || null,
            phone: profile.phone || session.user.phone || null,
            role,
            profile_image: profile.profile_image || session.user.user_metadata?.avatar_url || null,
            bio: profile.bio || null,
            created_at: session.user.created_at,
            updated_at: null
          };
          setUser(userData);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    if (!email || !password) throw new Error('Please enter both email and password');
    if (!supabase) throw new Error('Authentication service unavailable. Please try again later.');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw error;
    }
    
    if (data.user) {
      const role = await fetchUserRole(data.user.id);
      return role;
    }
    return 'user';
  };

  const signup = async (email: string, name: string, password: string, phone?: string): Promise<UserRole> => {
    if (!email || !name || !password) throw new Error('Please fill in all required fields');
    if (!supabase) throw new Error('Authentication service unavailable. Please try again later.');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          name,
          full_name: name,
          phone: phone || null
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user && !data.user.identities?.length) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    
    return 'user';
  };

  const loginWithGoogle = async (): Promise<void> => {
    if (!supabase) throw new Error('Authentication service unavailable. Please try again later.');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) throw error;
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!email) throw new Error('Please enter your email address');
    if (!supabase) throw new Error('Authentication service unavailable. Please try again later.');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      loginWithGoogle,
      logout, 
      resetPassword,
      isLoggedIn: !!user, 
      isLoading: loading 
    }}>
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

export async function getAuthToken(): Promise<string | null> {
  try {
    if (!supabase) {
      return null;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    return null;
  }
}
