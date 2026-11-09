import { create } from 'zustand';
import api, { ApiError } from '../services/apiClient';

/**
 * useAuthStore — Zustand store for optional authentication.
 *
 * Status values:
 *   'idle'          — initial state before loadMe is called
 *   'loading'       — loadMe / login / register in progress
 *   'authenticated' — user is logged in
 *   'guest'         — no active session (guest mode)
 *   'error'         — last action failed (see errorMsg)
 */
export const useAuthStore = create((set, _get) => ({
  user:      null,       // { id, email, name } or null
  status:    'idle',
  errorMsg:  null,

  /**
   * loadMe — called once on app start.
   * On failure (401, network error) stays in guest mode silently.
   */
  loadMe: async () => {
    // Only call backend if VITE_API_URL is configured or in local development
    if (!import.meta.env.VITE_API_URL && !import.meta.env.DEV) {
      set({ status: 'guest' });
      return;
    }
    set({ status: 'loading' });
    try {
      const res = await api.get('/api/v1/auth/me');
      set({ user: res.data, status: 'authenticated', errorMsg: null });
    } catch {
      // 401 or network error — stay in guest mode, no error overlay
      set({ user: null, status: 'guest', errorMsg: null });
    }
  },

  /**
   * login — POST /auth/login with email and password.
   * Throws on failure so the UI can display inline errors.
   */
  login: async (email, password) => {
    set({ status: 'loading', errorMsg: null });
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      set({ user: res.data, status: 'authenticated', errorMsg: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      set({ status: 'error', errorMsg: msg });
      throw err;
    }
  },

  /**
   * register — POST /auth/register.
   * Throws on failure so the UI can display inline errors.
   */
  register: async (email, password, name) => {
    set({ status: 'loading', errorMsg: null });
    try {
      const res = await api.post('/api/v1/auth/register', { email, password, name });
      set({ user: res.data, status: 'authenticated', errorMsg: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      set({ status: 'error', errorMsg: msg });
      throw err;
    }
  },

  /**
   * logout — POST /auth/logout and clears local state.
   */
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout', {});
    } catch { /* ignore network errors on logout */ }
    set({ user: null, status: 'guest', errorMsg: null });
  },

  clearError: () => set({ errorMsg: null }),
}));

