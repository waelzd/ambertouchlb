import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Please enter your email address';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) {
      const validationError = validateEmail(value);
      setEmailError(validationError);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateEmail(email);
    setEmailError(validationError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate email before submission
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      setTouched(true);
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://ambertouchlb.vercel.app/reset-password',
    });
    
    if (err) { 
      setError(err.message); 
      setLoading(false); 
    } else { 
      setSent(true); 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-gold-400 transition-colors duration-300 mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Sign In
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full mb-4">
            <Mail size={14} className="text-gold-400" />
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Password Recovery</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Check Your Email</h3>
              <p className="text-sm text-neutral-400">
                We've sent a password reset link to <span className="text-gold-400">{email}</span>
              </p>
              <p className="text-xs text-neutral-500 mt-4">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                  setTouched(false);
                  setEmailError('');
                }}
                className="mt-6 text-sm text-gold-400 hover:text-gold-300 transition-colors"
              >
                Try with another email
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Error message from Supabase */}
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
                {/* Email input */}
                <div>
                  <label htmlFor="email" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleBlur}
                      placeholder="you@example.com"
                      className={`w-full pl-12 pr-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        emailError && touched
                          ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                          : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                      }`}
                      required
                    />
                  </div>
                  
                  {/* Email validation error */}
                  <AnimatePresence>
                    {emailError && touched && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 mt-2 text-xs text-red-400"
                      >
                        <AlertCircle size={12} />
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={loading || (touched && !!emailError)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 ${
                    loading || (touched && !!emailError)
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
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>

                {/* Info text */}
                <p className="text-center text-xs text-neutral-500">
                  We'll send you a secure link to reset your password.
                  <br />
                  The link will expire in 24 hours.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-800/50 text-center">
          <p className="text-sm text-neutral-500">
            Remember your password?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}