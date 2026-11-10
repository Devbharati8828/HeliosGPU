const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const openMeteo = require('../integrations/openMeteo');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Search for locations via Open-Meteo
 */
exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) throw new AppError('Query parameter "q" is required', 400, 'MISSING_QUERY');
    
    const results = await openMeteo.searchLocation(q);
    res.json(successResponse(results));
  } catch (err) {
    next(err);
  }
};

/**
 * Save a location to the database.
 * Requires authenticated user.
 */
exports.createLocation = async (req, res, next) => {
  try {
    const { name, latitude, longitude, country, region, timezone, elevation } = req.body;
    
    if (!name || latitude === undefined || longitude === undefined) {
      throw new AppError('name, latitude, and longitude are required', 400, 'VALIDATION_ERROR');
    }

    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const userId = req.user.id;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO locations (id, name, latitude, longitude, country, region, timezone, elevation, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, latitude, longitude, country, region, timezone, elevation, userId]
    );

    res.status(201).json(successResponse({ id, name, latitude, longitude, country, region, timezone, elevation, user_id: userId }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get all saved locations for the authenticated user
 */
exports.getLocations = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const [rows] = await pool.query('SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(successResponse(rows));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific location by ID for the authenticated user
 */
exports.getLocationById = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const [rows] = await pool.query('SELECT * FROM locations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) {
      throw new AppError('Location not found', 404, 'NOT_FOUND');
    }
    res.json(successResponse(rows[0]));
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a location.
 * Only allows deletion of locations that belong to the authenticated user.
 */
exports.deleteLocation = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const [result] = await pool.query(
      'DELETE FROM locations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      throw new AppError('Location not found', 404, 'NOT_FOUND');
    }
    res.json(successResponse({ message: 'Location deleted successfully' }));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /locations/mine (requireAuth)
 * Returns only the authenticated user's saved locations.
 */
exports.getMyLocations = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(successResponse(rows));
  } catch (err) {
    next(err);
  }
};
