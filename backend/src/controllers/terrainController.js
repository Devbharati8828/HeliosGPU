const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/AppError');
const fs = require('fs');
const path = require('path');

/**
 * Get available predefined terrain sources.
 */
exports.getSources = (req, res) => {
  const sources = [
    { id: 'usgs-3dep', name: 'USGS 3DEP (US Only)', type: 'public' },
    { id: 'aws-terrarium', name: 'AWS Terrarium (Global)', type: 'public' },
    { id: 'srtm-gl3', name: 'SRTM GL3 90m (Global)', type: 'public' }
  ];
  res.json(successResponse(sources));
};

/**
 * Upload a local GeoTIFF / DEM file.
 * Expects multer to have processed `req.file`.
 */
exports.uploadTerrain = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400, 'MISSING_FILE');
    }

    const { name, min_lat, max_lat, min_lon, max_lon, resolution } = req.body;
    
    if (!name) {
      // Clean up uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      throw new AppError('Terrain name is required', 400, 'VALIDATION_ERROR');
    }

    const id = uuidv4();
    // Path relative to backend root, or just the URL path
    const filePath = `/uploads/dems/${req.file.filename}`;
    
    await pool.query(
      `INSERT INTO terrain_datasets (
        id, name, source, format, min_lat, max_lat, min_lon, max_lon, resolution, file_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, 'local-upload', 'GeoTIFF', 
        min_lat || null, max_lat || null, min_lon || null, max_lon || null, 
        resolution || null, filePath
      ]
    );

    res.status(201).json(successResponse({
      id,
      name,
      file_path: filePath,
      message: 'Terrain uploaded successfully'
    }));
  } catch (err) {
    next(err);
  }
};

/**
 * Register an external GeoTIFF by URL instead of uploading.
 */
exports.registerTerrain = async (req, res, next) => {
  try {
    const { name, source, format, file_path, min_lat, max_lat, min_lon, max_lon, resolution } = req.body;
    
    if (!name || !file_path) {
      throw new AppError('Name and file_path (URL) are required', 400, 'VALIDATION_ERROR');
    }

    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO terrain_datasets (
        id, name, source, format, min_lat, max_lat, min_lon, max_lon, resolution, file_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, source || 'external-url', format || 'GeoTIFF', 
        min_lat || null, max_lat || null, min_lon || null, max_lon || null, 
        resolution || null, file_path
      ]
    );

    res.status(201).json(successResponse({ id, name, file_path }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a terrain dataset by ID
 */
exports.getTerrainById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM terrain_datasets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      throw new AppError('Terrain not found', 404, 'NOT_FOUND');
    }
    res.json(successResponse(rows[0]));
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a terrain dataset
 */
exports.deleteTerrain = async (req, res, next) => {
  try {
    // Check if it's a local file so we can delete the actual file
    const [rows] = await pool.query('SELECT file_path, source FROM terrain_datasets WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      throw new AppError('Terrain not found', 404, 'NOT_FOUND');
    }

    const terrain = rows[0];

    const [result] = await pool.query('DELETE FROM terrain_datasets WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows > 0 && terrain.source === 'local-upload') {
      // Remove '/uploads/' prefix to get physical path from backend root
      const physicalPath = path.join(__dirname, '../../', terrain.file_path);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }
    }

    res.json(successResponse({ message: 'Terrain deleted successfully' }));
  } catch (err) {
    next(err);
  }
};
