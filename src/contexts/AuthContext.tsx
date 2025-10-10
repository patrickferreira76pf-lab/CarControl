import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const sessionUser = localStorage.getItem('fleet_user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle();

    if (error) throw new Error('Erro ao fazer login');
    if (!data) throw new Error('Usuário não encontrado ou inativo');

    const userData: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as 'USER' | 'MANAGER' | 'ADMIN',
    };

    localStorage.setItem('fleet_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase
      .from('users')
      .insert({
        email,
        password,
        name,
        role: 'USER',
        active: true,
      });

    if (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('Email já cadastrado');
      }
      throw new Error('Erro ao criar conta');
    }
  }

  async function signOut() {
    localStorage.removeItem('fleet_user');
    setUser(null);
  }

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
