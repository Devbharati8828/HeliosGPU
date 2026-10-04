import React, { useEffect, useRef } from 'react';
import { useHeliosStore } from '../store/useHeliosStore';
import { formatDegrees } from '../lib/utils';

export default function SunData() {
  const viewMode = useHeliosStore((state) => state.viewMode);
  const lat = useHeliosStore((state) => state.latitude);
  const lng = useHeliosStore((state) => state.longitude);
  const daylight = useHeliosStore((state) => state.daylightDuration);
  
  // Use ref for fast updates without React re-renders during scrubbing
  const altRef = useRef(null);
  const aziRef = useRef(null);

  useEffect(() => {
    // Subscribe to state changes manually for high-frequency updates
    const unsubscribe = useHeliosStore.subscribe(
      (state) => state.sunPosition,
      (sunPos) => {
        if (altRef.current) altRef.current.innerText = formatDegrees(sunPos?.altitude);
        if (aziRef.current) aziRef.current.innerText = formatDegrees(sunPos?.azimuth);
      },
      { fireImmediately: true }
    );
    return unsubscribe;
  }, []);

  // Hide in shadows mode — the Shadows panel shows its own data
  if (viewMode === 'shadows') return null;

  return (
    <>
      {/* Top Left: Location Data */}
      <div className="absolute top-24 left-6 z-20 pointer-events-none mix-blend-difference">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-3">
            <span className="helios-mono-readout opacity-60 w-8">LAT</span>
            <span className="font-mono text-xs">{Math.abs(lat).toFixed(2)}° {lat >= 0 ? 'N' : 'S'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="helios-mono-readout opacity-60 w-8">LNG</span>
            <span className="font-mono text-xs">{Math.abs(lng).toFixed(2)}° {lng >= 0 ? 'E' : 'W'}</span>
          </div>
        </div>
      </div>

      {/* Top Right: Solar Data */}
      <div className="absolute top-24 right-6 z-20 pointer-events-none mix-blend-difference text-right">
        <div className="flex flex-col space-y-1 items-end">
          <div className="flex items-center space-x-3">
            <span className="helios-mono-readout opacity-60 text-sun-glow">ALT</span>
            <span className="font-mono text-xs text-sun-glow" ref={altRef}>--°</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="helios-mono-readout opacity-60">AZI</span>
            <span className="font-mono text-xs" ref={aziRef}>--°</span>
          </div>
          <div className="flex items-center space-x-3 mt-1 pt-1 border-t border-line-subtle">
            <span className="helios-mono-readout opacity-60">DAY</span>
            <span className="font-mono text-xs">{daylight}</span>
          </div>
        </div>
      </div>
    </>
  );
}
