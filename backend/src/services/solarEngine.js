const SunCalc = require('suncalc');
const { differenceInSeconds } = require('date-fns');

/**
 * Calculate solar data for a given location and date/time.
 */
function calculateSolarData(lat, lon, dateString, timeString) {
  // Parse date and time
  const [year, month, day] = dateString.split('-');
  const [hour, minute] = timeString.split(':');
  
  // Note: For a strict scientific implementation, timezone handling is critical.
  // For this MVP, we parse it as local time of the server, or UTC if specified.
  const targetDate = new Date(year, month - 1, day, hour, minute);

  // 1. Get Sun Position
  // suncalc v2 returns altitude and azimuth in DEGREES (not radians like v1)
  const position = SunCalc.getPosition(targetDate, lat, lon);
  const solarAltitude = position.altitude;   // already degrees
  const solarAzimuth = position.azimuth;     // already degrees (0=N, clockwise)

  // 2. Get Sun Events (Sunrise, Sunset, Noon)
  const times = SunCalc.getTimes(targetDate, lat, lon);
  
  // 3. Daylight Duration
  let daylightDuration = 0;
  if (times.sunrise && times.sunset) {
    daylightDuration = differenceInSeconds(times.sunset, times.sunrise);
  }

  // 4. Calculate Solar Vector (Cartesian — Z up, Y North, X East)
  const altRad = (solarAltitude * Math.PI) / 180;
  const azRad  = (solarAzimuth  * Math.PI) / 180;
  
  const vectorX = Math.cos(altRad) * Math.sin(azRad);
  const vectorY = Math.cos(altRad) * Math.cos(azRad);
  const vectorZ = Math.sin(altRad);

  return {
    latitude: lat,
    longitude: lon,
    date: dateString,
    time: timeString,
    solarAltitude: Number(solarAltitude.toFixed(2)),
    solarAzimuth: Number(solarAzimuth.toFixed(2)),
    sunrise: times.sunrise ? times.sunrise.toISOString() : null,
    solarNoon: times.solarNoon ? times.solarNoon.toISOString() : null,
    sunset: times.sunset ? times.sunset.toISOString() : null,
    daylightDuration,
    solarVector: {
      x: Number(vectorX.toFixed(4)),
      y: Number(vectorY.toFixed(4)),
      z: Number(vectorZ.toFixed(4))
    }
  };
}

module.exports = {
  calculateSolarData
};
