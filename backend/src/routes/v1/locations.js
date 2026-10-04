const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationController');

// Define routes
router.get('/search', locationController.search);
// router.get('/reverse', locationController.reverseGeocode); // Optional implementation later
router.post('/', locationController.createLocation);
router.get('/', locationController.getLocations);
router.get('/:id', locationController.getLocationById);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
