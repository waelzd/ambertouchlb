// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthContextType {
  authUser: User | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple hash function using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Generate a new UUID for the user
      const userId = generateUUID();
      const hashedPassword = await hashPassword(password);

      // Insert user directly into users table
      const userData = {
        id: userId,
        email: email,
        password: hashedPassword,
        full_name: fullName,
        phone: phone,
        role: 'customer',
        has_used_signup_discount: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message || 'Failed to create account');
      }

      console.log('User created successfully:', data);

      // Remove password from user object before storing in state
      const { password: _, ...userWithoutPassword } = data;

      setAuthUser(userWithoutPassword);
      setProfile(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Get user from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password');
      }

      // Hash the provided password and compare
      const hashedInput = await hashPassword(password);
      
      if (data.password !== hashedInput) {
        throw new Error('Invalid email or password');
      }

      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = data;
      
      setAuthUser(userWithoutPassword);
      setProfile(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setAuthUser(null);
    setProfile(null);
    localStorage.removeItem('user');
  };

  const refreshProfile = async () => {
    if (!authUser) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      
      const { password: _, ...userWithoutPassword } = data;
      setAuthUser(userWithoutPassword);
      setProfile(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthUser(user);
        setProfile(user);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
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