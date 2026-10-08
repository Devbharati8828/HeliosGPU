import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: '/HeliosGPU/',
  plugins: [
    react({
      babel: {
        // Explicitly set targets to prevent browserslist from reading
        // an invalid BROWSERSLIST environment variable on this system.
        targets: 'last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions',
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'three', 'postprocessing'],
  },
  server: {
    port: 5173,
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          cesium: ['cesium'],
          'solar-vendor': ['suncalc', 'astronomy-engine'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['gsap', 'recharts', 'lucide-react', 'cmdk', 'zustand'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', 'suncalc', 'astronomy-engine'],
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
});
