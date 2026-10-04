const express = require('express');
const router = express.Router();
const earthController = require('../../controllers/earthController');

// Define routes
router.get('/imagery', earthController.getImageryLayers);
router.get('/layers', earthController.getImageryLayers);

module.exports = router;
