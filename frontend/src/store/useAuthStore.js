import { create } from 'zustand';
import api, { ApiError } from '../services/apiClient';

/**
 * useAuthStore — Zustand store for mandatory authentication.
 *
 * Status values:
 *   'idle'          — initial state before loadMe is called
 *   'loading'       — loadMe / login / register in progress
 *   'authenticated' — user is logged in
 *   'unauthenticated' — no active session; must log in
 *   'server_error'  — backend unreachable; show retry screen
 */
export const useAuthStore = create((set, _get) => ({
  user:      null,       // { id, email, name } or null
  status:    'idle',
  errorMsg:  null,

  /**
   * loadMe — called once on app start.
   * Sets status to 'authenticated', 'unauthenticated', or 'server_error'.
   */
  loadMe: async () => {
    set({ status: 'loading' });
    try {
      const res = await api.get('/api/v1/auth/me');
      set({ user: res.data, status: 'authenticated', errorMsg: null });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Not logged in — show login page
        set({ user: null, status: 'unauthenticated', errorMsg: null });
      } else {
        // Network error or server down — show retry screen
        set({ user: null, status: 'server_error', errorMsg: null });
      }
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
      set({ status: 'unauthenticated', errorMsg: msg });
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
      set({ status: 'unauthenticated', errorMsg: msg });
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
    set({ user: null, status: 'unauthenticated', errorMsg: null });
  },

  clearError: () => set({ errorMsg: null }),
}));

