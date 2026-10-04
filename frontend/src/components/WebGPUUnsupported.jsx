import React from 'react';
import { motion } from 'framer-motion';

export default function WebGPUUnsupported() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 bg-helios-void/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
    >
      <div className="max-w-md bg-helios-surface border border-line-default p-8 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-medium text-text-primary mb-4">WebGPU Required</h2>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          Shadow analysis mode requires a browser with WebGPU support to compute high-performance solar raymarching on your local machine.
        </p>
        
        <div className="bg-helios-void/50 border border-line-subtle rounded-lg p-4 mb-6">
          <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">Supported Browsers</p>
          <ul className="text-sm text-text-secondary space-y-2 text-left list-disc list-inside">
            <li>Chrome / Edge (version 113+)</li>
            <li>Safari (version 18+)</li>
            <li>Firefox Nightly (with dom.webgpu.enabled)</li>
          </ul>
        </div>
        
        <p className="text-xs text-text-muted">
          You can still use Globe, Map, and Sky modes.
        </p>
      </div>
    </motion.div>
  );
}
