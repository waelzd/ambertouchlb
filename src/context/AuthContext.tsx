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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user - no user returned');
      }

      console.log('Auth user created:', authData.user.id);

      // 2. Insert into your users table using the auth user's ID
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          has_used_signup_discount: false,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If there's an error, try to clean up the auth user
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        throw new Error('Failed to create user profile: ' + profileError.message);
      }

      console.log('Profile created successfully');

      // 3. Get the complete user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        // Use the data we have as fallback with all required fields
        const userFallback: User = {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          has_used_signup_discount: false,
          avatar_url: null,
          created_at: new Date().toISOString(),
        };
        setAuthUser(userFallback);
        setProfile(userFallback);
        localStorage.setItem('user', JSON.stringify(userFallback));
      } else {
        // Remove password from user object before storing in state
        const { password, ...userWithoutPassword } = userData;
        setAuthUser(userWithoutPassword as User);
        setProfile(userWithoutPassword as User);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      if (!data.user) throw new Error('No user found');

      console.log('User signed in:', data.user.id);

      // Get user profile from your users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating...');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || '',
              phone: data.user.user_metadata?.phone || '',
              role: 'customer',
              has_used_signup_discount: false,
            });

          if (insertError) {
            console.error('Failed to create profile:', insertError);
            throw new Error('Failed to create user profile');
          }
        } else {
          throw profileError;
        }
      }

      // Get fresh profile
      const { data: freshProfile, error: freshError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (freshError) throw freshError;

      const { password: _password, ...userWithoutPassword } = freshProfile;
      setAuthUser(userWithoutPassword as User);
      setProfile(userWithoutPassword as User);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthUser(null);
      setProfile(null);
      localStorage.removeItem('user');
    }
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
      
      const { password, ...userWithoutPassword } = data;
      setAuthUser(userWithoutPassword as User);
      setProfile(userWithoutPassword as User);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Session found:', session.user.id);
          
          // Get user profile from your users table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            
            // If profile doesn't exist, create it
            if (profileError.code === 'PGRST116') {
              console.log('Creating profile for existing session...');
              
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || '',
                  phone: session.user.user_metadata?.phone || '',
                  role: 'customer',
                  has_used_signup_discount: false,
                });

              if (insertError) {
                console.error('Failed to create profile:', insertError);
              } else {
                // Fetch the newly created profile
                const { data: newProfile } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (newProfile) {
                  const { password, ...userWithoutPassword } = newProfile;
                  setAuthUser(userWithoutPassword as User);
                  setProfile(userWithoutPassword as User);
                  localStorage.setItem('user', JSON.stringify(userWithoutPassword));
                }
              }
            }
          } else if (profileData) {
            const { password, ...userWithoutPassword } = profileData;
            setAuthUser(userWithoutPassword as User);
            setProfile(userWithoutPassword as User);
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));
          }
        } else {
          // Check localStorage for user data
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
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          // Refresh profile on auth change
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData && !profileError) {
            const { password, ...userWithoutPassword } = profileData;
            setAuthUser(userWithoutPassword as User);
            setProfile(userWithoutPassword as User);
            localStorage.setItem('user', JSON.stringify(userWithoutPassword));
          }
        } else {
          setAuthUser(null);
          setProfile(null);
          localStorage.removeItem('user');
        }
      }
    );

    return () => subscription.unsubscribe();
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