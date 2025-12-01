import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('choiceProperties_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored user');
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    if (!email || !password) return;
    const users = JSON.parse(localStorage.getItem('choiceProperties_users') || '[]');
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (found) {
      const userData: User = { id: found.id, email: found.email, name: found.name, created_at: found.created_at };
      setUser(userData);
      localStorage.setItem('choiceProperties_user', JSON.stringify(userData));
    }
  };

  const signup = (email: string, name: string, password: string) => {
    if (!email || !name || !password) return;
    const users = JSON.parse(localStorage.getItem('choiceProperties_users') || '[]');
    if (users.find((u: any) => u.email === email)) return;
    
    // Create admin user if it doesn't exist
    if (!users.find((u: any) => u.email === 'admin@choiceproperties.com')) {
      users.push({ 
        id: 'admin_user_1', 
        email: 'admin@choiceproperties.com', 
        name: 'Admin', 
        password: 'admin123', 
        created_at: new Date().toISOString() 
      });
    }

    const newUser = { id: `user_${Date.now()}`, email, name, password, created_at: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('choiceProperties_users', JSON.stringify(users));

    const userData: User = { id: newUser.id, email: newUser.email, name: newUser.name, created_at: newUser.created_at };
    setUser(userData);
    localStorage.setItem('choiceProperties_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('choiceProperties_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoggedIn: !!user }}>
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
