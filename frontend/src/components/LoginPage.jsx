import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const INPUT_CLS =
  'w-full bg-helios-void/60 border border-line-subtle rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-line-active transition-colors leading-normal';

const BTN_CLS =
  'w-full py-2.5 rounded-lg text-sm font-medium tracking-wide transition-colors flex items-center justify-center leading-none disabled:opacity-50 disabled:cursor-not-allowed';

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

export default function LoginPage() {
  const [tab, setTab]               = useState('login');
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
      // On success, App.jsx re-renders with the app
    } catch {
      // errorMsg is set in the store; displayed below
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setFieldError(null);
    clearError();
  };

  const displayError = fieldError || errorMsg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-helios-bg">
      {/* Subtle radial glow behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,200,80,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-sm mx-4 bg-helios-surface border border-line-subtle rounded-2xl p-8 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
      >
        {/* Brand */}
        <p className="font-serif text-2xl tracking-[0.2em] text-text-primary text-center mb-1 uppercase">
          Helios
        </p>
        <p className="text-xs text-text-muted text-center mb-7 tracking-wider">
          Solar Intelligence Platform
        </p>

        {/* Tabs */}
        <div className="flex p-1 mb-6 rounded-full bg-helios-void/60 border border-line-subtle">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                tab === t
                  ? 'bg-text-primary text-helios-void'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div className="relative flex items-center">
              <User size={15} className="absolute left-3.5 text-text-muted pointer-events-none shrink-0" />
              <input
                className={INPUT_CLS}
                type="text"
                name="name"
                placeholder="Display name"
                value={fields.name}
                onChange={handleChange}
                autoComplete="name"
                autoFocus
              />
            </div>
          )}

          <div className="relative flex items-center">
            <Mail size={15} className="absolute left-3.5 text-text-muted pointer-events-none shrink-0" />
            <input
              className={INPUT_CLS}
              type="email"
              name="email"
              placeholder="Email address"
              value={fields.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus={tab === 'login'}
            />
          </div>

          <div className="relative flex items-center">
            <Lock size={15} className="absolute left-3.5 text-text-muted pointer-events-none shrink-0" />
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
              <span>{displayError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`${BTN_CLS} bg-text-primary text-helios-void hover:bg-text-primary/90 mt-2 cursor-pointer`}
          >
            {isLoading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

