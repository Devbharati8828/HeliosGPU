const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/AppError');
const solarEngine = require('../services/solarEngine');

/**
 * Create a new analysis session.
 * The backend calculates the solar vectors here, but delegates the shadow computation
 * to the frontend WebGPU engine.
 */
exports.createAnalysis = async (req, res, next) => {
  try {
    const { latitude, longitude, date, time, terrainId } = req.body;

    if (!latitude || !longitude || !date || !time) {
      throw new AppError('Missing required analysis parameters', 400, 'VALIDATION_ERROR');
    }

    const locationId = uuidv4();
    const analysisId = uuidv4();
    const sessionId = uuidv4();

    // 1. Create a temporary location record for this analysis
    await pool.query(
      `INSERT INTO locations (id, name, latitude, longitude) VALUES (?, ?, ?, ?)`,
      [locationId, `Analysis @ ${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`, latitude, longitude]
    );

    // 2. Compute Solar Data for the session
    const solarData = solarEngine.calculateSolarData(latitude, longitude, date, time);

    // 3. Save Solar Session
    await pool.query(
      `INSERT INTO solar_sessions (id, location_id, date, time, timezone) VALUES (?, ?, ?, ?, 'UTC')`,
      [sessionId, locationId, date, time]
    );

    // 4. Save Solar Results (vectors, etc.)
    await pool.query(
      `INSERT INTO solar_results (
        id, session_id, solar_altitude, solar_azimuth, sunrise, solar_noon, sunset, 
        daylight_duration, solar_vector_x, solar_vector_y, solar_vector_z
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), sessionId, solarData.solarAltitude, solarData.solarAzimuth, 
        solarData.sunrise ? new Date(solarData.sunrise) : null, 
        solarData.solarNoon ? new Date(solarData.solarNoon) : null, 
        solarData.sunset ? new Date(solarData.sunset) : null, 
        solarData.daylightDuration,
        solarData.solarVector.x, solarData.solarVector.y, solarData.solarVector.z
      ]
    );

    // 5. Create Analysis Session — terrain_id is nullable (no FK enforcement for local tiles)
    // Only set terrain_id if it looks like a UUID to avoid FK violation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeTerrainId = terrainId && uuidRegex.test(terrainId) ? terrainId : null;

    await pool.query(
      `INSERT INTO analysis_sessions (id, location_id, terrain_id, date, time, status) 
       VALUES (?, ?, ?, ?, ?, 'ready')`,
      [analysisId, locationId, safeTerrainId, date, time]
    );

    res.status(201).json(successResponse({
      analysisId,
      solar: solarData,
      terrain: { id: terrainId },
      engineStatus: 'ready'
    }));

  } catch (err) {
    console.error('[Analysis] createAnalysis error:', err.message, err.code || '', err.sql || '');
    next(err);
  }
};

/**
 * Get analysis status
 */
exports.getAnalysisStatus = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT status, created_at, completed_at FROM analysis_sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      throw new AppError('Analysis not found', 404, 'NOT_FOUND');
    }
    res.json(successResponse(rows[0]));
  } catch (err) {
    next(err);
  }
};

/**
 * The frontend calls this endpoint after WebGPU finishes the compute shader.
 * It stores the result references/metadata.
 */
exports.submitAnalysisResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { compute_time_ms, shadow_reference, metadata_json } = req.body;

    // Verify session
    const [sessions] = await pool.query('SELECT status FROM analysis_sessions WHERE id = ?', [id]);
    if (sessions.length === 0) {
      throw new AppError('Analysis not found', 404, 'NOT_FOUND');
    }

    // Save result
    const resultId = uuidv4();
    await pool.query(
      `INSERT INTO analysis_results (id, analysis_id, shadow_reference, compute_time_ms, metadata_json) 
       VALUES (?, ?, ?, ?, ?)`,
      [resultId, id, shadow_reference, compute_time_ms || null, JSON.stringify(metadata_json || {})]
    );

    // Update session status
    await pool.query(
      `UPDATE analysis_sessions SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    res.json(successResponse({ resultId, status: 'completed' }));
  } catch (err) {
    next(err);
  }
};

/**
 * Get a past analysis result
 */
exports.getAnalysisResult = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, s.status, s.date, s.time 
       FROM analysis_results r 
       JOIN analysis_sessions s ON r.analysis_id = s.id 
       WHERE r.analysis_id = ?`, 
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new AppError('Result not found', 404, 'NOT_FOUND');
    }
    res.json(successResponse(rows[0]));
  } catch (err) {
    next(err);
  }
};
