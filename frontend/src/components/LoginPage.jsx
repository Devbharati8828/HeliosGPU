import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, LogIn, UserPlus, RefreshCw, Sun } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

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
        {/* Brand header with Sun symbol */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-9 h-9 rounded-full bg-sun-glow/10 border border-sun-glow/30 flex items-center justify-center mb-2 shadow-[0_0_12px_rgba(255,180,50,0.15)]">
            <Sun size={18} className="text-sun-glow shrink-0" />
          </div>
          <h1 className="font-serif text-2xl text-text-primary text-center uppercase tracking-[0.2em] pl-[0.2em] leading-none">
            Helios
          </h1>
          <p className="text-xs text-text-muted text-center tracking-wider mt-1.5 leading-none">
            Solar Intelligence Platform
          </p>
        </div>

        {/* Tabs: Sign in / Sign up with aligned text and icons */}
        <div className="grid grid-cols-2 p-1 mb-6 rounded-full bg-helios-void/60 border border-line-subtle gap-1">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`h-9 px-3 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer leading-none text-center select-none ${
              tab === 'login'
                ? 'bg-text-primary text-helios-void shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LogIn size={14} className="shrink-0" />
            <span className="leading-none select-none">Sign in</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`h-9 px-3 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer leading-none text-center select-none ${
              tab === 'register'
                ? 'bg-text-primary text-helios-void shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <UserPlus size={14} className="shrink-0" />
            <span className="leading-none select-none">Sign up</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <User size={18} />
              </span>
              <input
                className="auth-input-field"
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

          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={18} />
            </span>
            <input
              className="auth-input-field"
              type="email"
              name="email"
              placeholder="Email address"
              value={fields.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus={tab === 'login'}
            />
          </div>

          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              className="auth-input-field"
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
              <AlertCircle size={14} className="shrink-0" />
              <span className="leading-tight">{displayError}</span>
            </div>
          )}

          {/* Submit button with aligned symbol and text */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 leading-none bg-text-primary text-helios-void hover:bg-text-primary/90 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin shrink-0" />
            ) : tab === 'login' ? (
              <LogIn size={16} className="shrink-0" />
            ) : (
              <UserPlus size={16} className="shrink-0" />
            )}
            <span className="leading-none select-none">{isLoading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Sign up'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
