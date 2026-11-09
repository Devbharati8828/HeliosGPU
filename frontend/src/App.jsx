import React, { Suspense, useState, useEffect, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import SunData from './components/SunData';
import SolarTimeline from './components/SolarTimeline';
import LocationSearch from './components/LocationSearch';
import DateSelector from './components/DateSelector';
import LoadingScreen from './components/LoadingScreen';

// Renderers are lazy loaded
const CesiumView = lazy(() => import('./globe/CesiumView'));
const HeliosScene = lazy(() => import('./scene/HeliosScene'));
const ShadowsView = lazy(() => import('./scene/ShadowsView')); // To be created

import { useHeliosStore } from './store/useHeliosStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const [appReady, setAppReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState('Initializing solar engine…');

  const setGpuAvailable = useHeliosStore((s) => s.setGpuAvailable);
  const viewMode = useHeliosStore((s) => s.viewMode);

  // Load auth session once on app start (silently — won't block boot)
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => { loadMe(); }, [loadMe]);

  // ── Boot sequence ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    
    // Failsafe timeout: ensure appReady is ALWAYS set even if network stalls
    const failsafeTimer = setTimeout(() => {
      if (isMounted) {
        setLoadProgress(100);
        setLoadMessage('Ready');
        setAppReady(true);
      }
    }, 2500);

    const boot = async () => {
      // Step 1: Detect GPU capabilities
      if (isMounted) {
        setLoadMessage('Detecting GPU capabilities…');
        setLoadProgress(30);
      }
      
      let hasWebGPU = false;
      try {
        if ('gpu' in navigator && typeof navigator.gpu.requestAdapter === 'function') {
          const adapter = await navigator.gpu.requestAdapter().catch(() => null);
          if (adapter) hasWebGPU = true;
        }
      } catch (err) {
        console.warn('WebGPU check failed:', err);
      }
      
      if (isMounted) setGpuAvailable(hasWebGPU);

      // Step 2: Calibrate and Prepare
      if (isMounted) {
        setLoadMessage('Calibrating solar algorithms…');
        setLoadProgress(70);
      }
      await new Promise((r) => setTimeout(r, 150));

      if (isMounted) {
        setLoadMessage('Ready');
        setLoadProgress(100);
      }
      await new Promise((r) => setTimeout(r, 150));
      
      if (isMounted) {
        clearTimeout(failsafeTimer);
        setAppReady(true);
      }
    };

    boot();
    return () => {
      isMounted = false;
      clearTimeout(failsafeTimer);
    };
  }, [setGpuAvailable]);

  return (
    <div className="w-full h-full bg-helios-bg text-text-primary flex flex-col relative overflow-hidden font-sans">

      {/* ── Loading Screen ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!appReady && (
          <LoadingScreen progress={loadProgress} message={loadMessage} />
        )}
      </AnimatePresence>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <Header />

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <LocationSearch />
      <DateSelector />

      {/* ── Viewport: stacked renderers, viewMode controls visibility ─── */}
      <main className="flex-1 relative z-0">
        <Suspense fallback={null}>
          {(viewMode === 'globe' || viewMode === 'map3d') && <CesiumView />}
          {viewMode === 'sky' && <HeliosScene />}
          {viewMode === 'shadows' && <ShadowsView />}
        </Suspense>

        {/* ── Floating UI ─────────────────────────────────────────────── */}
        <SunData />
        <SolarTimeline />
      </main>
    </div>
  );
}

export default App;
