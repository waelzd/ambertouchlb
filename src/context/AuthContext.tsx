// context/AuthContext.js - Updated version
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

type AuthContextType = {
  authUser: AuthUser | null;
  profile: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string, isVerified?: boolean) => Promise<{ error: string | null; role: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkEmailVerification: (email: string) => Promise<{ verified: boolean; error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error: string | null }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // In your AuthContext provider
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthUser(session.user);
        // Fetch profile immediately on sign in
        const profile = await getProfile(session.user.id);
        if (profile) {
          setProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setProfile(null);
      }
    }
  );

  // Initial session check
  const initSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setAuthUser(session.user);
      const profile = await getProfile(session.user.id);
      if (profile) {
        setProfile(profile);
      }
    }
    setLoading(false);
  };
  initSession();

  return () => subscription.unsubscribe();
}, []);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message, role: null };

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return { error: null, role: profile?.role ?? null };
  };

 // Updated signUp with isVerified parameter and immediate profile loading
const signUp = async (email: string, password: string, fullName: string, phone: string, isVerified: boolean = false) => {
  setLoading(true);
  
  try {
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email_verified, full_name, phone')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      // If user exists but is not verified, we can update their info
      if (!existingUser.email_verified) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            full_name: fullName,
            phone: phone,
            email_verified: isVerified,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateError) {
          console.error('Update error:', updateError);
          setLoading(false);
          return { error: updateError.message, role: null };
        }

        // Get updated profile
        const { data: updatedProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (!profileError && updatedProfile) {
          // Set profile in context immediately
          setProfile(updatedProfile);
        }

        setLoading(false);
        return { error: null, role: updatedProfile?.role ?? 'customer' };
      } else {
        // User exists and is verified
        setLoading(false);
        return { error: 'An account with this email already exists', role: null };
      }
    }

    // Only create Supabase auth user when verified
    if (isVerified) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            email_verified: true,
          },
        },
      });

      if (authError) {
        console.error('Signup error:', authError);
        setLoading(false);
        return { error: authError.message, role: null };
      }

      if (!authData.user) {
        setLoading(false);
        return { error: 'No user returned from signup', role: null };
      }

      // Create user profile with email_verified flag
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          role: 'customer',
          has_used_signup_discount: true,
          email_verified: true,
          verified_at: new Date().toISOString(),
        })
        .select('*') // Select all fields
        .single();

      if (insertError) {
        console.error('Insert error:', insertError.message, insertError.code);
        // If insert fails, try to clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error);
        setLoading(false);
        return { error: insertError.message, role: null };
      }

      // Set auth user and profile immediately
      setAuthUser(authData.user);
      setProfile(inserted);

      setLoading(false);
      return { error: null, role: inserted?.role ?? 'customer' };
    } else {
      // For unverified signups, just store user data without creating auth account
      // This is handled by the verification flow
      setLoading(false);
      return { error: null, role: null };
    }
  } catch (error) {
    console.error('Signup error:', error);
    setLoading(false);
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred', role: null };
  }
};

// Add this function to your AuthContext
const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Also add a function to set profile from auth session
const setProfileFromSession = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile) {
      setProfile(profile);
      setAuthUser(user);
    }
  }
};

  // Check if email is verified
  const checkEmailVerification = async (email: string): Promise<{ verified: boolean; error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email_verified')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Check verification error:', error);
        return { verified: false, error: error.message };
      }

      return { verified: data?.email_verified ?? false, error: null };
    } catch (error) {
      console.error('Check verification error:', error);
      return { verified: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email_verified')
        .eq('email', email)
        .maybeSingle();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.email_verified) {
        return { success: false, error: 'Email is already verified' };
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Update user with new verification code
      const { error: updateError } = await supabase
        .from('users')
        .update({
          verification_code: verificationCode,
          verification_expiry: expiry,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (updateError) {
        console.error('Update verification code error:', updateError);
        return { success: false, error: updateError.message };
      }

      // Send verification email
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationCode,
          fullName: user.full_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (authUser) await fetchProfile(authUser.id);
  };

  return (
    <AuthContext.Provider value={{
      authUser,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      checkEmailVerification,
      resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
