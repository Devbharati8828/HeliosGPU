/**
 * demTileController.js
 *
 * Proxies AWS Terrarium elevation tiles so the frontend worker can fetch
 * them without hitting CORS restrictions.
 *
 * Route: GET /api/v1/dem/tile/:z/:x/:y.png   (requires auth)
 *
 * The controller:
 *  1. Validates z/x/y to prevent SSRF / path traversal.
 *  2. Fetches the PNG from S3 using Node's built-in fetch.
 *  3. Streams the bytes back with appropriate cache headers.
 */

const TERRARIUM_ROOT = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

const MAX_ZOOM = 15;

module.exports = {
  async proxyTile(req, res, next) {
    try {
      const z = parseInt(req.params.z, 10);
      const x = parseInt(req.params.x, 10);
      const y = parseInt(req.params.y, 10);

      // Basic sanity / SSRF guard
      if (
        !Number.isInteger(z) || z < 0 || z > MAX_ZOOM ||
        !Number.isInteger(x) || x < 0 || x >= 2 ** z ||
        !Number.isInteger(y) || y < 0 || y >= 2 ** z
      ) {
        return res.status(400).json({ error: 'Invalid tile coordinates.' });
      }

      const upstream = `${TERRARIUM_ROOT}/${z}/${x}/${y}.png`;
      const response = await fetch(upstream);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Upstream tile server returned ${response.status}.`,
        });
      }

      // Cache aggressively — terrain tiles are static
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  },
};

