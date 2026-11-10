/**
 * Thin API client that always sends credentials (cookies) and
 * attempts a token refresh on 401 before giving up.
 * On refresh failure, marks the auth store as unauthenticated.
 *
 * Usage: import api from '../services/apiClient';
 *        const data = await api.get('/api/v1/auth/me');
 */

import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code   = code;
  }
}

let isRefreshing = false;
let refreshPromise = null;

async function doRefresh() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, 'Session expired', 'SESSION_EXPIRED');
  return res.json();
}

async function request(path, options = {}, isRetry = false) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !isRetry) {
    // Try refreshing once
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefresh().finally(() => { isRefreshing = false; refreshPromise = null; });
      }
      await refreshPromise;
      return request(path, options, true);
    } catch {
      // Refresh failed — force user back to login page
      useAuthStore.setState({ user: null, status: 'unauthenticated', errorMsg: null });
    }
  }

  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, body.message || res.statusText, body.code);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get:    (path, opts = {}) => request(path, { method: 'GET',    ...opts }),
  post:   (path, body, opts = {}) => request(path, { method: 'POST',   body: JSON.stringify(body), ...opts }),
  patch:  (path, body, opts = {}) => request(path, { method: 'PATCH',  body: JSON.stringify(body), ...opts }),
  delete: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
};

export default api;
export { ApiError };
