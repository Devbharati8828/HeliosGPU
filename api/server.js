require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const SunCalc = require('suncalc');
const { DateTime } = require('luxon');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

function getNumber(value, label) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new Error(`${label} must be a valid number`);
  }
  return num;
}

function normalizeResult(item) {
  return {
    id: item.id ?? null,
    name: item.name ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    elevation: item.elevation ?? null,
    timezone: item.timezone ?? null,
    country: item.country ?? null,
    admin1: item.admin1 ?? null,
    admin2: item.admin2 ?? null,
    feature_code: item.feature_code ?? null,
    population: item.population ?? null,
    country_code: item.country_code ?? null,
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'heliosgpu-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/location/search', async (req, res) => {
  try {
    const query = (req.query.query || req.query.q || '').toString().trim();
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const { data } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: query,
        count: 5,
        language: 'en',
        format: 'json',
      },
      timeout: 10000,
    });

    const results = (data.results || []).map(normalizeResult);
    return res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    const message = error.response?.data?.reason || error.message || 'Location lookup failed';
    return res.status(500).json({ error: message });
  }
});

app.get('/api/solar/position', (req, res) => {
  try {
    const lat = getNumber(req.query.lat, 'lat');
    const lng = getNumber(req.query.lng, 'lng');
    const dateString = (req.query.date || new Date().toISOString().slice(0, 10)).toString();
    const timeString = (req.query.time || '12:00').toString();
    const timezone = (req.query.timezone || 'UTC').toString();

    const jsDate = DateTime.fromISO(`${dateString}T${timeString}`, { zone: timezone }).toJSDate();
    const position = SunCalc.getPosition(jsDate, lat, lng);

    const altitude = (position.altitude * 180) / Math.PI;
    const azimuth = (position.azimuth * 180) / Math.PI;

    res.json({
      input: {
        lat,
        lng,
        date: dateString,
        time: timeString,
        timezone,
      },
      date: jsDate.toISOString(),
      altitude,
      azimuth,
      vector: {
        east: Math.cos(position.altitude) * Math.sin(position.azimuth),
        north: Math.cos(position.altitude) * Math.cos(position.azimuth),
        up: Math.sin(position.altitude),
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to calculate solar position' });
  }
});

app.get('/api/solar/daylight', (req, res) => {
  try {
    const lat = getNumber(req.query.lat, 'lat');
    const lng = getNumber(req.query.lng, 'lng');
    const dateString = (req.query.date || new Date().toISOString().slice(0, 10)).toString();
    const timezone = (req.query.timezone || 'UTC').toString();

    const referenceDate = DateTime.fromISO(`${dateString}T12:00:00`, { zone: timezone }).toJSDate();
    const times = SunCalc.getTimes(referenceDate, lat, lng);

    res.json({
      input: {
        lat,
        lng,
        date: dateString,
        timezone,
      },
      sunrise: times.sunrise?.toISOString() ?? null,
      sunset: times.sunset?.toISOString() ?? null,
      solarNoon: times.solarNoon?.toISOString() ?? null,
      dusk: times.dusk?.toISOString() ?? null,
      dawn: times.dawn?.toISOString() ?? null,
      daylightMinutes: times.sunset && times.sunrise
        ? Math.round((times.sunset - times.sunrise) / 60000)
        : null,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to calculate daylight information' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`HELIOS GPU API listening on http://localhost:${PORT}`);
});

module.exports = app;
