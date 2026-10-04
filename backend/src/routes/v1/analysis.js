const express = require('express');
const router = express.Router();
const analysisController = require('../../controllers/analysisController');

// Define routes
router.post('/', analysisController.createAnalysis);
router.get('/:id/status', analysisController.getAnalysisStatus);
router.post('/:id/result', analysisController.submitAnalysisResult);
router.get('/:id/result', analysisController.getAnalysisResult);

module.exports = router;
