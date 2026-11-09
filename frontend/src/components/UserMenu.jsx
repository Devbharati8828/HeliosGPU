import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import MyLocationsList from './MyLocationsList';

export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen]       = useState(false);
  const [showLocs, setShowLocs] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const displayName = user.name || user.email.split('@')[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-helios-void/80 backdrop-blur-md border border-line-subtle hover:border-line-active transition-colors group cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full bg-sun-glow/90 flex items-center justify-center text-[10px] font-bold text-helios-void select-none shrink-0 leading-none">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-medium tracking-wide max-w-[120px] truncate leading-none">{displayName}</span>
        <ChevronDown size={12} className={`text-text-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-helios-surface border border-line-subtle rounded-xl shadow-xl overflow-hidden z-50"
          >
            <button
              onClick={() => { setShowLocs(true); setOpen(false); }}
              className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-helios-void/40 transition-colors"
            >
              <MapPin size={14} />
              <span>My Locations</span>
            </button>
            <div className="border-t border-line-subtle" />
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-text-secondary hover:text-red-400 hover:bg-helios-void/40 transition-colors"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Locations panel */}
      {showLocs && <MyLocationsList onClose={() => setShowLocs(false)} />}
    </div>
  );
}

