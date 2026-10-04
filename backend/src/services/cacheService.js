const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Service to handle caching API responses in the MySQL database.
 */
class CacheService {
  /**
   * Get a cached response.
   * @param {string} provider - e.g., 'open-meteo'
   * @param {string} cacheKey - The unique key for the request
   * @returns {Object|null} The parsed JSON response or null if missing/expired
   */
  static async get(provider, cacheKey) {
    try {
      const [rows] = await pool.query(
        'SELECT response_json, expires_at FROM api_cache WHERE provider = ? AND cache_key = ?',
        [provider, cacheKey]
      );

      if (rows.length === 0) return null;

      const cache = rows[0];
      if (cache.expires_at && new Date() > new Date(cache.expires_at)) {
        // Expired, we can optionally clean it up here or let a cron do it.
        await pool.query('DELETE FROM api_cache WHERE provider = ? AND cache_key = ?', [provider, cacheKey]);
        return null;
      }

      return cache.response_json;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  /**
   * Save a response to the cache.
   * @param {string} provider 
   * @param {string} cacheKey 
   * @param {Object} responseJson 
   * @param {number} ttlMinutes 
   */
  static async set(provider, cacheKey, responseJson, ttlMinutes = 60 * 24 * 7) { // Default 7 days
    try {
      const expiresAt = new Date(Date.now() + ttlMinutes * 60000);
      
      // Upsert logic using INSERT ... ON DUPLICATE KEY UPDATE
      await pool.query(
        `INSERT INTO api_cache (id, provider, cache_key, response_json, expires_at) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE response_json = VALUES(response_json), expires_at = VALUES(expires_at)`,
        [uuidv4(), provider, cacheKey, JSON.stringify(responseJson), expiresAt]
      );
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }
}

module.exports = CacheService;
