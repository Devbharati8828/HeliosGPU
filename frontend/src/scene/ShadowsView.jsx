import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { useHeliosStore } from '../store/useHeliosStore';
import { getGpuDevice, ShadowGpuRenderer } from '../shadows/gpu';
import { useDem } from '../shadows/useDem';

const radians = (degrees) => (degrees * Math.PI) / 180;

function multiplyMatrices(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      result[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

function perspectiveMatrix(fovRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovRadians / 2);
  const range = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0]);
}

function lookAtMatrix(eye, target) {
  const forward = [eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]];
  const forwardLength = Math.hypot(...forward);
  forward.forEach((_, index) => { forward[index] /= forwardLength; });
  const right = [forward[2], 0, -forward[0]];
  const rightLength = Math.hypot(...right);
  right.forEach((_, index) => { right[index] /= rightLength; });
  const up = [right[1] * forward[2] - right[2] * forward[1], right[2] * forward[0] - right[0] * forward[2], right[0] * forward[1] - right[1] * forward[0]];
  return new Float32Array([
    right[0], up[0], forward[0], 0, right[1], up[1], forward[1], 0, right[2], up[2], forward[2], 0,
    -right[0] * eye[0] - right[1] * eye[1] - right[2] * eye[2],
    -up[0] * eye[0] - up[1] * eye[1] - up[2] * eye[2],
    -forward[0] * eye[0] - forward[1] * eye[1] - forward[2] * eye[2], 1,
  ]);
}

function getDayOfYear(value) {
  const date = new Date(value);
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
}

