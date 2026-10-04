export const DEM_ZOOM = 12;
export const DEM_GRID_SIZE = 1024;
const TILE_SIZE = 256;
const TILE_GRID_SIZE = 4;
const TERRARIUM_ROOT = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

export type DemData = {
  data: Float32Array;
  width: number;
  height: number;
  gridScale: number;
  minHeight: number;
  maxHeight: number;
  centerLat: number;
  centerLng: number;
};

function longitudeToTile(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * 2 ** zoom);
}

function latitudeToTile(latitude: number, zoom: number) {
  const latitudeRadians = (latitude * Math.PI) / 180;
  return Math.floor(((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * 2 ** zoom);
}

function wrapTileX(x: number, zoom: number) {
  const tileCount = 2 ** zoom;
  return ((x % tileCount) + tileCount) % tileCount;
}

async function loadTile(url: string) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Elevation tile request failed (${response.status}).`);
  return createImageBitmap(await response.blob(), { colorSpaceConversion: 'none' });
}

/** Loads a 4x4 AWS Terrarium neighborhood as the 1024 sample compute grid. */
export async function fetchDEM(lat = 30.1, lng = 78.29, signal?: AbortSignal): Promise<DemData> {
  if (!Number.isFinite(lat) || lat <= -85 || lat >= 85 || !Number.isFinite(lng)) {
    throw new Error('Choose a latitude between -85 and 85 degrees.');
  }
  if (signal?.aborted) throw new DOMException('DEM request cancelled.', 'AbortError');
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    throw new Error('This browser cannot decode elevation tiles for the shadows view.');
  }

  const centerX = longitudeToTile(lng, DEM_ZOOM);
  const centerY = latitudeToTile(lat, DEM_ZOOM);
  const canvas = new OffscreenCanvas(DEM_GRID_SIZE, DEM_GRID_SIZE);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Unable to create the elevation decoder.');

  const tileRequests: Promise<void>[] = [];
  for (let tileY = 0; tileY < TILE_GRID_SIZE; tileY += 1) {
    for (let tileX = 0; tileX < TILE_GRID_SIZE; tileX += 1) {
      const x = wrapTileX(centerX - 1 + tileX, DEM_ZOOM);
      const y = centerY - 1 + tileY;
      const url = `${TERRARIUM_ROOT}/${DEM_ZOOM}/${x}/${y}.png`;
      tileRequests.push(loadTile(url).then((bitmap) => {
        if (signal?.aborted) {
          bitmap.close();
          throw new DOMException('DEM request cancelled.', 'AbortError');
        }
        context.drawImage(bitmap, tileX * TILE_SIZE, tileY * TILE_SIZE);
        bitmap.close();
      }));
    }
  }
  await Promise.all(tileRequests);
  if (signal?.aborted) throw new DOMException('DEM request cancelled.', 'AbortError');

  // The 4x4 stitched source is already the requested 1024x1024 crop.
  const pixels = context.getImageData(0, 0, DEM_GRID_SIZE, DEM_GRID_SIZE).data;
  const data = new Float32Array(DEM_GRID_SIZE * DEM_GRID_SIZE);
  let minHeight = Number.POSITIVE_INFINITY;
  let maxHeight = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < data.length; index += 1) {
    const pixel = index * 4;
    const height = (pixels[pixel] * 256 + pixels[pixel + 1] + pixels[pixel + 2] / 256) - 32768;
    data[index] = height;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
  }

  return {
    data,
    width: DEM_GRID_SIZE,
    height: DEM_GRID_SIZE,
    gridScale: 156543.03 * Math.cos((lat * Math.PI) / 180) / 2 ** DEM_ZOOM,
    minHeight,
    maxHeight,
    centerLat: lat,
    centerLng: lng,
  };
}
