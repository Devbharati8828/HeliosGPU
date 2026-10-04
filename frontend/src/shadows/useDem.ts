/**
 * useDem.ts — Main-thread hook that manages the DEM worker lifecycle.
 *
 * - Spawns the Web Worker once; reuses it across location changes.
 * - Cancels in-flight requests when lat/lng change or on unmount.
 * - Reports progress (tile fetch count) and final DemData.
 * - Falls back cleanly on errors so ShadowsView can show the upload UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEM_ZOOM, DEM_GRID_SIZE, type DemData } from './dem';

export type DemStatus =
  | { phase: 'idle' }
  | { phase: 'loading'; loaded: number; total: number }
  | { phase: 'ready'; dem: DemData; fromCache: boolean; elapsedMs: number }
  | { phase: 'error'; message: string };

/**
 * Returns the current DemStatus and a manual `reload` callback.
 * Automatically re-fetches whenever lat or lng change.
 */
export function useDem(lat: number, lng: number, enabled: boolean): DemStatus {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<DemStatus>({ phase: 'idle' });

  const startFetch = useCallback(() => {
    if (!enabled || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // Lazy-init worker
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./dem.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }

    const worker = workerRef.current;
    const id = ++requestIdRef.current;
    const startTime = performance.now();

    setStatus({ phase: 'loading', loaded: 0, total: DEM_GRID_SIZE / 256 * DEM_GRID_SIZE / 256 }); // 16

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.id !== id) return; // stale response — ignore

      if (msg.type === 'progress') {
        setStatus({ phase: 'loading', loaded: msg.loaded, total: msg.total });
      } else if (msg.type === 'result') {
        const elapsedMs = performance.now() - startTime;
        const dem: DemData = {
          data: new Float32Array(msg.buffer),
          width: msg.gridSize,
          height: msg.gridSize,
          gridScale: msg.gridScale,
          minHeight: msg.minHeight,
          maxHeight: msg.maxHeight,
          centerLat: msg.centerLat,
          centerLng: msg.centerLng,
        };
        setStatus({ phase: 'ready', dem, fromCache: elapsedMs < 300, elapsedMs });
      } else if (msg.type === 'error') {
        setStatus({ phase: 'error', message: msg.message });
      }
    };

    worker.onerror = (err) => {
      if (requestIdRef.current !== id) return;
      setStatus({ phase: 'error', message: err.message || 'DEM worker crashed.' });
    };

    worker.postMessage({
      type: 'fetch',
      lat,
      lng,
      zoom: DEM_ZOOM,
      gridSize: DEM_GRID_SIZE,
      id,
    });
  }, [lat, lng, enabled]);

  useEffect(() => {
    startFetch();
    return () => {
      // Invalidate old request by bumping id — worker result with old id will be ignored
      requestIdRef.current += 1;
      setStatus({ phase: 'idle' });
    };
  }, [startFetch]);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return status;
}
