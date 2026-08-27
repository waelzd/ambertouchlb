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

      // 2. Check if user already exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing user:', checkError);
      }

      // 3. If user doesn't exist, create profile in users table
      if (!existingUser) {
        // Prepare user data
        const userData = {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          avatar_url: '',
          has_used_signup_discount: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert into users table with explicit column names
        const { error: profileError } = await supabase
          .from('users')
          .insert(userData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // If there's a column error, try without the problematic columns
          if (profileError.message.includes('column')) {
            console.log('Trying to insert with minimal fields...');
            const minimalData = {
              id: authData.user.id,
              email: email,
              full_name: fullName,
              phone: phone,
              role: 'customer',
            };
            
            const { error: retryError } = await supabase
              .from('users')
              .insert(minimalData);
              
            if (retryError) {
              console.error('Retry failed:', retryError);
              // Don't throw here, we can still use the auth user
            } else {
              console.log('Profile created successfully with minimal fields');
            }
          } else {
            // Non-column error, still try to proceed with auth user
            console.warn('Profile creation failed, but auth user exists');
          }
        } else {
          console.log('Profile created successfully');
        }
      }

      // 4. Get the user profile (or create a local user object)
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      let userData: User;
      
      if (profileData && !profileError) {
        userData = profileData as User;
      } else {
        // Use auth user data as fallback
        userData = {
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: 'customer',
          avatar_url: '',
          has_used_signup_discount: false,
          created_at: new Date().toISOString(),
        };
      }

      // 5. Set user state
      setAuthUser(userData);
      setProfile(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('User signed up successfully:', userData);
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

      let userData: User;

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating...');
          
          const newUserData = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || '',
            phone: data.user.user_metadata?.phone || '',
            role: 'customer',
            has_used_signup_discount: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from('users')
            .insert(newUserData);

          if (insertError) {
            console.error('Failed to create profile:', insertError);
            // Use auth data as fallback
            userData = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || '',
              phone: data.user.user_metadata?.phone || '',
              role: 'customer',
              avatar_url: '',
              has_used_signup_discount: false,
              created_at: new Date().toISOString(),
            };
          } else {
            // Fetch the newly created profile
            const { data: freshProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            userData = freshProfile as User || newUserData;
          }
        } else {
          // Use auth data as fallback
          userData = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || '',
            phone: data.user.user_metadata?.phone || '',
            role: 'customer',
            avatar_url: '',
            has_used_signup_discount: false,
            created_at: new Date().toISOString(),
          };
        }
      } else {
        userData = profileData as User;
      }

      // Set user state
      setAuthUser(userData);
      setProfile(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('User signed in successfully:', userData);
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
      
      setAuthUser(data);
      setProfile(data);
      localStorage.setItem('user', JSON.stringify(data));
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
              
              const newUserData = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || '',
                phone: session.user.user_metadata?.phone || '',
                role: 'customer',
                has_used_signup_discount: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { error: insertError } = await supabase
                .from('users')
                .insert(newUserData);

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
                  setAuthUser(newProfile);
                  setProfile(newProfile);
                  localStorage.setItem('user', JSON.stringify(newProfile));
                }
              }
            }
          } else if (profileData) {
            setAuthUser(profileData);
            setProfile(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
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
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            setAuthUser(profileData);
            setProfile(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
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