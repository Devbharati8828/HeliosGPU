import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function ServerErrorScreen() {
  const loadMe = useAuthStore((s) => s.loadMe);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-helios-bg">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,80,80,0.04) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative text-center max-w-xs mx-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <WifiOff size={40} className="text-text-muted mx-auto mb-5" />

        <p className="font-serif text-xl tracking-widest text-text-primary uppercase mb-2">
          Helios
        </p>
        <p className="text-sm text-text-secondary mb-1">Server unavailable</p>
        <p className="text-xs text-text-muted mb-8">
          Could not connect to the backend. Check that the server is running and try again.
        </p>

        <button
          onClick={loadMe}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-text-primary/10 hover:bg-text-primary/20 border border-text-primary/30 hover:border-text-primary/60 text-sm font-medium text-text-primary transition-colors cursor-pointer leading-none"
        >
          <RefreshCw size={14} className="shrink-0" />
          <span className="leading-none select-none">Retry</span>
        </button>
      </motion.div>
    </div>
  );
}

