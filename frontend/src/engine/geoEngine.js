import * as turf from '@turf/helpers';
import distance from '@turf/distance';
import bearing from '@turf/bearing';

export const GeoEngine = {
  getDistance(fromLat, fromLng, toLat, toLng) {
    const from = turf.point([fromLng, fromLat]);
    const to = turf.point([toLng, toLat]);
    return distance(from, to, { units: 'kilometers' });
  },

  getBearing(fromLat, fromLng, toLat, toLng) {
    const from = turf.point([fromLng, fromLat]);
    const to = turf.point([toLng, toLat]);
    return bearing(from, to);
  },

  getBoundingBox(lat, lng, radiusKm) {
    // Generate a simple bounding box around a point
    const _pt = turf.point([lng, lat]); // kept for future turf.buffer upgrade
    const degOffset = radiusKm / 111;
    return [
      lng - degOffset, // minX (minLng)
      lat - degOffset, // minY (minLat)
      lng + degOffset, // maxX (maxLng)
      lat + degOffset  // maxY (maxLat)
    ];
  },

  createLocationMarkerGeoJSON(lat, lng) {
    return turf.point([lng, lat]);
  }
};
