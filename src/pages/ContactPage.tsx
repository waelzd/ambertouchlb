import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.length > 20) return 'Full name must be 20 characters or less';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Full name must contain only letters';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validateMessage = (message: string): string => {
    if (!message.trim()) return 'Message is required';
    if (message.length > 255) return 'Message must be 255 characters or less';
    return '';
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name': return validateName(value);
      case 'email': return validateEmail(value);
      case 'message': return validateMessage(value);
      case 'subject': return '';
      default: return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(e => ({ ...e, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(t => ({ ...t, [name]: true }));
    const error = validateField(name, value);
    setErrors(e => ({ ...e, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    const nameError = validateName(form.name);
    if (nameError) { newErrors.name = nameError; isValid = false; }

    const emailError = validateEmail(form.email);
    if (emailError) { newErrors.email = emailError; isValid = false; }

    const messageError = validateMessage(form.message);
    if (messageError) { newErrors.message = messageError; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    setTouched({ name: true, email: true, subject: true, message: true });
    
    if (!validateForm()) {
      return;
    }

    setSending(true);

    let supabaseSuccess = false;
    let emailSuccess = false;

    // Try to save to Supabase
    try {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([
          { 
            name: form.name.trim(), 
            email: form.email.trim(), 
            subject: form.subject.trim() || null, 
            message: form.message.trim() 
          },
        ]);

      if (!dbError) {
        supabaseSuccess = true;
      } else {
        console.error('Supabase Error:', dbError);
      }
    } catch (dbErr) {
      console.error('Supabase exception:', dbErr);
    }

    // Try to send email
    try {
      const res = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      if (res.ok) {
        emailSuccess = true;
      } else {
        const errorText = await res.text();
        console.error('Email send failed:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          setSubmitError(errorJson.error || 'Failed to send email notification.');
        } catch {
          setSubmitError('Failed to send email notification. Your message has been saved.');
        }
      }
    } catch (emailErr) {
      console.error('Email function error:', emailErr);
      setSubmitError('Could not connect to email service. Your message has been saved.');
    }

    setSending(false);

    if (supabaseSuccess || emailSuccess) {
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      setTouched({});
    } else {
      setSubmitError('Failed to send message. Please contact us directly via phone or email.');
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+961 70 702 697'],
      href: 'tel:+96170702697',
      color: 'text-gold-400',
      bg: 'bg-neutral-800',
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['ambertouch2026@gmail.com'],
      href: 'mailto:ambertouch2026@gmail.com',
      color: 'text-gold-400',
      bg: 'bg-neutral-800',
    },
  ];

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-3 bg-neutral-800 border rounded-xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 focus:bg-neutral-800 outline-none transition-all text-sm text-neutral-200 placeholder-neutral-500";
    const errorClasses = errors[fieldName] && touched[fieldName] 
      ? "border-red-500 bg-red-900/20 focus:ring-red-500/20 focus:border-red-500" 
      : "border-neutral-700 hover:border-neutral-600";
    return `${baseClasses} ${errorClasses}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <span className="inline-block text-gold-400 text-sm font-medium tracking-[0.3em] uppercase mb-4 border border-gold-400/30 px-6 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm">
            Get in Touch
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-neutral-100 mb-4">
            Let's Connect
          </h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Have a question about our fragrances or need assistance with your order? 
            We're here to help. Reach out to us and we'll respond within 24 hours.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 md:p-8 shadow-xl">
              <h2 className="font-serif text-2xl font-light text-neutral-100 mb-6">
                Contact Information
              </h2>
              <p className="text-neutral-400 text-sm mb-8">
                Reach out to us through any of the following channels. We're always happy to assist you.
              </p>
              
              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <motion.a
                    key={item.title}
                    href={item.href}
                    target={item.icon === Mail ? '_blank' : undefined}
                    rel={item.icon === Mail ? 'noopener noreferrer' : undefined}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-800/50 transition-colors group cursor-pointer no-underline border border-transparent hover:border-neutral-700"
                  >
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-neutral-700`}>
                      <item.icon size={20} className={item.color} />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-200 text-sm">{item.title}</p>
                      {item.details.map((detail, i) => (
                        <p key={i} className="text-neutral-400 text-sm mt-0.5 hover:text-gold-400 transition-colors">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <p className="text-sm text-neutral-400 mb-4">Follow us on social media</p>
                <div className="flex gap-3">
                  <a 
                    href="https://www.instagram.com/ambertouchlb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-gold-400 transition-all border border-neutral-700 hover:border-gold-400/30"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.facebook.com/ambertouchlb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-gold-400 transition-all border border-neutral-700 hover:border-gold-400/30"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 md:p-8 shadow-xl">
              <h2 className="font-serif text-2xl font-light text-neutral-100 mb-2">
                Send Us a Message
              </h2>
              <p className="text-neutral-400 text-sm mb-6">
                Fill in the form below and we'll get back to you as soon as possible.
              </p>

              {submitError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Error</p>
                    <p className="text-sm text-red-300">{submitError}</p>
                  </div>
                </motion.div>
              )}

              {sent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-green-900/20 border border-green-500/30 rounded-xl text-center"
                >
                  <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h3 className="font-serif text-xl font-light text-green-400 mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-green-300 text-sm">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setForm({ name: '', email: '', subject: '', message: '' });
                      setErrors({});
                      setTouched({});
                    }}
                    className="mt-6 text-sm text-gold-400 hover:text-gold-300 font-medium transition-colors"
                  >
                    Send another message →
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="text"
                        name="name"
                        value={form.name} 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Fullname" 
                        maxLength={20}
                        className={getInputClasses('name')}
                        required 
                      />
                      {errors.name && touched.name && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input 
                        type="email" 
                        name="email"
                        value={form.email} 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="email@example.com" 
                        className={getInputClasses('email')}
                        required 
                      />
                      {errors.email && touched.email && (
                        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                      Subject <span className="text-neutral-500 text-xs">(Optional)</span>
                    </label>
                    <input 
                      type="text"
                      name="subject"
                      value={form.subject} 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="How can we help you?" 
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 focus:bg-neutral-800 outline-none transition-all text-sm text-neutral-200 placeholder-neutral-500 hover:border-neutral-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                      Message <span className="text-red-400">*</span>
                      <span className="text-neutral-500 text-xs ml-2">({form.message.length}/255)</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Tell us about your inquiry..."
                      rows={5}
                      maxLength={255}
                      className={getInputClasses('message')}
                      required
                    />
                    {errors.message && touched.message && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={sending} 
                    className="w-full py-3.5 bg-gold-400 text-neutral-900 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm hover:bg-gold-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-400/10 hover:shadow-gold-400/20"
                  >
                    {sending ? (
                      <>
                        <Send size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-xs text-neutral-500 mt-4">
                    By submitting this form, you agree to our privacy policy. We'll never share your information.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}