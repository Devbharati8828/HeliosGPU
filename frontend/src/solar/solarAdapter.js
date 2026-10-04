import { SolarEngine } from '../engine/solarEngine';
import { sunVector } from './sunVector';

/**
 * Solar Adapter
 * 
 * This is the SINGLE source of truth for all solar calculations in the frontend.
 * It wraps the underlying SolarEngine (which uses SunCalc internally).
 * No UI components should import SunCalc or Astronomy Engine directly.
 */
export const solarAdapter = {
  /**
   * Get sun altitude and azimuth for a given date and position.
   * @param {Date} date
   * @param {number} lat
   * @param {number} lng
   * @returns {{ altitude: number, azimuth: number }} degrees (azimuth: 0=North, clockwise)
   */
  getSunPosition(date, lat, lng) {
    return SolarEngine.getSunPosition(date, lat, lng);
  },

  /**
   * Get key solar event times for a date and position.
   * @param {Date} date
   * @param {number} lat
   * @param {number} lng
   * @returns {{ sunrise: Date, sunset: Date, solarNoon: Date }}
   */
  getSunTimes(date, lat, lng) {
    return SolarEngine.getSunTimes(date, lat, lng);
  },

  /**
   * Get formatted daylight duration.
   * @param {Date} date
   * @param {number} lat
   * @param {number} lng
   * @returns {{ hours: number, minutes: number, formatted: string }}
   */
  getDaylightInfo(date, lat, lng) {
    return SolarEngine.getDaylightDuration(date, lat, lng);
  },

  /**
   * Sample sun positions across the full day to build a 3D arc.
   * @param {Date} date
   * @param {number} lat
   * @param {number} lng
   * @param {number} segments
   * @returns {Array<{x, y, z, altitude, azimuth, time}>}
   */
  getSolarArcSamples(date, lat, lng, segments = 96) {
    return SolarEngine.getSolarArcPoints(date, lat, lng, segments, 50);
  },

  /**
   * Compute the approximate day/night terminator as [lng, lat] pairs.
   * @param {Date} date
   * @param {number} segments
   * @returns {Array<[number, number]>} GeoJSON-compatible coordinate array
   */
  getTerminator(date, segments = 120) {
    return SolarEngine.getDayNightTerminator(date, segments);
  },

  /**
   * Calculate Cartesian vector components for a given sun position.
   * @param {{ altitude: number, azimuth: number }} position in degrees
   * @returns {{ east: number, north: number, up: number }}
   */
  sunVector(position) {
    return sunVector(position);
  }
};
