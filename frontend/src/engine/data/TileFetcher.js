// Constants for Terrarium Tiles (256x256)
export const TILE_SIZE = 256;

/**
 * Converts latitude, longitude and zoom to tile coordinates.
 */
export function latLngToTile(lat, lng, zoom) {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y, z: zoom };
}

import { getCachedTile, cacheTile } from './OPFSCache.js';

/**
 * Fetches a Terrarium PNG tile from AWS S3 as a Blob, with OPFS caching.
 */
export async function fetchTerrariumTile(x, y, z) {
  // Check OPFS cache first
  const cachedBlob = await getCachedTile(x, y, z);
  if (cachedBlob) {
    return cachedBlob;
  }

  // Fallback to network fetch
  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
  const response = await fetch(url, { mode: 'cors' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tile: ${url}`);
  }
  
  const blob = await response.blob();
  
  // Save to cache asynchronously
  cacheTile(x, y, z, blob).catch(err => console.error('Cache save failed', err));
  
  return blob;
}
