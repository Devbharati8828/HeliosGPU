const express = require('express');
const router = express.Router();
const solarController = require('../../controllers/solarController');

// Define routes
router.get('/day', solarController.getSolarDay);
// router.get('/position', ...); // Can map to a subset later
// router.get('/events', ...);

module.exports = router;
