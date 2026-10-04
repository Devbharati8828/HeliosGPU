/**
 * HelioScope API Client
 * Wraps browser fetch to communicate with the Express backend.
 */
// Uses Vite proxy in dev (/api → http://localhost:3000/api), relative in prod
const BASE_URL = '/api/v1';

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMsg = data?.error?.message || 'API request failed';
      throw new Error(errorMsg);
    }
    
    return data.data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const apiClient = {
  locations: {
    search: (query) => 
      fetchAPI(`/locations/search?q=${encodeURIComponent(query)}`),
      
    create: (locationData) => 
      fetchAPI('/locations', {
        method: 'POST',
        body: JSON.stringify(locationData),
      }),
  },
  
  solar: {
    getDay: (lat, lon, dateStr, timeStr, locationId = null) => {
      let qs = `lat=${lat}&lon=${lon}&date=${dateStr}&time=${timeStr}`;
      if (locationId) qs += `&location_id=${locationId}`;
      return fetchAPI(`/solar/day?${qs}`);
    },
  },
  
  terrain: {
    getSources: () => fetchAPI('/terrain/sources'),
  },

  analysis: {
    createSession: (data) => 
      fetchAPI('/analysis', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      
    submitResult: (analysisId, resultData) => 
      fetchAPI(`/analysis/${analysisId}/result`, {
        method: 'POST',
        body: JSON.stringify(resultData),
      }),
  }
};
