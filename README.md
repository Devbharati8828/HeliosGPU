# HeliosGPU

Interactive, GPU-accelerated solar position and terrain shadow simulation for any coordinate on Earth.

---

## Modes

| Mode | Description | Preview |
|------|-------------|---------|
| **Globe** | Planetary CesiumJS visualization with dynamic day/night terminator and global coordinates | _[Screenshot: Globe View]_ |
| **3D Map** | Tilted perspective map with high-resolution satellite imagery and terrain depth | _[Screenshot: 3D Map View]_ |
| **Sky** | Hemispherical local sky dome with celestial sun position, compass rose, and solar arc | _[Screenshot: Sky Dome View]_ |
| **Shadows** | WebGPU-powered terrain elevation rendering with real-time raymarched cast shadows | _[Screenshot: Shadows View]_ |

---

## Features

- **Solar Position Engine**: Real-time solar altitude and azimuth calculations for any date, time, and latitude/longitude coordinates.
- **Physics-Based Timeline Scrubber**: Interactive day timeline with sunrise, solar noon, sunset indicators, and timezone/DST-aware scrubbing.
- **WebGPU Terrain Shadows**: Client-side GPU compute shader performing raymarching over digital elevation model (DEM) grids to produce terrain shadow masks.
- **Elevation Color Ramp**: Procedural slope and elevation shading blending vegetation, rock strata, and alpine snow caps based on normalized terrain height.
- **Optional Authentication & Saved Locations**: Email + password login with bcrypt (cost 12), JWT httpOnly cookies, rotating refresh tokens, and user-scoped saved locations. Unset `VITE_API_URL` to completely hide auth UI.
- **Offline & Fallback Resilience**: Direct Open-Meteo geocoding fallback when backend is unavailable; manual GeoTIFF DEM file upload fallback when automated tile fetching is offline.
- **Four Cohesive Viewports**: Seamless switching across Globe, 3D Map, Sky, and Shadows view modes with shared time and location state.

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite 7
- **3D & Planetary Rendering**: CesiumJS, Three.js (`@react-three/fiber`, `@react-three/drei`)
- **Compute & Shaders**: WebGPU (WGSL compute and render pipelines)
- **State Management**: Zustand
- **Animations & UI**: `@react-spring/web`, Framer Motion, Tailwind CSS, Lucide Icons
- **Astronomical & Date Math**: SunCalc, Luxon
- **DEM Parsing**: `geotiff`, `lerc`

### Backend (Optional)
- **Runtime**: Node.js, Express 5
- **Database**: MySQL 8 (`mysql2/promise`)
- **Security & Middleware**: Helmet, CORS, Express Rate Limit, Morgan, Multer
- **Solar Calculations**: SunCalc, `date-fns`

---

## Setup & Running

### Prerequisites
- Node.js ≥ 18
- Modern browser with WebGPU support (Chrome 113+, Edge 113+, Safari 18+) for Shadows mode

### 1. Frontend Setup

```bash
cd frontend

# Copy environment template
cp .env.example .env
# (Optional) Add your Cesium Ion access token to VITE_CESIUM_TOKEN in .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 2. Backend Setup (Optional)

> **Note**: The backend is completely optional. If the backend is not running, the frontend gracefully falls back to client-side Open-Meteo geocoding.

```bash
cd backend

# Copy environment template
cp .env.example .env
# Configure PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# Install dependencies
npm install

# Start backend server
npm start
```

Or start MySQL using Docker:

```bash
cd database
docker compose up -d
```

---

## Architecture

```
                 ┌────────────────────────────────────────┐
                 │       HeliosGPU Web Application        │
                 │              (React 19)                │
                 └───────────────────┬────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
     ┌─────▼──────┐            ┌─────▼──────┐            ┌─────▼──────┐
     │  CesiumJS  │            │  Three.js  │            │   WebGPU   │
     │ Globe & 3D │            │  Sky Dome  │            │  Compute & │
     │    Map     │            │  Solar Arc │            │   Render   │
     └─────┬──────┘            └─────┬──────┘            └─────┬──────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                        ┌────────────▼───────────┐
                        │   Zustand State Store  │
                        │ (Coords, Time, SunPos) │
                        └────────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
           ┌────────▼────────┐               ┌────────▼────────┐
           │ Open-Meteo API  │               │ Node.js Backend │
           │  (Client-side   │               │   (Optional /   │
           │   Geocoding)    │               │  MySQL Storage) │
           └─────────────────┘               └─────────────────┘
```

- **Client-Centric Compute**: All solar geometry calculations, terrain tile fetching, and shadow raymarching run directly in the client browser.
- **Unified Store**: `useHeliosStore` orchestrates view mode, date/time, solar angles, and coordinates across all three rendering runtimes (Cesium, Three.js, WebGPU).
- **Graceful Degradation**: Location search queries backend first, then falls back seamlessly to Open-Meteo's public geocoding API if the backend is down.

---

## Limitations

- **Terrain-Only Shadows**: Shadow computation is performed exclusively on terrain elevation rasters. Building structures, vegetation canopy, and urban infrastructure shadows are not modeled.
- **Approximate Raymarch**: Shadows are generated via raymarching over a discretized elevation grid with stepping increments; results are visual approximations designed for interactive exploration.
- **WebGPU Dependency**: Shadows mode requires browser WebGPU support. On browsers lacking WebGPU, Globe, 3D Map, and Sky modes remain fully functional, while Shadows mode displays a fallback notice.
- **Backend Optional**: Location persistence and custom terrain upload rely on the optional Node.js/MySQL backend; core simulation features require no backend connection.
- **Authentication Scope (v1)**: Email verification, password reset, OAuth social logins, and refresh token rotation across multiple concurrent devices are out of scope for v1. Zero tokens are stored in `localStorage`. Cross-domain production hosting requires `SameSite=None; Secure`.

---

## API & Data Attributions

- **[CesiumJS](https://cesium.com/)**: 3D globe and virtual globe rendering engine.
- **[ArcGIS / Esri](https://www.esri.com/)**: World Imagery satellite basemap tiles.
- **[Open-Meteo](https://open-meteo.com/)**: Geocoding search API and weather data.
- **[AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)**: Mapzen / Nextzen elevation tiles for terrain relief.
- **[OpenStreetMap](https://www.openstreetmap.org/)**: Map data and cartography contributors.
