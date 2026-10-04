const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const terrainController = require('../../controllers/terrainController');
const AppError = require('../../utils/AppError');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/dems/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for DEMs
  fileFilter: (req, file, cb) => {
    // Only accept .tif, .tiff, .dem
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.tif' && ext !== '.tiff' && ext !== '.dem') {
      return cb(new AppError('Only .tif, .tiff, or .dem files are allowed', 400, 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  }
});

// Define routes
router.get('/sources', terrainController.getSources);
router.post('/register', terrainController.registerTerrain);
router.post('/upload', upload.single('dem_file'), terrainController.uploadTerrain);
router.get('/:id', terrainController.getTerrainById);
router.get('/:id/metadata', terrainController.getTerrainById); // Alias for now
router.delete('/:id', terrainController.deleteTerrain);

module.exports = router;
