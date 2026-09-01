import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Clock, Mail } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export default function VerificationModal({
  isOpen,
  email,
  onVerify,
  onResend,
  onClose,
  loading = false,
}: VerificationModalProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '']);
      setError('');
      setTimeLeft(600);
      setCanResend(false);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newCode = [...code];
    for (let i = 0; i < Math.min(pasted.length, 4); i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pasted.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }
    setIsVerifying(true);
    try {
      await onVerify(fullCode);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsResending(true);
    try {
      await onResend();
      setTimeLeft(600);
      setCanResend(false);
      setError('');
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-400 hover:text-gold-400 transition-colors" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-400/20">
                  <Mail size={28} className="text-gold-400" />
                </div>
                <h2 className="text-2xl font-serif font-light text-white">Verify Your Email</h2>
                <p className="text-sm text-neutral-400 mt-2">
                  We've sent a 4-digit code to
                </p>
                <p className="text-sm text-gold-400 font-medium mt-1">{email}</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-3 mb-6">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={code[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`w-14 h-16 text-center text-2xl font-bold bg-neutral-800 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gold-400 ${
                        error
                          ? 'border-red-500 focus:ring-red-500/30 bg-red-500/5'
                          : code[index]
                          ? 'border-gold-400 focus:ring-gold-400/30'
                          : 'border-neutral-700 focus:border-gold-400 focus:ring-gold-400/30'
                      }`}
                      disabled={loading || isVerifying}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || isVerifying}
                  className="w-full py-3.5 bg-gradient-to-r from-gold-400 to-amber-500 text-neutral-900 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-gold-400/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Email'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 mb-2">
                  <Clock size={14} className="text-neutral-500" />
                  <span>Code expires in</span>
                  <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-red-400' : 'text-gold-400'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-sm text-gold-400 hover:text-gold-300 transition-colors font-medium"
                  >
                    {isResending ? 'Sending...' : 'Resend verification code'}
                  </button>
                ) : (
                  <p className="text-xs text-neutral-500">
                    Didn't receive the code? Wait for the timer to expire
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}