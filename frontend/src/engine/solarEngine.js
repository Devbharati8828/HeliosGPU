import SunCalc from 'suncalc';
import { sunVector } from '../solar/sunVector';

// ============================================================
// HELIOS Solar Engine
// Primary: SunCalc (fast, ~0.01ms, great for 60fps scrubbing)
// The astronomy-engine import is done dynamically to avoid
// bundle issues; SunCalc is sufficient for all real-time use.
// ============================================================

export const SolarEngine = {

  // ─── PRIMARY: SunCalc (fast, real-time) ─────────────────────────────────

  /**
   * Get sun altitude and azimuth for a given date and position.
   * @returns {{ altitude: number, azimuth: number }} degrees
   */
  getSunPosition(date, lat, lng) {
    const pos = SunCalc.getPosition(date, lat, lng);
    // SunCalc azimuth: 0=South, positive=West. Convert to 0=North, clockwise.
    const azimuthNorth = ((pos.azimuth * 180) / Math.PI + 180) % 360;
    return {
      altitude: (pos.altitude * 180) / Math.PI,
      azimuth: azimuthNorth,
    };
  },

  /**
   * Get key solar event times for a date and position.
   */
  getSunTimes(date, lat, lng) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // Use noon of the day to avoid DST edge cases
    const times = SunCalc.getTimes(d, lat, lng);
    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      nadir: times.nadir,
      dawn: times.dawn,       // Civil dawn
      dusk: times.dusk,       // Civil dusk
      nauticalDawn: times.nauticalDawn,
      nauticalDusk: times.nauticalDusk,
    };
  },

  /**
   * Get daylight duration for a date and position.
   * @returns {{ hours: number, minutes: number, formatted: string }}
   */
  getDaylightDuration(date, lat, lng) {
    const times = this.getSunTimes(date, lat, lng);
    if (!times.sunrise || !times.sunset ||
        isNaN(times.sunrise.getTime()) || isNaN(times.sunset.getTime())) {
      return { hours: 0, minutes: 0, formatted: 'Polar night' };
    }
    const ms = times.sunset.getTime() - times.sunrise.getTime();
    if (ms <= 0) return { hours: 0, minutes: 0, formatted: 'Polar night' };
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  },

  // ─── DERIVED ─────────────────────────────────────────────────────────────

  /**
   * Sample sun positions across the full day to build a 3D arc.
   * @returns {Array<{x, y, z, altitude, azimuth, time}>}
   */
  getSolarArcPoints(date, lat, lng, segments = 96, radius = 50) {
    const points = [];
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);

    for (let i = 0; i <= segments; i++) {
      const t = new Date(midnight.getTime() + (i / segments) * 86_400_000);
      const pos = this.getSunPosition(t, lat, lng);
      const vec = sunVector(pos);
      const cart = { x: vec.east * radius, y: vec.up * radius, z: -vec.north * radius };
      points.push({ ...cart, altitude: pos.altitude, azimuth: pos.azimuth, time: t });
    }
    return points;
  },

  /**
   * Compute the approximate day/night terminator as [lng, lat] pairs.
   * Simple geometric approach: finds where solar altitude = 0 along each meridian.
   * @returns {Array<[number, number]>} GeoJSON-compatible coordinate array
   */
  getDayNightTerminator(date, segments = 180) {
    const coords = [];
    const decDeg = this._getSunDeclination(date);
    const decRad = (decDeg * Math.PI) / 180;
    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    for (let i = 0; i <= segments; i++) {
      const lng = -180 + (i / segments) * 360;
      // Hour angle of the sun at this longitude
      const ha = ((utcHours - 12) * 15 + lng) * (Math.PI / 180);
      // Latitude where altitude = 0
      const latRad = Math.atan(-Math.cos(ha) / Math.tan(decRad));
      const lat = (latRad * 180) / Math.PI;
      if (isFinite(lat)) coords.push([lng, lat]);
    }
    return coords;
  },

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

  _getSunDeclination(date) {
    const dayOfYear = Math.floor(
      (date - new Date(date.getFullYear(), 0, 0)) / 86_400_000
    );
    // Spencer formula (accurate to ±0.3°)
    return -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  },
};
