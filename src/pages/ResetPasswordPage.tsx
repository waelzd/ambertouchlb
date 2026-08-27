import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Key, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  });
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for session on mount and when URL changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        
        // First, try to get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log('Session found');
          setSessionReady(true);
          setCheckingSession(false);
          return;
        }

        // Check for access_token in URL hash (common for mobile)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('Access token found in hash');
          const hashParams = new URLSearchParams(hash.replace('#', ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            const { data: setData, error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (setData?.session) {
              console.log('Session set from hash token');
              setSessionReady(true);
              setCheckingSession(false);
              return;
            }
            if (setError) {
              console.error('Set session error:', setError);
            }
          }
        }

        // Check for code in URL (PKCE flow)
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        if (code) {
          console.log('Exchange code found');
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeData?.session) {
            console.log('Session set from code exchange');
            setSessionReady(true);
            setCheckingSession(false);
            return;
          }
          if (exchangeError) {
            console.error('Exchange error:', exchangeError);
          }
        }

        // Check for token in URL (from your custom email)
        const token = params.get('token');
        if (token) {
          console.log('Token found in URL');
          // Try to use the token to get a session
          const { data: recoveryData, error: recoveryError } = await supabase.auth.exchangeCodeForSession(token);
          if (recoveryData?.session) {
            console.log('Session set from recovery token');
            setSessionReady(true);
            setCheckingSession(false);
            return;
          }
          if (recoveryError) {
            console.error('Recovery error:', recoveryError);
          }
        }

        // If we're on mobile and no session, wait a moment and retry
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && retryCount < 3) {
          console.log(`Mobile device, retrying ${retryCount + 1}/3...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1500);
          return;
        }

        console.log('No session found');
        setSessionReady(false);
        setCheckingSession(false);
      } catch (error) {
        console.error('Session check error:', error);
        setSessionReady(false);
        setCheckingSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          console.log('Auth state: session found');
          setSessionReady(true);
          setCheckingSession(false);
        }
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('Auth state: signed out');
        setSessionReady(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [location.search, retryCount]);

  // Manual retry function
  const handleRetry = async () => {
    setCheckingSession(true);
    setError('');
    setRetryCount(0);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (data?.session) {
        setSessionReady(true);
        setCheckingSession(false);
        return;
      }

      // Try to recover from URL hash
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          const { data: setData } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (setData?.session) {
            setSessionReady(true);
            setCheckingSession(false);
            return;
          }
        }
      }
      
      // Try to recover from URL params
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { data: exchangeData } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeData?.session) {
          setSessionReady(true);
          setCheckingSession(false);
          return;
        }
      }
      
      setSessionReady(false);
      setCheckingSession(false);
    } catch (error) {
      console.error('Retry error:', error);
      setSessionReady(false);
      setCheckingSession(false);
    }
  };

  const validatePassword = (pass: string) => {
    const errors: string[] = [];
    if (pass.length < 6) errors.push('At least 6 characters');
    if (!/[A-Z]/.test(pass)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pass)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pass)) errors.push('One number');
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'password') {
      setPasswordErrors(validatePassword(password));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      setTouched(prev => ({ ...prev, password: true }));
      setError('Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTouched(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    setLoading(true);
    
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      
      if (err) {
        if (err.message.includes('session') || err.message.includes('token')) {
          // Session expired, try to refresh
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            setError('Your session has expired. Please request a new password reset link.');
            setLoading(false);
            return;
          }
          
          // Retry the update
          const { error: retryError } = await supabase.auth.updateUser({ password });
          if (retryError) {
            setError(retryError.message);
            setLoading(false);
            return;
          }
        } else {
          setError(err.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { state: { success: 'Password updated successfully! Please sign in with your new password.' } });
      }, 3000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const hasPasswordError = touched.password && passwordErrors.length > 0;
  const hasConfirmError = touched.confirmPassword && confirmPassword && password !== confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-gold-400 transition-colors duration-300 mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Sign In
        </Link>

        {checkingSession ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-800/50 rounded-full mb-4">
              <Key size={28} className="text-gold-400 animate-pulse" />
            </div>
            <p className="text-neutral-400">Verifying reset link...</p>
            <p className="text-xs text-neutral-500 mt-2">Attempt {retryCount + 1} of 3</p>
            {retryCount > 0 && (
              <div className="mt-4 w-full bg-neutral-800/50 rounded-full h-1 overflow-hidden">
                <motion.div 
                  className="h-full bg-gold-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(retryCount / 3) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ) : !sessionReady ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Link Expired or Invalid</h3>
            <p className="text-sm text-neutral-400 mb-2">
              The password reset link you used is no longer valid. This can happen if:
            </p>
            <ul className="text-xs text-neutral-500 text-left space-y-1 mb-6 pl-4 list-disc">
              <li>The link has already been used</li>
              <li>The link expired (usually after 24 hours)</li>
              <li>Your mobile browser handled the link differently</li>
            </ul>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-400 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 hover:scale-[1.02] w-full justify-center"
              >
                <Key size={18} />
                Try Again
              </button>
              <Link 
                to="/forgot-password" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 text-white rounded-xl font-medium hover:bg-white/5 transition-all duration-300 w-full justify-center"
              >
                Request New Link
              </Link>
              <p className="text-xs text-neutral-500 mt-4">
                💡 Tip: If you're on mobile, try copying the link and pasting it into your browser (Chrome, Safari, etc.) instead of opening it from your email app.
              </p>
            </div>
          </motion.div>
        ) : success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Password Updated!</h3>
            <p className="text-sm text-neutral-400 mb-2">
              Your password has been successfully changed.
            </p>
            <p className="text-xs text-neutral-500">
              Redirecting you to sign in...
            </p>
            <div className="mt-4 w-16 h-0.5 bg-gold-400/50 mx-auto" />
            <div className="mt-4 flex justify-center gap-1">
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full mb-4">
                <Shield size={14} className="text-gold-400" />
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Security</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
                Set New Password
              </h1>
              <p className="text-sm text-neutral-400">
                Choose a strong password for your account
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                💡 Tip: For the best experience on mobile, use your browser instead of the email app.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="password" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter new password"
                    className={`w-full pl-12 pr-12 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      hasPasswordError
                        ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                        : touched.password && password.length > 0 && passwordErrors.length === 0
                        ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                        : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <AnimatePresence>
                  {touched.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-1.5"
                    >
                      <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">
                        Password Requirements:
                      </p>
                      {[
                        { text: 'At least 6 characters', key: 'length' },
                        { text: 'One uppercase letter', key: 'uppercase' },
                        { text: 'One lowercase letter', key: 'lowercase' },
                        { text: 'One number', key: 'number' }
                      ].map((req, index) => {
                        const isMet = password.length > 0 && (
                          req.key === 'length' ? password.length >= 6 :
                          req.key === 'uppercase' ? /[A-Z]/.test(password) :
                          req.key === 'lowercase' ? /[a-z]/.test(password) :
                          /[0-9]/.test(password)
                        );
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              isMet ? 'bg-emerald-400' : 'bg-neutral-600'
                            }`} />
                            <span className={`text-xs transition-colors duration-300 ${
                              isMet ? 'text-emerald-400' : 'text-neutral-500'
                            }`}>
                              {req.text}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (touched.confirmPassword) {
                        // Trigger validation check
                      }
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Confirm new password"
                    className={`w-full pl-12 pr-12 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      hasConfirmError
                        ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                        : touched.confirmPassword && confirmPassword && password === confirmPassword
                        ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                        : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <AnimatePresence>
                  {hasConfirmError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1.5 mt-2 text-xs text-red-400"
                    >
                      <AlertCircle size={12} />
                      Passwords do not match
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 ${
                  loading
                    ? 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 hover:shadow-lg hover:shadow-gold-400/30 hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Update Password'
                )}
              </motion.button>

              {password.length > 0 && !loading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">
                      Password Strength
                    </span>
                    <span className={`text-xs font-medium ${
                      password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
                        ? 'text-emerald-400'
                        : password.length >= 6
                        ? 'text-yellow-400'
                        : 'text-neutral-500'
                    }`}>
                      {password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
                        ? 'Strong'
                        : password.length >= 6
                        ? 'Medium'
                        : 'Weak'}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-neutral-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(
                          (password.length / 6) * 25 + 
                          (/[A-Z]/.test(password) ? 25 : 0) + 
                          (/[a-z]/.test(password) ? 25 : 0) + 
                          (/[0-9]/.test(password) ? 25 : 0),
                          100
                        )}%`
                      }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
                          ? 'bg-emerald-400'
                          : password.length >= 6
                          ? 'bg-yellow-400'
                          : 'bg-neutral-500'
                      }`}
                    />
                  </div>
                </div>
              )}
            </form>
          </>
        )}

        {!success && sessionReady && (
          <div className="mt-8 pt-6 border-t border-neutral-800/50 text-center">
            <p className="text-sm text-neutral-500">
              Remember your password?{' '}
              <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}