// ── Optional manual upload overlay ─────────────────────────────────────────
function ManualUploadFallback({ reason, onFile }) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = Array.from(files).find((f) => f.name.match(/\.(tif{1,2}|geotiff)$/i));
    if (file) onFile(file);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#050a12]/95 backdrop-blur">
      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
        <AlertTriangle size={32} className="text-amber-400" />
        <p className="text-sm font-medium text-text-primary">Auto-fetch failed</p>
        <p className="text-xs text-text-muted">{reason}</p>
      </div>
      <label
        className={`flex flex-col items-center gap-3 w-56 rounded border-2 border-dashed p-8 cursor-pointer transition-colors ${dragging ? 'border-sun-glow bg-sun-glow/10' : 'border-line-active hover:border-sun-glow/60'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={24} className="text-text-secondary" />
        <span className="text-xs text-center text-text-muted">
          Drop a <strong className="text-text-secondary">.tif / .tiff</strong> GeoTIFF<br />or click to browse
        </span>
        <input
          type="file"
          accept=".tif,.tiff"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      <p className="text-xs text-text-muted opacity-60">Max 50 MB · local files only</p>
    </div>
  );
}

// ── Loading indicator ───────────────────────────────────────────────────────
function LoadingOverlay({ loaded, total }) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#050a12]/80 backdrop-blur pointer-events-none">
      <Loader2 size={28} className="animate-spin text-sun-glow" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm text-text-primary">Loading elevation tiles…</p>
        <p className="text-xs text-text-muted">{loaded} / {total} tiles ({pct}%)</p>
      </div>
      <div className="w-40 h-1 rounded-full bg-line-subtle overflow-hidden">
        <div className="h-full bg-sun-glow transition-all duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ShadowsView() {
  const viewMode = useHeliosStore((state) => state.viewMode);
  const lat = useHeliosStore((state) => state.latitude);
  const lng = useHeliosStore((state) => state.longitude);
  const date = useHeliosStore((state) => state.date);
  const sunPosition = useHeliosStore((state) => state.sunPosition);
  const setDate = useHeliosStore((state) => state.setDate);

  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const recomputeRef = useRef(true);
  const [gpuRenderer, setGpuRenderer] = useState(null);
  const [gpuReady, setGpuReady] = useState(false);
  const [gpuError, setGpuError] = useState('');
  const [manualDem, setManualDem] = useState(null); // for optional .tif override
  const [camera, setCamera] = useState({ yaw: -0.75, pitch: 0.68, distance: 1.42 });

  // ── DEM worker ─────────────────────────────────────────────────────────────
  const demStatus = useDem(lat, lng, viewMode === 'shadows');

  // ── GPU init (once per canvas) ─────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== 'shadows' || !canvasRef.current || gpuRenderer) return;
    let active = true;
    (async () => {
      try {
        const device = await getGpuDevice();
        if (!device || !active) {
          if (!device) setGpuError('WebGPU is not available in this browser.');
          return;
        }
        const renderer = new ShadowGpuRenderer(device, canvasRef.current);
        setGpuRenderer(renderer);
        setGpuReady(true);
      } catch (err) {
        if (active) setGpuError(err.message || 'GPU initialization failed.');
      }
    })();
    return () => { active = false; };
  }, [viewMode, gpuRenderer]);

  // ── Feed DEM into GPU when worker delivers ─────────────────────────────────
  useEffect(() => {
    if (!gpuReady || !gpuRenderer) return;
    const dem = manualDem ?? (demStatus.phase === 'ready' ? demStatus.dem : null);
    if (!dem) return;
    gpuRenderer.setDem(dem);
    recomputeRef.current = true;
  }, [gpuReady, gpuRenderer, demStatus, manualDem]);

  // ── Sun direction (memoised) ────────────────────────────────────────────────
  const sunDirection = useMemo(() => {
    const altitude = radians(sunPosition.altitude);
    const azimuth = radians(sunPosition.azimuth);
    return [Math.cos(altitude) * Math.sin(azimuth), Math.sin(altitude), -Math.cos(altitude) * Math.cos(azimuth)];
  }, [sunPosition.altitude, sunPosition.azimuth]);

  useEffect(() => { recomputeRef.current = true; }, [sunDirection]);

  // ── Render loop ─────────────────────────────────────────────────────────────
  const activeDem = manualDem ?? (demStatus.phase === 'ready' ? demStatus.dem : null);

  useEffect(() => {
    if (!gpuRenderer || !activeDem) return;
    const extent = activeDem.gridScale * 1024;
    const horizontalDistance = extent * camera.distance;
    const eye = [
      Math.sin(camera.yaw) * Math.cos(camera.pitch) * horizontalDistance,
      Math.sin(camera.pitch) * horizontalDistance + extent * 0.08,
      Math.cos(camera.yaw) * Math.cos(camera.pitch) * horizontalDistance,
    ];
    const viewProjection = multiplyMatrices(
      perspectiveMatrix(radians(50), 1, extent * 0.015, extent * 8),
      lookAtMatrix(eye, [0, 0, 0])
    );
    gpuRenderer.render(sunDirection, viewProjection, recomputeRef.current);
    recomputeRef.current = false;
  }, [gpuRenderer, activeDem, camera, sunDirection]);

  // ── Manual .tif upload handler ─────────────────────────────────────────────
  const handleManualFile = async (file) => {
    // Attempt to parse using existing geotiff path if available; otherwise reject
    try {
      const geotiff = await import('geotiff');
      const buf = await file.arrayBuffer();
      const tiff = await geotiff.fromArrayBuffer(buf);
      const image = await tiff.getImage();
      const rasters = await image.readRasters({ interleave: false });
      const width = image.getWidth();
      const height = image.getHeight();
      const data = new Float32Array(width * height);
      const band = rasters[0];
      for (let i = 0; i < data.length; i++) data[i] = band[i];
      const bbox = image.getBoundingBox();
      const gridScale = ((bbox[2] - bbox[0]) / width + (bbox[3] - bbox[1]) / height) / 2 * 111320;
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < data.length; i++) { if (data[i] < min) min = data[i]; if (data[i] > max) max = data[i]; }
      setManualDem({ data, width, height, gridScale, minHeight: min, maxHeight: max, centerLat: lat, centerLng: lng });
    } catch {
      alert('Could not parse GeoTIFF. Make sure it is a valid elevation file.');
    }
  };

  // ── Day-of-year slider ─────────────────────────────────────────────────────
  const changeDay = (event) => {
    const target = new Date(date);
    target.setMonth(0, Number(event.target.value));
    setDate(target.toISOString());
  };

  // ── Pointer handlers (orbit camera) ────────────────────────────────────────
  const beginDrag = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event) => {
    if (!pointerRef.current) return;
    const dx = event.clientX - pointerRef.current.x;
    const dy = event.clientY - pointerRef.current.y;
    pointerRef.current = { x: event.clientX, y: event.clientY };
    setCamera((c) => ({ ...c, yaw: c.yaw - dx * 0.008, pitch: Math.min(1.34, Math.max(0.18, c.pitch - dy * 0.007)) }));
  };
  const zoom = (event) => {
    setCamera((c) => ({ ...c, distance: Math.min(2.6, Math.max(0.72, c.distance + event.deltaY * 0.001)) }));
  };

  if (viewMode !== 'shadows') return null;
  const day = getDayOfYear(date);

  // Status line shown in the panel
  let statusLine = 'Preparing…';
  let cacheLabel = null;
  if (gpuError) statusLine = gpuError;
  else if (demStatus.phase === 'loading') statusLine = `Fetching tiles (${demStatus.loaded}/${demStatus.total})`;
  else if (demStatus.phase === 'ready') {
    statusLine = `Terrain ready · ${demStatus.elapsedMs.toFixed(0)} ms`;
    cacheLabel = demStatus.fromCache ? '⚡ from cache' : '🌐 live fetch';
  }
  else if (demStatus.phase === 'error' && !manualDem) statusLine = demStatus.message;

  const showAutoFetchFailed = demStatus.phase === 'error' && !manualDem && !gpuError;
  const isLoading = demStatus.phase === 'loading';

  return (
    <section className="absolute inset-0 overflow-hidden bg-[#050a12]">
      {/* 3-D terrain canvas */}
      <canvas
        ref={canvasRef}
        width="1024"
        height="1024"
        className="h-full w-full touch-none cursor-grab active:cursor-grabbing object-contain"
        onPointerDown={beginDrag}
        onPointerMove={drag}
        onPointerUp={() => { pointerRef.current = null; }}
        onPointerCancel={() => { pointerRef.current = null; }}
        onWheel={zoom}
      />

      {/* Loading overlay — non-blocking, UI underneath stays interactive */}
      {isLoading && <LoadingOverlay loaded={demStatus.loaded} total={demStatus.total} />}

      {/* Auto-fetch failure → show manual upload fallback */}
      {showAutoFetchFailed && (
        <ManualUploadFallback reason={demStatus.message} onFile={handleManualFile} />
      )}

      {/* Info panel — sits below header, no SunData overlap in shadows mode */}
      <aside className="absolute right-5 top-20 w-64 border border-line-active bg-helios-bg/90 p-4 text-sm shadow-2xl backdrop-blur rounded-lg">
        {/* Panel header: title + coords + reset button */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-sun-glow font-semibold">Shadow Terrain</p>
            <p className="mt-1 text-xs text-text-muted font-mono">
              {Math.abs(lat).toFixed(2)}°{lat >= 0 ? 'N' : 'S'}&nbsp;&nbsp;{Math.abs(lng).toFixed(2)}°{lng >= 0 ? 'E' : 'W'}
            </p>
          </div>
          <button
            type="button"
            title="Reset terrain camera to default view"
            aria-label="Reset terrain camera"
            className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded border border-line-active bg-helios-surface hover:bg-line-subtle hover:border-sun-glow/50 hover:text-sun-glow text-text-secondary transition-colors text-xs"
            onClick={() => setCamera({ yaw: -0.75, pitch: 0.68, distance: 1.42 })}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        <p className={demStatus.phase === 'error' && !manualDem ? 'text-amber-400' : 'text-text-secondary'}>
          {statusLine}
        </p>
        {cacheLabel && <p className="mt-0.5 text-xs text-text-muted">{cacheLabel}</p>}
        {activeDem && <p className="mt-2 text-xs text-text-muted">{activeDem.gridScale.toFixed(1)} m per sample</p>}

        <label className="mt-5 block text-xs text-text-muted" htmlFor="shadow-day">
          Day of year {day}
        </label>
        <input
          id="shadow-day"
          className="mt-2 w-full accent-sun-glow"
          type="range"
          min="1"
          max="365"
          value={day}
          onChange={changeDay}
        />

        {/* Optional manual upload — always available as secondary action */}
        {demStatus.phase !== 'error' && (
          <details className="mt-5">
            <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary select-none">
              ▸ Override with .tif file
            </summary>
            <label className="mt-3 flex flex-col items-center gap-2 rounded border border-dashed border-line-active p-4 cursor-pointer hover:border-sun-glow/60 transition-colors">
              <Upload size={18} className="text-text-secondary" />
              <span className="text-xs text-text-muted text-center">Drop .tif / click to browse</span>
              <input
                type="file"
                accept=".tif,.tiff"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleManualFile(e.target.files[0])}
              />
            </label>
            {manualDem && (
              <button
                type="button"
                className="mt-2 w-full text-xs text-text-muted hover:text-sun-glow"
                onClick={() => setManualDem(null)}
              >
                ✕ Remove override, use auto-fetch
              </button>
            )}
          </details>
        )}
      </aside>
    </section>
  );
}
