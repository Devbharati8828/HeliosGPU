const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/', locationController.getLocations);
router.get('/search', locationController.search);
router.post('/', locationController.createLocation);
router.get('/:id', locationController.getLocationById);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;
