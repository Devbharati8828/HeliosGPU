'use strict';
const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController');
const requireAuth  = require('../../middleware/requireAuth');
const optionalAuth = require('../../middleware/optionalAuth');

// Define routes
router.get('/search', locationController.search);

// GET /mine — authenticated user's locations (must come before /:id)
router.get('/mine', requireAuth, locationController.getMyLocations);

// POST / — save a location; optionalAuth links it to the user if logged in
router.post('/', optionalAuth, locationController.createLocation);

router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);

// DELETE /:id — optionalAuth so we can scope by user_id appropriately
router.delete('/:id', optionalAuth, locationController.deleteLocation);

module.exports = router;
