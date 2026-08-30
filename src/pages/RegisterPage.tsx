import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Shield, Phone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm?: string;
  verificationCode?: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [emailTouched, setEmailTouched] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirm: false,
    fullName: false,
    email: false,
    phone: false
  });
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state?.success;

  // Verification popup states
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [tempUserData, setTempUserData] = useState<{
    email: string;
    fullName: string;
    password: string;
    phone: string;
  } | null>(null);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Professional email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  // Validate name: only letters and spaces, max 20 characters
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full Name is required';
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return 'Name can only contain letters and spaces';
    if (name.trim().length > 20) return 'Name must be 20 characters or less';
    return undefined;
  };

  // Validate phone: exactly 8 digits
  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^[0-9]{8}$/.test(phone.trim())) return 'Phone must be exactly 8 digits';
    return undefined;
  };

  const getEmailError = (email: string): string | undefined => {
    if (!email.trim()) return 'Email address is required';
    if (!validateEmail(email)) return 'Please enter a valid email address (e.g., name@domain.com)';
    return undefined;
  };

  // Password validation
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
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setFieldErrors(prev => ({ ...prev, password: errors.join(', ') }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: undefined }));
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPhone(value);
    if (touched.phone) {
      const phoneError = validatePhone(value);
      setFieldErrors(prev => ({ ...prev, phone: phoneError }));
    }
  };

  const handleBlur = (field: 'password' | 'confirm' | 'fullName' | 'email' | 'phone') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'password') {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setFieldErrors(prev => ({ ...prev, password: errors.join(', ') }));
      } else {
        setFieldErrors(prev => ({ ...prev, password: undefined }));
      }
    }
    
    if (field === 'fullName') {
      const nameError = validateName(fullName);
      setFieldErrors(prev => ({ ...prev, fullName: nameError }));
    }
    
    if (field === 'email') {
      setEmailTouched(true);
      const emailError = getEmailError(email);
      setFieldErrors(prev => ({ ...prev, email: emailError }));
    }
    
    if (field === 'phone') {
      const phoneError = validatePhone(phone);
      setFieldErrors(prev => ({ ...prev, phone: phoneError }));
    }
    
    if (field === 'confirm') {
      if (confirm && password && confirm !== password) {
        setFieldErrors(prev => ({ ...prev, confirm: 'Passwords do not match' }));
      } else {
        setFieldErrors(prev => ({ ...prev, confirm: undefined }));
      }
    }
  };

  // Send verification code to email
  const sendVerificationCode = async (email: string, fullName: string) => {
    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fullName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };

  // Verify the code (check against stored code)
  const verifyCode = async (email: string, code: string) => {
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      return data;
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const newErrors: FieldErrors = {};
    const nameError = validateName(fullName);
    if (nameError) newErrors.fullName = nameError;
    
    const emailError = getEmailError(email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors.join(', ');
    }
    
    if (!confirm.trim()) {
      newErrors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      newErrors.confirm = 'Passwords do not match';
    }

    setFieldErrors(newErrors);
    setTouched(prev => ({ 
      ...prev, 
      fullName: true, 
      email: true, 
      phone: true,
      password: true, 
      confirm: true 
    }));
    setEmailTouched(true);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      // Store user data temporarily
      setTempUserData({
        email,
        fullName,
        password,
        phone
      });

      // Send verification code
      await sendVerificationCode(email, fullName);
      
      // Show verification popup
      setShowVerificationPopup(true);
      setResendTimer(60); // 60 seconds cooldown
      setLoading(false);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      setFieldErrors(prev => ({ ...prev, verificationCode: 'Please enter a 4-digit code' }));
      return;
    }

    setVerificationLoading(true);
    setVerificationError('');

    try {
      // Verify the code
      await verifyCode(tempUserData!.email, verificationCode);
      
      setVerificationSuccess(true);
      
      // Now create the user account
      const { error, role } = await signUp(
        tempUserData!.email, 
        tempUserData!.password, 
        tempUserData!.fullName, 
        tempUserData!.phone
      );

      if (error) {
        setVerificationError(error);
        setVerificationLoading(false);
        return;
      }

      setVerificationLoading(false);
      
      // Close popup and navigate after successful verification
      setTimeout(() => {
        setShowVerificationPopup(false);
        navigate(role === 'admin' ? '/admin' : '/account');
      }, 1000);
      
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.');
      setVerificationLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setResendTimer(60);
    try {
      await sendVerificationCode(tempUserData!.email, tempUserData!.fullName);
      setVerificationError('');
    } catch (error) {
      console.error('Failed to resend code:', error);
      setVerificationError('Failed to resend code. Please try again.');
    }
  };

  // Close verification popup
  const handleClosePopup = () => {
    if (!verificationSuccess) {
      setShowVerificationPopup(false);
      setTempUserData(null);
      setVerificationCode('');
      setVerificationError('');
    }
  };

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

  const isEmailValid = emailTouched && email.trim() && validateEmail(email);
  const isEmailInvalid = emailTouched && email.trim() && !validateEmail(email);
  const isPhoneValid = touched.phone && phone.trim() && /^[0-9]{8}$/.test(phone);
  const isPhoneInvalid = touched.phone && phone.trim() && !/^[0-9]{8}$/.test(phone);
  const passwordErrors = touched.password ? validatePassword(password) : [];
  const hasPasswordError = touched.password && passwordErrors.length > 0;
  const hasConfirmError = touched.confirm && confirm && password !== confirm;

  // Password strength calculation
  const getPasswordStrength = () => {
    const checks = [
      password.length >= 6,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password)
    ];
    const score = checks.filter(Boolean).length;
    return score;
  };

  const getStrengthText = () => {
    const score = getPasswordStrength();
    if (score === 4) return { text: 'Strong', color: 'text-emerald-400' };
    if (score >= 2) return { text: 'Medium', color: 'text-yellow-400' };
    if (password.length > 0) return { text: 'Weak', color: 'text-neutral-500' };
    return { text: '', color: '' };
  };

  const getStrengthColor = () => {
    const score = getPasswordStrength();
    if (score === 4) return 'bg-emerald-400';
    if (score >= 2) return 'bg-yellow-400';
    if (password.length > 0) return 'bg-neutral-500';
    return 'bg-neutral-700/50';
  };

  // Supabase storage URL
  const SUPABASE_URL = 'https://zzhwmxgjuesecmjoigfs.supabase.co/storage/v1/object/public';
  const BUCKET_NAME = 'images';
  const FOLDER_NAME = 'ambertouch';
  const storyImageUrl = `${SUPABASE_URL}/${BUCKET_NAME}/${FOLDER_NAME}/RegisterImage.png`;

  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* Verification Popup */}
      <AnimatePresence>
        {showVerificationPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleClosePopup}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gold-400" />
              
              <button
                onClick={handleClosePopup}
                disabled={verificationSuccess}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>

              <div className="text-center mt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-full mb-4 border border-gold-400/20">
                  <Shield size={32} className="text-gold-400" />
                </div>
                
                <h3 className="text-2xl font-serif font-light text-white mb-2">
                  Verify Your Email
                </h3>
                
                <p className="text-sm text-neutral-400 mb-6">
                  We sent a 4-digit verification code to
                </p>
                <p className="text-sm text-gold-400 font-medium mb-6">
                  {tempUserData?.email}
                </p>

                <AnimatePresence>
                  {verificationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-left"
                    >
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{verificationError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {verificationSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 flex items-center gap-2"
                  >
                    <CheckCircle size={16} className="shrink-0" />
                    <span>Email verified successfully!</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setVerificationCode(value);
                        if (fieldErrors.verificationCode) {
                          setFieldErrors(prev => ({ ...prev, verificationCode: undefined }));
                        }
                        if (verificationError) {
                          setVerificationError('');
                        }
                      }}
                      placeholder="Enter 4-digit code"
                      maxLength={4}
                      disabled={verificationSuccess}
                      className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 transition-all duration-300 ${
                        verificationError || fieldErrors.verificationCode
                          ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                          : verificationSuccess
                          ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                          : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                      }`}
                    />
                    <AnimatePresence>
                      {(verificationError || fieldErrors.verificationCode) && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                        >
                          <AlertCircle size={12} />
                          {verificationError || fieldErrors.verificationCode}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    onClick={handleVerifyCode}
                    disabled={verificationLoading || verificationSuccess}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-neutral-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : verificationSuccess ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Verified!
                      </span>
                    ) : (
                      'Verify Email'
                    )}
                  </motion.button>

                  <div className="text-center">
                    <button
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || verificationSuccess}
                      className={`text-sm transition-colors ${
                        resendTimer > 0 || verificationSuccess
                          ? 'text-neutral-500 cursor-not-allowed'
                          : 'text-gold-400 hover:text-gold-300'
                      }`}
                    >
                      {resendTimer > 0
                        ? `Resend code in ${resendTimer}s`
                        : verificationSuccess
                        ? 'Email verified'
                        : 'Resend verification code'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Registration Form */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img
          src={storyImageUrl}
          alt="Luxury perfume collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

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
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-gold-400">Join Us</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
              Create Account
            </h1>
            <p className="text-sm text-neutral-400">
              Join our community of discerning customers
            </p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400"
            >
              {success}
            </motion.div>
          )}

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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={e => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  handleFieldChange('fullName', value, setFullName);
                }}
                onBlur={() => handleBlur('fullName')}
                placeholder="Enter your full name"
                maxLength={20}
                className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  fieldErrors.fullName 
                    ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5' 
                    : touched.fullName && fullName && !fieldErrors.fullName
                    ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                    : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                }`}
              />
              <AnimatePresence>
                {fieldErrors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    {fieldErrors.fullName}
                  </motion.p>
                )}
                {!fieldErrors.fullName && touched.fullName && fullName && (
                  <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle size={12} />
                    {fullName.trim().length}/20 characters
                  </p>
                )}
              </AnimatePresence>
            </div>

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
                {emailTouched && email.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle size={18} className="text-emerald-400" />
                    ) : isEmailInvalid ? (
                      <XCircle size={18} className="text-red-400" />
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
                {!fieldErrors.email && emailTouched && email.trim() && isEmailValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle size={12} />
                    Valid email address
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur('phone')}
                  placeholder="Enter 8-digit phone number"
                  maxLength={8}
                  inputMode="numeric"
                  className={`w-full pl-12 pr-12 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    fieldErrors.phone || isPhoneInvalid
                      ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                      : isPhoneValid
                      ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                      : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                  }`}
                />
                {touched.phone && phone.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isPhoneValid ? (
                      <CheckCircle size={18} className="text-emerald-400" />
                    ) : isPhoneInvalid ? (
                      <XCircle size={18} className="text-red-400" />
                    ) : null}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {fieldErrors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    {fieldErrors.phone}
                  </motion.p>
                )}
                {!fieldErrors.phone && touched.phone && phone.trim() && isPhoneValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle size={12} />
                    Valid phone number
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
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${
                    hasPasswordError
                      ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                      : touched.password && password && !hasPasswordError
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

              {/* Password requirements */}
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

              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-500">
                      Password Strength
                    </span>
                    <span className={`text-xs font-medium ${getStrengthText().color}`}>
                      {getStrengthText().text}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-neutral-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(getPasswordStrength() / 4) * 100}%`
                      }}
                      className={`h-full rounded-full transition-all duration-500 ${getStrengthColor()}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => {
                    setConfirm(e.target.value);
                    if (touched.confirm) {
                      if (e.target.value && password !== e.target.value) {
                        setFieldErrors(prev => ({ ...prev, confirm: 'Passwords do not match' }));
                      } else {
                        setFieldErrors(prev => ({ ...prev, confirm: undefined }));
                      }
                    }
                  }}
                  onBlur={() => handleBlur('confirm')}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3.5 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${
                    hasConfirmError
                      ? 'border-red-500/50 focus:ring-red-500/30 bg-red-500/5'
                      : touched.confirm && confirm && password === confirm
                      ? 'border-emerald-500/50 focus:ring-emerald-500/30 bg-emerald-500/5'
                      : 'border-neutral-700/50 focus:border-gold-400 focus:ring-gold-400/30 hover:border-neutral-600'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPass(!showConfirmPass)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-gold-400 transition-colors"
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
                    className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                  >
                    <AlertCircle size={12} />
                    Passwords do not match
                  </motion.p>
                )}
                {!hasConfirmError && touched.confirm && confirm && password === confirm && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle size={12} />
                    Passwords match
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit button */}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-xs text-neutral-500 text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <a href="/terms-of-service" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Terms
            </a>
            {' '}and{' '}
            <a href="/privacy-policy" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Privacy Policy
            </a>
          </p>
          
          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}