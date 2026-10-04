/**
 * Format a successful response.
 * @param {Object} data - The data payload
 * @returns {Object} Formatted response
 */
function successResponse(data = {}) {
  return {
    success: true,
    data
  };
}

/**
 * Format an error response.
 * @param {string} code - The error code (e.g., 'INVALID_COORDINATES')
 * @param {string} message - The human-readable message
 * @param {Object} [details] - Optional extra details
 * @returns {Object} Formatted response
 */
function errorResponse(code, message, details = null) {
  const err = { code, message };
  if (details) {
    err.details = details;
  }
  return {
    success: false,
    error: err
  };
}

module.exports = {
  successResponse,
  errorResponse
};
