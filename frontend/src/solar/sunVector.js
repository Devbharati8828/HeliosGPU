/**
 * Calculate Cartesian vector components for a given sun position.
 * @param {{ altitude: number, azimuth: number }} position in degrees
 * @returns {{ east: number, north: number, up: number }}
 */
export function sunVector({ altitude, azimuth }) {
  const a = altitude * Math.PI / 180, z = azimuth * Math.PI / 180;
  return { 
    east: Math.cos(a) * Math.sin(z),
    north: Math.cos(a) * Math.cos(z),
    up: Math.sin(a) 
  };
}
