/**
 * dem.js — DEM tile proxy route
 *
 * GET /api/v1/dem/tile/:z/:x/:y.png
 *
 * Requires auth so only logged-in users can fetch elevation tiles.
 * The tile coordinates are validated in the controller.
 */

const express = require('express');
const router = express.Router();
const demTileController = require('../../controllers/demTileController');

router.get('/tile/:z/:x/:y.png', demTileController.proxyTile);

module.exports = router;

