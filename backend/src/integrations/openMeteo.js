const axios = require('axios');
const CacheService = require('../services/cacheService');
const AppError = require('../utils/AppError');

const PROVIDER = 'open-meteo';

/**
 * Searches for a location using Open-Meteo Geocoding API.
 * Uses caching to prevent rate-limiting and unnecessary external calls.
 * 
 * @param {string} query - The search string (e.g., "New York")
 * @returns {Promise<Array>} List of results
 */
async function searchLocation(query) {
  if (!query) throw new AppError('Query is required', 400, 'BAD_REQUEST');

  const cacheKey = `search:${query.toLowerCase()}`;
  
  // 1. Check cache
  const cached = await CacheService.get(PROVIDER, cacheKey);
  if (cached) return cached;

  // 2. Fetch from Open-Meteo
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const response = await axios.get(url, { timeout: 5000 });
    
    const results = response.data.results || [];
    
    // 3. Save to cache (cache searches for 30 days since city data rarely changes)
    await CacheService.set(PROVIDER, cacheKey, results, 60 * 24 * 30);
    
    return results;
  } catch (error) {
    if (error.response) {
      throw new AppError('External API error', error.response.status, 'OPEN_METEO_ERROR', error.response.data);
    }
    throw new AppError('Failed to fetch from Open-Meteo', 500, 'EXTERNAL_API_UNAVAILABLE', error.message);
  }
}

module.exports = {
  searchLocation
};
