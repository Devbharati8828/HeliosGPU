import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ progress = 0, message = 'Initializing...' }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-helios-void"
    >
      {/* Wordmark */}
      <h1 className="font-serif text-3xl tracking-[0.3em] text-text-primary mb-12 uppercase" style={{ letterSpacing: '0.3em' }}>
        Helios
      </h1>

      {/* Progress bar */}
      <div className="w-64 h-[1px] bg-line-subtle relative overflow-hidden mb-6">
        <motion.div
          className="absolute inset-y-0 left-0 bg-sun-glow"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Status message */}
      <p className="font-mono text-[9px] tracking-[0.2em] text-text-secondary uppercase">
        {message}
      </p>
    </motion.div>
  );
}
