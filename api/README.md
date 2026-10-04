# HELIOS GPU API

This directory contains a standalone API-only layer for external solar and geocoding access.

Important:
- The existing frontend and backend remain unchanged.
- This API is intentionally isolated and can be run independently on port 4000.

## Endpoints

- GET /api/health
- GET /api/location/search?query=Delhi
- GET /api/solar/position?lat=28.6139&lng=77.2090&date=2026-09-20&time=12:00&timezone=Asia/Kolkata
- GET /api/solar/daylight?lat=28.6139&lng=77.2090&date=2026-09-20&timezone=Asia/Kolkata

## External data sources

- Open-Meteo Geocoding: https://open-meteo.com/en/docs/geocoding-api
- SunCalc: https://github.com/mourner/suncalc
- Luxon timezone conversion: https://moment.github.io/luxon/

## Setup

```bash
cd api
npm install
cp .env.example .env
npm run dev
```

Then open:

- http://localhost:4000/api/health
- http://localhost:4000/api/location/search?query=New%20Delhi
