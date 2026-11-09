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
 * Uses optionalAuth — if the caller is logged in the location is linked to their account.
 */
exports.createLocation = async (req, res, next) => {
  try {
    const { name, latitude, longitude, country, region, timezone, elevation } = req.body;
    
    if (!name || latitude === undefined || longitude === undefined) {
      throw new AppError('name, latitude, and longitude are required', 400, 'VALIDATION_ERROR');
    }

    // req.user is set by optionalAuth middleware; null for guests
    const userId = (req.user && req.user.id) || null;

    const id = uuidv4();
    await pool.query(
      `INSERT INTO locations (id, name, latitude, longitude, country, region, timezone, elevation, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, latitude, longitude, country, region, timezone, elevation, userId]
    );

    res.status(201).json(successResponse({ id, name, latitude, longitude, country, region, timezone, elevation }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get all saved locations
 */
exports.getLocations = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM locations ORDER BY created_at DESC');
    res.json(successResponse(rows));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific location by ID
 */
exports.getLocationById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [req.params.id]);
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
 * If the caller is authenticated (optionalAuth), only allow deletion of
 * locations that belong to them.  Guest-created rows (user_id IS NULL) can
 * still be deleted without auth (legacy behaviour).
 */
exports.deleteLocation = async (req, res, next) => {
  try {
    let result;
    if (req.user) {
      // Logged-in user: only their own locations (return 404, never 403)
      [result] = await pool.query(
        'DELETE FROM locations WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
    } else {
      // Guest: only guest (NULL user_id) locations
      [result] = await pool.query(
        'DELETE FROM locations WHERE id = ? AND user_id IS NULL',
        [req.params.id]
      );
    }
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
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(successResponse(rows));
  } catch (err) {
    next(err);
  }
};
