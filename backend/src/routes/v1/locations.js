'use strict';
const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController');
const requireAuth = require('../../middleware/requireAuth');

// All location routes require authentication
router.use(requireAuth);

router.get('/search', locationController.search);
router.get('/mine', locationController.getMyLocations);
router.post('/', locationController.createLocation);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
