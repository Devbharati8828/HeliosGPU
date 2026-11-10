import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, AlertCircle, LogIn, UserPlus, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const INPUT_CLS =
  'w-full h-11 bg-helios-void/60 border border-line-subtle rounded-lg pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-line-active transition-colors leading-normal';

const BTN_CLS =
  'w-full h-11 rounded-lg text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 leading-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md';

function validate(tab, fields) {
  if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return 'Enter a valid email address';
  }
  if (!fields.password || fields.password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (fields.password.length > 72) {
    return 'Password must be at most 72 characters';
  }
  if (tab === 'register' && (!fields.name || fields.name.trim().length < 1)) {
    return 'Name is required';
  }
  return null;
}

export default function AuthModal({ onClose, initialTab = 'login' }) {
  const [tab, setTab]               = useState(initialTab);
  const [fields, setFields]         = useState({ email: '', password: '', name: '' });
  const [fieldError, setFieldError] = useState(null);

  const { login, register, status, errorMsg, clearError } = useAuthStore();
  const isLoading = status === 'loading';

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldError(null);
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErr = validate(tab, fields);
    if (valErr) { setFieldError(valErr); return; }

    try {
      if (tab === 'login') {
        await login(fields.email, fields.password);
      } else {
        await register(fields.email, fields.password, fields.name.trim());
      }
      onClose();
    } catch {
      // errorMsg is set in the store; displayed below
    }
  };

  const displayError = fieldError || errorMsg;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="relative w-full max-w-sm mx-4 bg-helios-surface border border-line-subtle rounded-2xl p-6 shadow-xl"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Brand */}
          <p className="font-serif text-lg tracking-widest text-text-primary text-center mb-5 uppercase">
            Helios
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 mb-5 rounded-full bg-helios-void/60 border border-line-subtle gap-1">
            <button
              key="login"
              type="button"
              onClick={() => { setTab('login'); setFieldError(null); clearError(); }}
              className={`h-9 px-3 text-xs font-semibold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none text-center ${
                tab === 'login'
                  ? 'bg-text-primary text-helios-void shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LogIn size={13} className="shrink-0" />
              <span className="leading-none select-none">Sign in</span>
            </button>

            <button
              key="register"
              type="button"
              onClick={() => { setTab('register'); setFieldError(null); clearError(); }}
              className={`h-9 px-3 text-xs font-semibold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer leading-none text-center ${
                tab === 'register'
                  ? 'bg-text-primary text-helios-void shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <UserPlus size={13} className="shrink-0" />
              <span className="leading-none select-none">Sign up</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <div className="relative flex items-center">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0" />
                <input
                  className={INPUT_CLS}
                  type="text"
                  name="name"
                  placeholder="Display name"
                  value={fields.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0" />
              <input
                className={INPUT_CLS}
                type="email"
                name="email"
                placeholder="Email address"
                value={fields.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none shrink-0" />
              <input
                className={INPUT_CLS}
                type="password"
                name="password"
                placeholder="Password (min 8 chars)"
                value={fields.password}
                onChange={handleChange}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {/* Error */}
            {displayError && (
              <div className="flex items-center gap-2 text-red-400 text-xs py-1">
                <AlertCircle size={12} className="shrink-0" />
                <span className="leading-tight">{displayError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${BTN_CLS} bg-text-primary text-helios-void hover:bg-text-primary/90 mt-2 cursor-pointer`}
            >
              {isLoading ? (
                <RefreshCw size={15} className="animate-spin shrink-0" />
              ) : tab === 'login' ? (
                <LogIn size={15} className="shrink-0" />
              ) : (
                <UserPlus size={15} className="shrink-0" />
              )}
              <span className="leading-none">{isLoading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Sign up'}</span>
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

