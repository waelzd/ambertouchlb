import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldErrors {
  email?: string;
  password?: string;
}

//const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Professional email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const getEmailError = (email: string): string | undefined => {
    if (!email.trim()) return 'Email address is required';
    if (!validateEmail(email)) return 'Please enter a valid email address (e.g., name@domain.com)';
    return undefined;
  };

  const getPasswordError = (pass: string): string | undefined => {
    if (!pass.trim()) return 'Password is required';
    if (pass.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      const emailError = getEmailError(email);
      setFieldErrors(prev => ({ ...prev, email: emailError }));
    }
    
    if (field === 'password') {
      const passwordError = getPasswordError(password);
      setFieldErrors(prev => ({ ...prev, password: passwordError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const newErrors: FieldErrors = {};
    
    const emailError = getEmailError(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = getPasswordError(password);
    if (passwordError) newErrors.password = passwordError;

    setFieldErrors(newErrors);
    setTouched(prev => ({ ...prev, email: true, password: true }));

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    const { error: err } = await signIn(email, password);

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/admin');
  };

  // Clear a field's error as soon as the user starts typing in it
  const handleFieldChange = (
    field: keyof FieldErrors,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Supabase storage URL
  const SUPABASE_URL = 'https://zzhwmxgjuesecmjoigfs.supabase.co/storage/v1/object/public';
  const BUCKET_NAME = 'images';
  const FOLDER_NAME = 'ambertouch';
  const storyImageUrl = `${SUPABASE_URL}/${BUCKET_NAME}/${FOLDER_NAME}/LoginImg.png`;

  const isEmailValid = touched.email && email.trim() && validateEmail(email);
  const isEmailInvalid = touched.email && email.trim() && !validateEmail(email);
  const isPasswordValid = touched.password && password.trim() && password.length >= 6;
  const isPasswordInvalid = touched.password && password.trim() && password.length < 6;

  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* LEFT IMAGE */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img
          src={storyImageUrl}
          alt="Luxury perfume collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-1/2 -translate-y-1/2 left-12 text-white">
          <h2 className="font-serif text-4xl font-light text-gold-400">Welcome Back</h2>
          <p className="mt-2 text-white/60">Sign in to your account</p>
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="font-serif text-xl tracking-widest uppercase block mb-10 text-gold-400 hover:text-gold-300 transition-colors">
            Amber Touch
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-400/10 border border-gold-400/20 rounded-full mb-4">
              <Shield size={14} className="text-gold-400" />
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Welcome Back</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
              Sign In
            </h1>
            <p className="text-sm text-neutral-400">
              Access your account and orders
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

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => handleFieldChange('email', e.target.value, setEmail)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${
                    fieldErrors.email || isEmailInvalid
                      ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                      : isEmailValid
                      ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                      : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                  }`}
                />
                {touched.email && email.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isEmailInvalid ? (
                      <svg className="w-4.5 h-4.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : null}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    {fieldErrors.email}
                  </motion.p>
                )}
                {!fieldErrors.email && touched.email && email.trim() && isEmailValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Valid email address
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => handleFieldChange('password', e.target.value, setPassword)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${
                    fieldErrors.password || isPasswordInvalid
                      ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                      : isPasswordValid
                      ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                      : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-gold-400 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    {fieldErrors.password}
                  </motion.p>
                )}
                {!fieldErrors.password && touched.password && password.trim() && isPasswordValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Valid password
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-neutral-400 hover:text-gold-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-neutral-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-xs text-neutral-500 text-center leading-relaxed">
            By signing in you agree to our{' '}
            <a href="/terms-of-service" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Terms
            </a>
            {' '}and{' '}
            <a href="/privacy-policy" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}