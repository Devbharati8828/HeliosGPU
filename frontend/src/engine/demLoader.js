import { fromArrayBuffer } from 'geotiff';

export const DEMLoader = {
  async parseGeoTIFF(arrayBuffer) {
    try {
      const tiff = await fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      const width = image.getWidth();
      const height = image.getHeight();
      
      const heightmap = rasters[0]; // First band contains elevation data
      return { heightmap, width, height };
    } catch (error) {
      console.error("Failed to parse GeoTIFF:", error);
      throw error;
    }
  },

  // Fallback procedural terrain generator for MVP demo
  generateProceduralTerrain(size = 128, maxHeight = 15, _seed = 1) {
    const heightmap = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Procedural sine waves to simulate terrain
        const u = (x / size) - 0.5;
        const v = (y / size) - 0.5;
        let h = Math.sin(u * 10) * Math.cos(v * 10) + 0.5 * Math.sin(u * 20) * Math.cos(v * 20);
        h /= 1.5; // Normalize roughly to -1 to 1
        const normalized = (h + 1) / 2; // 0 to 1
        heightmap[y * size + x] = normalized * maxHeight;
      }
    }
    return { heightmap, width: size, height: size };
  }
};
