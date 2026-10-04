/**
 * dem.worker.ts — Runs in a dedicated Web Worker.
 *
 * Responsibilities:
 *   1. Receive a fetch request (lat, lng, zoom) from the main thread.
 *   2. Compute tile coordinates and fetch 4×4 AWS Terrarium PNGs.
 *   3. Stitch + decode into a Float32Array matching shadow.wgsl's input.
 *   4. Cache each raw tile PNG blob in OPFS keyed by z/x/y.
 *   5. Transfer the Float32Array (zero-copy) back to the main thread.
 *
 * Messages FROM main thread:
 *   { type: 'fetch', lat, lng, zoom, gridSize, signal? }
 *
 * Messages TO main thread:
 *   { type: 'progress', loaded, total }
 *   { type: 'result', buffer, gridSize, gridScale, minHeight, maxHeight, centerLat, centerLng }
 *   { type: 'error', message }
 */

const TERRARIUM_ROOT = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const TILE_SIZE = 256;

// ── Tile math ────────────────────────────────────────────────────────────────

function longitudeToTile(lng: number, z: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function latitudeToTile(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * 2 ** z);
}
function wrapX(x: number, z: number) {
  const n = 2 ** z;
  return ((x % n) + n) % n;
}

// ── OPFS helpers ─────────────────────────────────────────────────────────────

async function getOpfsDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle('helios-dem-cache', { create: true });
  } catch {
    return null; // OPFS not supported — graceful degradation
  }
}

async function readFromOpfs(dir: FileSystemDirectoryHandle, key: string): Promise<ArrayBuffer | null> {
  try {
    const fh = await dir.getFileHandle(key);
    const file = await fh.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

async function writeToOpfs(dir: FileSystemDirectoryHandle, key: string, data: ArrayBuffer): Promise<void> {
  try {
    const fh = await dir.getFileHandle(key, { create: true });
    const writable = await fh.createWritable();
    await writable.write(data);
    await writable.close();
  } catch {
    // Ignore OPFS write errors — fetching live is the fallback
  }
}

// ── Tile fetch with OPFS cache ────────────────────────────────────────────────

async function fetchTileBlob(
  z: number, x: number, y: number,
  opfsDir: FileSystemDirectoryHandle | null
): Promise<ArrayBuffer> {
  const key = `${z}_${x}_${y}.png`;
  if (opfsDir) {
    const cached = await readFromOpfs(opfsDir, key);
    if (cached) return cached;
  }
  const url = `${TERRARIUM_ROOT}/${z}/${x}/${y}.png`;
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Tile ${z}/${x}/${y} returned HTTP ${response.status}.`);
  const buffer = await response.arrayBuffer();
  if (opfsDir) writeToOpfs(opfsDir, key, buffer.slice(0)); // async, no await — fire-and-forget
  return buffer;
}


// ── Main message handler ──────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent) => {
  const { type, lat, lng, zoom, gridSize, id } = event.data;
  if (type !== 'fetch') return;

  const tileGrid = Math.round(gridSize / TILE_SIZE); // e.g. 4 for gridSize=1024
  const centerX = longitudeToTile(lng, zoom);
  const centerY = latitudeToTile(lat, zoom);
  const offsetX = centerX - Math.floor(tileGrid / 2);
  const offsetY = centerY - Math.floor(tileGrid / 2);
  const totalTiles = tileGrid * tileGrid;

  let opfsDir: FileSystemDirectoryHandle | null = null;
  try {
    opfsDir = await getOpfsDir();
  } catch { /* fallthrough */ }

  try {
    // Phase 1: fetch all tile buffers (with OPFS caching)
    let loaded = 0;
    const tileBuffers: { tileX: number; tileY: number; buffer: ArrayBuffer }[] = [];
    await Promise.all(
      Array.from({ length: totalTiles }, (_, i) => {
        const tileX = i % tileGrid;
        const tileY = Math.floor(i / tileGrid);
        const x = wrapX(offsetX + tileX, zoom);
        const y = offsetY + tileY;
        return fetchTileBlob(zoom, x, y, opfsDir).then((buffer) => {
          tileBuffers.push({ tileX, tileY, buffer });
          loaded += 1;
          self.postMessage({ type: 'progress', loaded, total: totalTiles, id });
        });
      })
    );

    // Phase 2: decode + stitch into one Float32Array
    const stitchedCanvas = new OffscreenCanvas(gridSize, gridSize);
    const stitchedCtx = stitchedCanvas.getContext('2d', { willReadFrequently: true });
    if (!stitchedCtx) throw new Error('Cannot create stitching canvas.');

    await Promise.all(tileBuffers.map(async ({ tileX, tileY, buffer }) => {
      const blob = new Blob([buffer], { type: 'image/png' });
      const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none' });
      stitchedCtx.drawImage(bitmap, tileX * TILE_SIZE, tileY * TILE_SIZE);
      bitmap.close();
    }));

    const pixels = stitchedCtx.getImageData(0, 0, gridSize, gridSize).data;
    const floats = new Float32Array(gridSize * gridSize);
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    for (let i = 0; i < floats.length; i++) {
      const p = i * 4;
      const h = (pixels[p] * 256 + pixels[p + 1] + pixels[p + 2] / 256) - 32768;
      floats[i] = h;
      if (h < minHeight) minHeight = h;
      if (h > maxHeight) maxHeight = h;
    }

    const gridScale = (156543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

    // Transfer the buffer zero-copy
    self.postMessage(
      { type: 'result', id, buffer: floats.buffer, gridSize, gridScale, minHeight, maxHeight, centerLat: lat, centerLng: lng },
      [floats.buffer]
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', id, message });
  }
};
