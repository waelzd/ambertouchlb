import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate fields
    const newErrors: FieldErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is mandatory';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Email is not valid';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is mandatory';
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    const { error: err, role } = await signIn(email, password);

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate(role === 'admin' ? '/admin' : '/account');
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

  return (
    <div className="min-h-screen pt-20 flex bg-neutral-950">
      
      {/* LEFT IMAGE */}
      <div className="hidden lg:block lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img
          src={storyImageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 text-white">
          <h2 className="font-serif text-4xl font-light text-gold-400">Welcome Back</h2>
          <p className="mt-2 text-white/60">Sign in to your account</p>
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <h1 className="text-2xl font-light mb-1 text-neutral-100">Sign In</h1>
          <p className="text-sm text-neutral-400 mb-8">
            Access your account and orders
          </p>

          {error && (
            <div className="mb-5 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <input
                type="email"
                value={email}
                onChange={e => handleFieldChange('email', e.target.value, setEmail)}
                placeholder="Email address"
                className={`w-full px-4 py-3 bg-neutral-800 border rounded-xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 focus:bg-neutral-800 outline-none transition-all text-sm text-neutral-200 placeholder-neutral-500 ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-neutral-700 hover:border-neutral-600'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => handleFieldChange('password', e.target.value, setPassword)}
                  placeholder="Password"
                  className={`w-full px-4 py-3 bg-neutral-800 border rounded-xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 focus:bg-neutral-800 outline-none transition-all text-sm text-neutral-200 placeholder-neutral-500 pr-10 ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-gold-400 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-neutral-400 hover:text-gold-400 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gold-400 text-neutral-900 rounded-xl font-medium transition-all duration-200 hover:bg-gold-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-400/10 hover:shadow-gold-400/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-neutral-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            New here?{' '}
            <Link to="/register" className="font-medium text-gold-400 hover:text-gold-300 transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}