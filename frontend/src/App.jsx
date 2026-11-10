import React, { Suspense, useState, useEffect, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import SunData from './components/SunData';
import SolarTimeline from './components/SolarTimeline';
import LocationSearch from './components/LocationSearch';
import DateSelector from './components/DateSelector';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './components/LoginPage';
import ServerErrorScreen from './components/ServerErrorScreen';

// Renderers are lazy loaded — not imported until user is authenticated
const CesiumView = lazy(() => import('./globe/CesiumView'));
const HeliosScene = lazy(() => import('./scene/HeliosScene'));
const ShadowsView = lazy(() => import('./scene/ShadowsView'));

import { useHeliosStore } from './store/useHeliosStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const [gpuReady, setGpuReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState('Initializing solar engine…');

  const setGpuAvailable = useHeliosStore((s) => s.setGpuAvailable);
  const viewMode = useHeliosStore((s) => s.viewMode);

  // Auth state
  const { user, status: authStatus, loadMe } = useAuthStore();

  // Load auth session once on app start
  useEffect(() => { loadMe(); }, [loadMe]);

  // ── Boot sequence (GPU detection) ─────────────────────────────────────────
  // Only run after auth is confirmed so we don't boot Cesium/WebGPU for unauthed users
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    let isMounted = true;

    // Failsafe: always finish within 2.5 s
    const failsafeTimer = setTimeout(() => {
      if (isMounted) {
        setLoadProgress(100);
        setLoadMessage('Ready');
        setGpuReady(true);
      }
    }, 2500);

    const boot = async () => {
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
        setGpuReady(true);
      }
    };

    boot();
    return () => {
      isMounted = false;
      clearTimeout(failsafeTimer);
    };
  }, [authStatus, setGpuAvailable]);

  // ── Auth gate ─────────────────────────────────────────────────────────────

  // While checking auth session, show loading screen
  if (authStatus === 'idle' || authStatus === 'loading') {
    return <LoadingScreen progress={loadProgress} message="Connecting to Helios…" />;
  }

  // Backend unreachable
  if (authStatus === 'server_error') {
    return <ServerErrorScreen />;
  }

  // Not logged in — show full-screen login/register page only
  if (authStatus === 'unauthenticated' || !user) {
    return <LoginPage />;
  }

  // ── Authenticated — render the full app ───────────────────────────────────
  return (
    <div className="w-full h-full bg-helios-bg text-text-primary flex flex-col relative overflow-hidden font-sans">

      {/* ── Loading Screen (GPU boot after auth) ────────────────────────── */}
      <AnimatePresence>
        {!gpuReady && (
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
