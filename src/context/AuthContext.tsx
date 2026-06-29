import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { dbAdapter } from '../api/dbAdapter';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logIn: (email: string, password?: string) => Promise<void>;
  signUp: (name: string, email: string, password?: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    dbAdapter.getCurrentUser().then(sessionUser => {
      setUser(sessionUser);
      setLoading(false);
    });
  }, []);

  const logIn = async (email: string, password?: string) => {
    const sessionUser = await dbAdapter.logIn(email, password);
    setUser(sessionUser);
  };

  const signUp = async (name: string, email: string, password?: string) => {
    const sessionUser = await dbAdapter.signUp(name, email, password);
    setUser(sessionUser);
  };

  const logOut = async () => {
    await dbAdapter.logOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
