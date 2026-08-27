// pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, CheckCircle, Eye, EyeOff, Phone } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Validation functions
  const validateFullName = (value: string) => {
    if (!value.trim()) return 'Full name is required';
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Only letters and spaces allowed';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^[0-9]{8}$/.test(value.trim())) return 'Phone must be exactly 8 digits';
    return '';
  };

  const validatePassword = (value: string) => {
    const errors: string[] = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('One number');
    return errors;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  };

  // Get field errors
  const getFullNameError = () => {
    if (!touched.fullName) return '';
    return validateFullName(fullName);
  };

  const getEmailError = () => {
    if (!touched.email) return '';
    return validateEmail(email);
  };

  const getPhoneError = () => {
    if (!touched.phone) return '';
    return validatePhone(phone);
  };

  const getConfirmPasswordError = () => {
    if (!touched.confirmPassword) return '';
    return validateConfirmPassword(confirmPassword);
  };

  // Check if fields are valid
  const isFullNameValid = touched.fullName && fullName && !getFullNameError();
  const isEmailValid = touched.email && email && !getEmailError();
  const isPhoneValid = touched.phone && phone && !getPhoneError();
  const isPasswordValid = touched.password && password && passwordErrors.length === 0;
  const isConfirmPasswordValid = touched.confirmPassword && confirmPassword && !getConfirmPasswordError();

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordErrorList = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword);

    if (nameError) {
      setError(nameError);
      return;
    }

    if (emailError) {
      setError(emailError);
      return;
    }

    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (passwordErrorList.length > 0) {
      setPasswordErrors(passwordErrorList);
      setError('Please meet all password requirements');
      return;
    }

    if (confirmError) {
      setError(confirmError);
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName, phone);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Password requirements list
  const passwordRequirements = [
    { text: 'At least 8 characters', key: 'length' },
    { text: 'One uppercase letter', key: 'uppercase' },
    { text: 'One lowercase letter', key: 'lowercase' },
    { text: 'One number', key: 'number' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4 pt-28 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-light text-white">Create Account</h1>
          <p className="text-neutral-400 mt-2">Join AmberTouch and get 10% off your first order</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (touched.fullName) setError('');
                }}
                onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                required
                className={`w-full pl-11 pr-12 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  getFullNameError()
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                    : isFullNameValid
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
                placeholder="Enter your full name"
              />
              {touched.fullName && fullName && !getFullNameError() && (
                <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {getFullNameError() && (
                <AlertCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>
            <AnimatePresence>
              {getFullNameError() && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {getFullNameError()}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) setError('');
                }}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                required
                className={`w-full pl-11 pr-12 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  getEmailError()
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                    : isEmailValid
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
                placeholder="Enter your email"
              />
              {touched.email && email && !getEmailError() && (
                <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {getEmailError() && (
                <AlertCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>
            <AnimatePresence>
              {getEmailError() && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {getEmailError()}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                required
                className={`w-full pl-11 pr-12 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  getPhoneError()
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                    : isPhoneValid
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
                placeholder="Enter 8-digit phone number"
                maxLength={8}
                inputMode="numeric"
              />
              {touched.phone && phone && !getPhoneError() && (
                <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {getPhoneError() && (
                <AlertCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>
            <AnimatePresence>
              {getPhoneError() && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {getPhoneError()}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, password: true }));
                  if (password) {
                    setPasswordErrors(validatePassword(password));
                  }
                }}
                required
                className={`w-full pl-11 pr-12 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  touched.password && passwordErrors.length > 0
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                    : isPasswordValid
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {touched.password && password && passwordErrors.length === 0 && (
                <CheckCircle size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {touched.password && passwordErrors.length > 0 && (
                <AlertCircle size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>

            {/* Password requirements */}
            <AnimatePresence>
              {touched.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1.5"
                >
                  <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">
                    Password Requirements:
                  </p>
                  {passwordRequirements.map((req, index) => {
                    const isMet = password.length > 0 && (
                      req.key === 'length' ? password.length >= 8 :
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1.5">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (touched.confirmPassword) setError('');
                }}
                onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                required
                className={`w-full pl-11 pr-12 py-3 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  getConfirmPasswordError()
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                    : isConfirmPasswordValid
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {touched.confirmPassword && confirmPassword && !getConfirmPasswordError() && (
                <CheckCircle size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-emerald-400" />
              )}
              {getConfirmPasswordError() && (
                <AlertCircle size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-red-400" />
              )}
            </div>
            <AnimatePresence>
              {getConfirmPasswordError() && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  {getConfirmPasswordError()}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium hover:shadow-lg hover:shadow-gold-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}