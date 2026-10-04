import { TILE_SIZE } from './TileFetcher.js';

/**
 * Decodes a Mapzen/Terrarium PNG blob to a Float32Array of elevation data.
 * @param {Blob} blob - The fetched PNG blob
 * @returns {Promise<Float32Array>} - Elevation data in meters (256x256)
 */
export async function decodeTerrariumBlob(blob) {
  // Use createImageBitmap to load the blob (works in Workers and Main Thread)
  const bitmap = await createImageBitmap(blob);
  
  // Use OffscreenCanvas to extract pixel data (works in Workers)
  const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');
  
  // Draw bitmap to canvas
  ctx.drawImage(bitmap, 0, 0);
  
  // Extract pixels (RGBA)
  const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
  const pixels = imageData.data;
  
  // Decode Terrarium format: (R * 256 + G + B / 256) - 32768
  const length = TILE_SIZE * TILE_SIZE;
  const elevations = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    
    const elevation = (r * 256 + g + b / 256) - 32768;
    elevations[i] = elevation;
  }
  
  return elevations;
}
