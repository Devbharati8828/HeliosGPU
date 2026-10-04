const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const solarEngine = require('../services/solarEngine');
const { successResponse } = require('../utils/response');
const AppError = require('../utils/AppError');

/**
 * Compute solar data for a day and optionally save to DB
 */
exports.getSolarDay = async (req, res, next) => {
  try {
    const { lat, lon, date, time, location_id, timezone } = req.query;

    if (!lat || !lon || !date || !time) {
      throw new AppError('lat, lon, date, and time are required', 400, 'MISSING_PARAMETERS');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    // Calculate solar metrics using the backend engine
    const solarData = solarEngine.calculateSolarData(latitude, longitude, date, time);

    // Persist session if requested
    let sessionId = null;
    if (location_id) {
      sessionId = uuidv4();
      await pool.query(
        `INSERT INTO solar_sessions (id, location_id, date, time, timezone) VALUES (?, ?, ?, ?, ?)`,
        [sessionId, location_id, date, time, timezone || 'UTC']
      );

      const resultId = uuidv4();
      await pool.query(
        `INSERT INTO solar_results (
          id, session_id, solar_altitude, solar_azimuth, sunrise, solar_noon, sunset, 
          daylight_duration, solar_vector_x, solar_vector_y, solar_vector_z
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultId, sessionId, solarData.solarAltitude, solarData.solarAzimuth, 
          solarData.sunrise ? new Date(solarData.sunrise) : null, 
          solarData.solarNoon ? new Date(solarData.solarNoon) : null, 
          solarData.sunset ? new Date(solarData.sunset) : null, 
          solarData.daylightDuration,
          solarData.solarVector.x, solarData.solarVector.y, solarData.solarVector.z
        ]
      );
      
      solarData.sessionId = sessionId;
    }

    res.json(successResponse(solarData));
  } catch (err) {
    next(err);
  }
};
