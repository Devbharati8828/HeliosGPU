import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { useHeliosStore } from '../store/useHeliosStore';
import { formatTime, formatDegrees } from '../lib/utils';
import { useSpring, animated } from '@react-spring/web';

function timeOfDayToDate(baseDate, fraction) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMilliseconds(fraction * 86_400_000);
  return d;
}

export default function SolarTimeline() {
  const sunTimes    = useHeliosStore((s) => s.sunTimes);
  const arcPoints   = useHeliosStore((s) => s.solarArcPoints);
  const timeOfDay   = useHeliosStore((s) => s.timeOfDay);
  const setTimeOfDay = useHeliosStore((s) => s.setTimeOfDay);
  const baseDate    = useHeliosStore((s) => s.date);
  const timezone    = useHeliosStore((s) => s.timezone);
  
  const svgRef = useRef(null);

  // ── SVG altitude curve ─────────────────────────────────────────────────
  const { pathD, horizonY, toY } = useMemo(() => {
    if (!arcPoints?.length) return { pathD: '', horizonY: 50, toY: () => 50 };

    const W = 100;
    const H = 60;
    // Max above-horizon altitude in the arc (at least 5°)
    const maxAlt = Math.max(5, ...arcPoints.map((p) => p.altitude));
    // Map altitude → SVG Y (inverted: higher alt = lower Y number)
    const toYFunc = (alt) => H - ((alt + 10) / (maxAlt + 10)) * (H * 0.85);
    const toX = (i)   => (i / (arcPoints.length - 1)) * W;

    const hY = toYFunc(0); // horizon Y for the 0° altitude line

    const pts = arcPoints.map((p, i) => `${toX(i).toFixed(2)},${toYFunc(p.altitude).toFixed(2)}`);
    return { pathD: `M ${pts.join(' L ')}`, horizonY: hY, toY: toYFunc };
  }, [arcPoints]);

  // ── Marker positions ───────────────────────────────────────────────────
  const getTimePct = useCallback((time) => {
    if (!time || isNaN(new Date(time).getTime())) return null;
    const t = new Date(time);
    return ((t.getHours() * 3600 + t.getMinutes() * 60 + t.getSeconds()) / 86_400) * 100;
  }, []);

  const sunrisePct  = getTimePct(sunTimes?.sunrise);
  const sunsetPct   = getTimePct(sunTimes?.sunset);
  const solarNoonPct = getTimePct(sunTimes?.solarNoon);

  // ── Spring Animation ────────────────────────────────────────────────────
  const currentAlt = arcPoints.length
    ? arcPoints[Math.round(timeOfDay * (arcPoints.length - 1))]?.altitude ?? 0
    : 0;

  const currentY = toY(currentAlt);
  const currentX = timeOfDay * 100; // 0 to 100%

  const [{ x, y }, api] = useSpring(() => ({
    x: currentX,
    y: currentY,
    config: { tension: 300, friction: 20, clamp: true }
  }));

  useEffect(() => {
    api.start({ x: currentX, y: currentY });
  }, [currentX, currentY, api]);

  // ── Keyboard control ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const cur = useHeliosStore.getState().timeOfDay;
    const min1   = 1 / (24 * 60);      // 1 minute
    const min15  = 15 / (24 * 60);     // 15 minutes

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); setTimeOfDay(Math.min(1, cur + (e.shiftKey ? min15 : min1))); break;
      case 'ArrowLeft':  e.preventDefault(); setTimeOfDay(Math.max(0, cur - (e.shiftKey ? min15 : min1))); break;
      case 'Home':       e.preventDefault(); if (sunrisePct !== null) setTimeOfDay(sunrisePct / 100); break;
      case 'End':        e.preventDefault(); if (sunsetPct  !== null) setTimeOfDay(sunsetPct  / 100); break;
      default: break;
    }
  }, [setTimeOfDay, sunrisePct, sunsetPct]);

  // Current time display
  const currentTime = formatTime(timeOfDayToDate(baseDate, timeOfDay), timezone);

  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 flex flex-col items-center px-4 sm:px-12 pb-6 pt-12"
         style={{ background: 'linear-gradient(to top, rgba(7,7,13,0.95) 40%, rgba(7,7,13,0.6) 80%, transparent)' }}>

      <div className="relative w-full max-w-4xl h-16 sm:h-20 mb-4 select-none group">
        
        {/* SVG Curve layer */}
        <svg
          ref={svgRef}
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        >
          {/* Night shading left of sunrise */}
          {sunrisePct !== null && (
            <rect x="0" y="0" width={sunrisePct} height="60"
              fill="rgba(7,7,13,0.7)" />
          )}
          {/* Night shading right of sunset */}
          {sunsetPct !== null && (
            <rect x={sunsetPct} y="0" width={100 - sunsetPct} height="60"
              fill="rgba(7,7,13,0.7)" />
          )}

          {/* Horizon line */}
          <line x1="0" y1={horizonY} x2="100" y2={horizonY}
            stroke="var(--color-line-active)" strokeWidth="0.5" strokeDasharray="1,2" />

          {/* Altitude curve (dimmed) */}
          {pathD && (
            <path d={pathD} fill="none"
              stroke="var(--color-line-active)" strokeWidth="1.5"
              vectorEffect="non-scaling-stroke" />
          )}

          {/* Sunrise / Sunset / Noon markers */}
          {sunrisePct !== null && (
            <line x1={sunrisePct} y1={horizonY - 4} x2={sunrisePct} y2={horizonY + 4}
              stroke="var(--color-sun-dawn)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          )}
          {sunsetPct !== null && (
            <line x1={sunsetPct} y1={horizonY - 4} x2={sunsetPct} y2={horizonY + 4}
              stroke="var(--color-sun-horizon)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          )}
          {solarNoonPct !== null && (
            <line x1={solarNoonPct} y1={horizonY - 6} x2={solarNoonPct} y2={horizonY + 6}
              stroke="var(--color-sun-glow)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        
        {/* Fill Gradient (Under Curve) using Clip Path */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
             style={{ 
               background: 'linear-gradient(to top, transparent, var(--color-sun-core))',
               clipPath: `path('M 0,60 L 0,${toY(arcPoints[0]?.altitude ?? 0)} ${pathD.replace('M ', 'L ')} L 100,${toY(arcPoints[arcPoints.length-1]?.altitude ?? 0)} L 100,60 Z')`
             }}
        />

        {/* Physics Handle overlay */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <animated.div 
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ 
              left: x.to(val => `${val}%`),
            }}
          >
            {/* Vertical guide line */}
            <div className="absolute top-0 bottom-0 w-[1px] bg-sun-glow/30 left-1/2 -translate-x-1/2" />
            
            {/* The Sun Node */}
            <animated.div 
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sun-core shadow-[0_0_12px_rgba(253,184,19,0.8)] border-2 border-helios-void"
              style={{
                top: y.to(val => `${(val / 60) * 100}%`),
              }}
            />
            
            {/* Floating Tooltip */}
            <animated.div 
              className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{
                top: y.to(val => `calc(${(val / 60) * 100}% - 3rem)`),
              }}
            >
              <div className="bg-helios-surface/90 backdrop-blur border border-line-active rounded px-3 py-1.5 shadow-xl whitespace-nowrap flex items-center space-x-3">
                <span className="font-mono text-sm font-medium text-text-primary">{currentTime}</span>
                <div className="w-[1px] h-3 bg-line-active" />
                <span className="font-mono text-xs text-sun-glow">{formatDegrees(currentAlt)}</span>
              </div>
              <div className="w-[1px] h-4 bg-line-active mt-1" />
            </animated.div>
          </animated.div>
        </div>

        {/* Event time labels */}
        {sunrisePct !== null && (
          <span className="absolute font-mono text-[9px] text-sun-dawn opacity-80"
            style={{ left: `${sunrisePct}%`, bottom: '-1.5rem', transform: 'translateX(-50%)' }}>
            {formatTime(sunTimes.sunrise, timezone)}
          </span>
        )}
        {sunsetPct !== null && (
          <span className="absolute font-mono text-[9px] text-sun-horizon opacity-80"
            style={{ left: `${sunsetPct}%`, bottom: '-1.5rem', transform: 'translateX(-50%)' }}>
            {formatTime(sunTimes.sunset, timezone)}
          </span>
        )}
        {solarNoonPct !== null && (
          <span className="absolute font-mono text-[9px] text-sun-glow opacity-80"
            style={{ left: `${solarNoonPct}%`, top: '-1.5rem', transform: 'translateX(-50%)' }}>
            {formatTime(sunTimes.solarNoon, timezone)}
          </span>
        )}

        {/* Invisible native range input for interaction (handles touch/drag natively) */}
        <input
          type="range"
          min="0" max="1" step="0.0001"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 touch-none"
          aria-label="Time of day"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={timeOfDay}
          aria-valuetext={`${currentTime}, altitude ${formatDegrees(currentAlt)}`}
        />
      </div>

      {/* ── Keyboard hint ─────────────────────────────────────────────── */}
      <p className="font-mono text-[9px] tracking-[0.2em] text-text-muted mt-6 uppercase opacity-40">
        Drag to scrub · ←/→ ±1m · Shift ±15m · Home/End for Sunrise/set
      </p>
    </div>
  );
}
