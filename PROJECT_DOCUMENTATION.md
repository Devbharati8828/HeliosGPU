# HELIOS — Complete Project Documentation

**Audit basis.** This document describes the code that is present in this repository, not an intended product specification. Claims are tied to the file and the relevant function or component. `NOT IMPLEMENTED` means the repository contains a placeholder, disconnected path, or no implementation for the described behavior. `UNSURE` means the code or configuration does not establish the fact conclusively.

## 1. PROJECT OVERVIEW

### Name and pitch

**Name:** Helios / HeliosGPU. The browser application title is “Helios — Global Solar Observatory” ([`frontend/index.html`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/index.html), document `<title>`).

**One-line pitch:** Helios is an interactive browser visualization that calculates the Sun’s position for a selected place and date, then presents it as a globe, a Cesium 3D map, a stylized sky, or a local WebGPU terrain-shadow view ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), store state).

### Five-line summary

1. It is a React and Vite single-page application with four view modes: Globe, 3D Map, Sky, and Shadows ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx), `modes`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`).
2. It is aimed at people who want to explore solar altitude, azimuth, sunrise/sunset, daylight duration, and terrain illumination for a selected location ([`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx), `SunData`; [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `SolarEngine`).
3. It matters as a visual explanation of how time, geography, Sun direction, terrain elevation, and rendering interact ([`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx), `Sun`; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `ShadowGpuRenderer`).
4. The technically hard part is moving a 1024×1024 digital elevation model (DEM: a grid of terrain heights) from a worker into WebGPU and ray-marching each grid cell in a compute shader ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), worker handler; [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`).
5. The repository also contains an Express/MySQL backend, but the main current UI only calls it for location search and saving a selected location; the active Shadows view fetches Terrarium tiles directly from the browser worker ([`frontend/src/lib/apiClient.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/apiClient.js), `apiClient`; [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `fetchTileBlob`).

### Real-world problem and realistic use case

The practical problem is understanding how the Sun moves over a location and how local terrain can block sunlight. A realistic use case is a student or early-stage solar-site analyst selecting a mountain location, scrubbing the day, comparing sunrise/sunset, and inspecting a terrain-only shadow approximation before doing a professional survey. The code supports solar geometry and terrain shadows, but it does **not** model buildings in the Shadows view or provide engineering-grade solar feasibility calculations: active shadow input is elevation data, while city buildings are a separate Cesium ion layer ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), tile grid; [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `Cesium3DTileset.fromIonAssetId`).

### Current status

| Area | Status grounded in code |
|---|---|
| App boot and four-mode selector | Implemented. Boot checks `navigator.gpu`, shows progress, and lazy-loads views ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `boot`; lazy imports). |
| Solar calculations and timeline | Implemented locally with SunCalc, Luxon-based date construction, 96 arc samples, and a draggable range input ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `SolarEngine`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `getInitialSolarState`; [`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx), `SolarTimeline`). |
| Globe | Implemented with Cesium World Terrain and ArcGIS World Imagery; Cesium ion token is optional in code, but World Terrain and ion buildings can fail without usable access ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`, `CesiumView`). |
| 3D Map | Implemented as the same Cesium viewer with an ion 3D Tiles building asset shown and a tilted camera ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `flyTo3DMap`, `CesiumView`). |
| Sky | Implemented with React Three Fiber, custom GLSL gradient, stars, Sun mesh, lights, arc, compass, bloom, and vignette ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `HeliosScene`; [`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `SkyDome`). |
| Shadows | Implemented in the active path with an HTTP Terrarium tile worker, OPFS file cache, WebGPU compute, and a WebGPU terrain render pass ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ShadowsView`; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `ShadowGpuRenderer`). |
| Backend persistence | Implemented in the backend, but optional to the main UI and dependent on MySQL environment variables ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), app routes; [`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js), pool). |
| Backend-to-active-Shadows integration | **NOT IMPLEMENTED** in the active `ShadowsView`: it does not call `apiClient.analysis`; that path is only referenced by the unmounted `EngineTest` component ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ShadowsView`; [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx), `EngineTest`). |

## 2. FEATURES AND MODES

| Mode | What the user sees and does | Technology | Data source | Key / WebGPU | Implementing files |
|---|---|---|---|---|---|
| **GLOBE** | An orbital Earth view, location marker/label, day/night terminator, imagery, terrain, and Cesium lighting/shadows. The timeline updates Cesium clock time ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `CesiumView` pre-render listener). | Cesium viewer, Cesium World Terrain, ArcGIS imagery, Cesium scene lighting ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `viewerOptions`). | Cesium World Terrain and ArcGIS World Imagery, plus locally calculated terminator coordinates ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), provider construction; [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getDayNightTerminator`). | No WebGPU check is required by the Globe view. `VITE_CESIUM_TOKEN` is read if present; exact access requirements and current quota are **UNSURE** ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`; [`frontend/.env.example`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/.env.example)). | [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), [`frontend/src/globe/cesiumConfig.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/cesiumConfig.js), [`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx). |
| **3D MAP** | The same Cesium scene changes to a city-level camera at about 1,200 m and enables Cesium ion 3D Buildings asset `96188`; building labels are hidden at street level ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `flyTo3DMap`, `Cesium3DTileset.fromIonAssetId`, mode effect). | Cesium 3D Tiles (a streamed tiled 3D dataset), Cesium World Terrain, ArcGIS imagery ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `CesiumView`). | Cesium ion asset 96188, World Terrain, and ArcGIS World Imagery ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), provider/asset calls). | No WebGPU check. A Cesium ion token is not automatically required by the local conditional, but access to the ion asset may fail without valid service access; **UNSURE** whether anonymous access remains available ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`). | [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), [`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx). |
| **SKY** | A navigable local sky: custom day/twilight/night gradient, stars at night/twilight, animated Sun and directional light, dashed solar arc, compass, and pointer-camera controls ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `HeliosScene`; [`frontend/src/scene/SceneCamera.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SceneCamera.jsx), `SceneCamera`). | React Three Fiber (React renderer for Three.js), Three.js, GLSL (OpenGL Shading Language) sky shader, postprocessing Bloom/Vignette ([`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `SKY_VERTEX`, `SKY_FRAGMENT`; [`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `EffectComposer`). | Only local solar state calculated by SunCalc; no remote weather or imagery call ([`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `sunPosition`; [`frontend/src/solar/solarAdapter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/solarAdapter.js), adapter). | No key and no WebGPU. It uses WebGL through Three.js ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `Canvas`). | [`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), [`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), [`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx), [`frontend/src/scene/SolarArc.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SolarArc.jsx), [`frontend/src/scene/CompassRose.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/CompassRose.jsx). |
| **SHADOWS** | A WebGPU canvas renders a terrain mesh. The panel displays coordinates, tile progress, cache/live status, metres per sample, day-of-year slider, and camera reset. Drag rotates the terrain; wheel zooms; failed automatic loading offers GeoTIFF upload ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ShadowsView`, `ManualUploadFallback`, pointer handlers). | Web Worker, AWS Terrarium PNG DEMs, OPFS (Origin Private File System) cache, WebGPU compute shader and WebGPU render shader ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), message handler; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `ShadowGpuRenderer`). | 16 AWS Terrarium tiles at zoom 12, stitched to 1024×1024; optional manually uploaded GeoTIFF ([`frontend/src/shadows/dem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.ts), `fetchDEM`; [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), fetch/stitch). | No API key in code. WebGPU is required for the active renderer; missing WebGPU produces an error panel path ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `getGpuDevice`; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), GPU effect). | [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), [`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl). |

## 3. TECH STACK TABLE

Versions below are the declared package versions, not independently resolved lockfile versions.

| Layer | Technology / library | Version | Why it is present |
|---|---|---:|---|
| Frontend framework | React | `19.2.0` | Component UI and lifecycle ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json); [`frontend/src/main.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/main.jsx), `createRoot`). |
| Frontend DOM | React DOM | `19.2.0` | Mounts React into `#root` ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json); [`frontend/src/main.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/main.jsx)). |
| Build tool | Vite | `^6.0.0` declared | Development server, proxy, production build, raw WGSL imports ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json); [`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js)). The observed CLI reported Vite `7.3.6`, indicating installed/dependency-resolution drift. |
| React build plugin | `@vitejs/plugin-react` | `^4.4.0` | JSX transform and Babel targets ([`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js)). |
| Styling | Tailwind CSS and `@tailwindcss/vite` | `^4.0.0`, `^4.3.3` | Utility classes plus design tokens and handwritten CSS ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json); [`frontend/src/index.css`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/index.css)). |
| State | Zustand and `subscribeWithSelector` | `^5.0.0` | Central solar/location/view state and high-frequency subscriptions ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), store creation; [`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx), subscription). |
| UI primitives | Radix Dialog, Popover, Slider, Tabs, Toggle Group, Tooltip | `^1.1.0`, `^1.1.0`, `^1.2.0`, `^1.1.0`, `^1.1.0`, `^1.0.0` | Declared accessible primitives; direct current component usage is not established by imports in `frontend/src` [NOT IMPLEMENTED as an active feature claim] ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json)). |
| UI/animation | Framer Motion | `^12.0.0`; React Spring web/three `^9.7.0`, `^9.7.0`; GSAP `^3.12.0` | Modal/header/loading transitions and timeline spring; GSAP is declared but active use is [UNSURE] ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx); [`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx)). |
| Icons/search | `lucide-react` `^0.470.0`, `cmdk` `^1.0.0`, `clsx` `^2.0.0`, `tailwind-merge` `^3.0.0` | Declared versions | Icons, command-style search, and class merging ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx); [`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx); [`frontend/src/lib/utils.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/utils.js)). |
| Globe/3D | Cesium `^1.145.0`, Resium `^1.26.0` | Declared versions | Cesium is dynamically imported directly; Resium is declared but not imported by active source [UNSURE/unused] ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx); [`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json)). |
| WebGL 3D | Three.js `^0.172.0`, React Three Fiber `^9.1.0`, Drei `^10.0.0` | Declared versions | Sky scene, camera controls, stars, lines, HTML compass ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx); [`frontend/src/scene/SceneCamera.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SceneCamera.jsx)). |
| 3D effects | `@react-three/postprocessing ^3.0.0`, `postprocessing ^6.39.5`, `camera-controls ^3.0.0`, `@react-three/rapier ^2.2.0` | Declared versions | Active postprocessing and controls use; Rapier is declared but no active usage was established [UNSURE] ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx); [`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json)). |
| Solar | SunCalc `^1.9.0`, Astronomy Engine `^2.1.0`, Luxon `^3.7.2`, date-fns `^4.0.0` | Declared versions | SunCalc is active for Sun position/events; Luxon handles target timezone day start; Astronomy Engine is dynamically mentioned but not called in the active adapter; date-fns is used by the old `EngineTest` ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js); [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js); [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx)). |
| Terrain/data | GeoTIFF `^2.1.0`, Turf bbox/bearing/distance/helpers all `^7.0.0`, Simplex Noise `^4.0.3` | Declared versions | GeoTIFF decoding is used by manual uploads; Turf and Simplex Noise active use is [UNSURE] from the inspected source ([`frontend/src/engine/demLoader.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/demLoader.js); [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx)). |
| Browser compute/cache | `@webgpu/types ^0.1.74`, `wgpu-matrix ^3.4.2`, `@sqlite.org/sqlite-wasm ^3.53.4-build1` | Declared versions | WebGPU types/shader development, matrix dependency declaration, and an older SQLite-WASM OPFS cache implementation ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts); [`frontend/src/engine/data/OPFSCache.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/data/OPFSCache.js)). Active Shadows uses file-system OPFS directly instead of this SQLite cache. |
| Backend runtime | Node.js CommonJS, Express `^5.2.1`, dotenv `^18.0.1`, CORS `^2.8.6`, Helmet `^8.3.0`, Morgan `^1.12.1`, express-rate-limit `^8.7.0` | Declared versions | HTTP API, environment loading, cross-origin policy, security headers, request logging, rate limiting ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js); [`backend/src/middleware/rateLimiter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/rateLimiter.js)). |
| Backend data | MySQL 8.0, `mysql2 ^3.24.4`, UUID `^14.0.2`, Zod `^4.6.5` | Declared versions | MySQL pool, UUID identifiers, Zod-shaped error branch; request schemas using Zod are not present in inspected controllers [UNSURE] ([`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)). |
| Backend integrations | Axios `^1.20.0`, SunCalc `^2.0.2`, date-fns `^4.4.0`, Multer `^2.4.0` | Declared versions | Open-Meteo calls, backend solar calculations, duration, and DEM multipart uploads ([`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js); [`backend/src/routes/v1/terrain.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/routes/v1/terrain.js)). |
| Separate API | Express `^4.21.2`, Axios `^1.7.9`, CORS `^2.8.5`, dotenv `^16.4.5`, Luxon `^3.4.0`, SunCalc `^2.0.2` | Declared versions | An isolated port-4000 API with location and solar endpoints ([`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js), app; [`api/README.md`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/README.md)). |
| Hosting | Vercel rewrite configuration | No package version | Routes all paths to `index.html` for the frontend SPA ([`frontend/vercel.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vercel.json)). A backend deployment target is not specified in this repository [UNSURE]. |

## 4. ARCHITECTURE

### Whole-system diagram

```text
User
  |
  v
Browser: React + Zustand + CSS
  |------------------------------|
  |                              |
  | local SunCalc/Luxon           | HTTP /api/v1 (search/save and optional old analysis)
  |                              v
  |                         Vite proxy in dev
  |                              |
  |                         Express backend
  |                              |
  |                    MySQL pool + cache tables
  |
  |-- Globe/3D Map --> Cesium viewer --> Cesium World Terrain
  |                                  --> ArcGIS World Imagery
  |                                  --> Cesium ion 3D Tiles asset 96188
  |
  |-- Sky ----------> React Three Fiber/WebGL scene
  |
  |-- Shadows ------> Web Worker
                         |-- OPFS tile files
                         |-- AWS Terrarium PNG tiles
                         v
                       Float32 DEM
                         |
                         v
                       WebGPU
                         |-- compute shader: shadow mask
                         `-- render shader: terrain color + shadow mask
```

The browser composition and lazy mode selection are in [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`; API proxy is in [`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), `server.proxy`; backend composition is in [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), `app`.

### Separation rules

- Solar truth for the active frontend is local: components go through `solarAdapter`, which wraps `SolarEngine` and SunCalc ([`frontend/src/solar/solarAdapter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/solarAdapter.js), `solarAdapter`; [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `SolarEngine`).
- Globe and 3D Map share one Cesium viewer and the same solar timeline; the mode changes camera/building visibility/shadows, not the data model ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), mode effect).
- Sky consumes solar state and does not consume terrain tiles ([`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `SkyDome`).
- Active Shadows consumes the selected latitude/longitude/date and DEM data. It does not use Cesium buildings, ArcGIS imagery, or Open-Meteo weather data ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ShadowsView`; [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), worker).
- The backend stores locations, terrain metadata, solar sessions/results, analyses, and API cache, but the active Shadows view does not write analysis records ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), table creation; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), imports/effects).
- The old `EngineTest` crosses frontend tile fetch, backend analysis, old `ShadowCompute`, and backend result submission, but it is not rendered from `App` [NOT IMPLEMENTED as the current default flow] ([`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx), `EngineTest`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), rendered components).

### Folder structure

```text
/
├─ package.json                 Workspace scripts for frontend/backend
├─ README.md                    Generic template README; not a project architecture guide
├─ PROJECT_DOCUMENTATION.md     This audit
├─ frontend/                    Vite React application
│  ├─ src/App.jsx               App boot, lazy renderers, global layout
│  ├─ src/main.jsx              React entry point
│  ├─ src/index.css             Design tokens, utility CSS, global layout
│  ├─ src/components/           Header, search, date, timeline, data/loading panels
│  ├─ src/store/                Zustand solar/location/view store
│  ├─ src/solar/                Solar adapter and Sun vector conversion
│  ├─ src/engine/                Solar, DEM, legacy WebGPU and data helpers
│  ├─ src/globe/                 Cesium setup and viewer component
│  ├─ src/scene/                 React Three Fiber sky scene and active Shadows UI
│  ├─ src/shadows/               Active TypeScript worker/DEM/WebGPU implementation
│  ├─ src/lib/                   API client and CSS/class/time formatting helpers
│  ├─ public/cesium/             Static Cesium runtime assets
│  ├─ scripts/                   Shadow regression helper
│  └─ test-*.mjs                 Puppeteer/manual browser scripts
├─ backend/                      MySQL-backed Express API
│  └─ src/                      App, server, routes, controllers, services, models
├─ api/                          Separate lightweight API on port 4000
├─ database/                     MySQL Docker compose and legacy schema.sql
└─ uploads/dems/                 Backend local DEM upload destination
```

The listed purpose follows the imports and files in the folders, especially [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), and [`database/docker-compose.yml`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/docker-compose.yml).

## 5. FRONTEND IN DETAIL

### Component inventory

| Component/file | Purpose, props, state, mode |
|---|---|
| [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App` | No props. Local state: `appReady`, `gpuChecked`, `loadProgress`, `loadMessage`. Reads `gpuAvailable` and `viewMode`; writes GPU availability. Renders all global UI and conditionally renders four modes. |
| [`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx), `Header` | No props. Reads location/date/timezone/view mode; writes search/date modal flags and `viewMode`. Header, selector, location/date controls for every mode. |
| [`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `LocationSearch` | No props. Local `query`, `results`, `isLoading`; reads modal state and writes location/modal state. Debounces by 300 ms, calls Open-Meteo through backend client, and attempts to save selection. |
| [`frontend/src/components/DateSelector.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/DateSelector.jsx), `DateSelector` | No props. Reads date/modal state; writes date/modal state. Uses `react-day-picker` plus previous/today/next controls. |
| [`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx), `SolarTimeline` | No props. Reads sun times, arc, fraction, date, timezone; writes time fraction. SVG curve, animated marker, native range input, keyboard controls. |
| [`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx), `SunData` | No props. Reads latitude/longitude/daylight/mode. Subscribes directly to `sunPosition` and updates altitude/azimuth DOM refs; hidden in Shadows. |
| [`frontend/src/components/LoadingScreen.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LoadingScreen.jsx), `LoadingScreen` | Props `progress`, `message`; visual boot progress. |
| [`frontend/src/components/WebGPUUnsupported.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/WebGPUUnsupported.jsx), `WebGPUUnsupported` | No props; displays browser guidance if the app detects no WebGPU while Shadows is selected. |
| [`frontend/src/components/DEMUploader.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/DEMUploader.jsx), `DEMUploader` | No props. Reads/writes `demData` and loading state; handles `.tif`/`.tiff` via `DEMLoader`. It is not rendered from `App`, so this uploader is currently disconnected [NOT IMPLEMENTED as active UI] ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), children). |
| [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `CesiumView` | No props. Reads mode, location, terminator, date, time ref. Owns Cesium viewer, marker, terminator, camera, buildings, clock and cleanup. Globe and 3D Map. |
| [`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `HeliosScene` | No props. Reads mode; creates R3F WebGL canvas and mounts sky scene children. Sky only. |
| [`frontend/src/scene/SceneCamera.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SceneCamera.jsx), `SceneCamera` | No props. Reads mode; configures Drei camera controls and sky target. |
| [`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx), `Sun` | No props. Reads `_sunPosRef` per animation frame; moves Sun mesh/light and changes light color/intensity. Sky. |
| [`frontend/src/scene/SolarArc.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SolarArc.jsx), `SolarArc` | Reads sampled arc points and renders a Drei dashed line. Sky. |
| [`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `SkyDome` | Reads sun altitude, selects night/twilight/day colors, updates custom GLSL uniforms, and optionally renders stars/ambient light. Sky. |
| [`frontend/src/scene/CompassRose.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/CompassRose.jsx), `CompassRose` | Static N/S/E/W meshes and Drei HTML labels. Sky. |
| [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ShadowsView` | Reads location/date/sun position/mode; owns WebGPU renderer, DEM hook, manual DEM, camera and recompute flag. Shadows. |

### State management

The single Zustand store is [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), created by `create(subscribeWithSelector(...))`.

| Store group | Fields/actions | Main consumers |
|---|---|---|
| Location | `latitude`, `longitude`, `locationName`, `timezone`, `setLocation` | Header, LocationSearch, SunData, CesiumView, ShadowsView |
| Time | `date`, `timeOfDay`, `setDate`, `setTimeOfDay` | Header, DateSelector, SolarTimeline, CesiumView, ShadowsView |
| Solar | `sunPosition`, `sunTimes`, `daylightDuration`, `solarArcPoints`, `terminatorCoords` | SunData, timeline, CesiumView, Sky components |
| View/UI | `viewMode`, `isSearchOpen`, `isDatePickerOpen`, setters | App, Header, modal components, each renderer |
| Engine | `demData`, `gpuAvailable`, `isLoading`, `loadingMessage`, `computeTimeMs`, `isComputing`, setters | App, disconnected DEMUploader, legacy engine test |
| Performance refs | `_sunPosRef`, `_cameraRef`, `_timeRef` | Sun, CesiumView, timeline/store updates |

`setLocation`, `setDate`, and `setTimeOfDay` recalculate solar data through `getInitialSolarState`, which uses Luxon to establish start-of-day in the target timezone ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `getInitialSolarState`, `setLocation`, `setDate`, `setTimeOfDay`).

### Web Workers

The active worker is [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), launched by [`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), `useDem`. The main thread sends `{ type: 'fetch', lat, lng, zoom, gridSize, id }`. The worker returns progress messages, or a transferable `Float32Array` buffer plus `gridSize`, `gridScale`, min/max heights, and center coordinates. The hook ignores stale request IDs and terminates the worker on unmount.

An older non-worker data path exists in [`frontend/src/engine/data/TileFetcher.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/data/TileFetcher.js), [`frontend/src/engine/data/DemDecoder.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/data/DemDecoder.js), and [`frontend/src/engine/data/OPFSCache.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/data/OPFSCache.js). It is used by `EngineTest`, not by `ShadowsView` [NOT IMPLEMENTED as the current Shadows data path].

### Rendering pipelines

**Cesium.** `CesiumView` dynamically imports Cesium, sets `window.CESIUM_BASE_URL`, constructs a viewer with World Terrain and ArcGIS imagery, enables globe lighting and terrain shadows, loads ion asset 96188 for buildings, creates a location entity and terminator polyline, and updates the clock in `scene.preRender` ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`, `CesiumView`, `flyTo3DMap`, `flyToGlobe`).

**React Three Fiber.** `HeliosScene` creates a WebGL canvas; `SceneCamera` supplies controls; `Sun`, `SolarArc`, `SkyDome`, and `CompassRose` form the scene; `EffectComposer` applies Bloom and Vignette ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx), `HeliosScene`; child files).

**WebGPU.** `ShadowGpuRenderer` configures a WebGPU canvas, stores the DEM in a storage buffer, writes compute parameters, dispatches `1024/8 × 1024/8` workgroups, then renders `6 × (1024-1)²` triangle vertices as a terrain mesh using the shadow texture ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), constructor, `render`).

### UI behaviors, fallbacks, loading, errors

- Boot progress displays GPU detection and calibration messages ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `boot`; [`frontend/src/components/LoadingScreen.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LoadingScreen.jsx), `LoadingScreen`).
- Search waits 300 ms after typing, shows “Searching…”, “No locations found”, and logs failures ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `useEffect`).
- Saving a selected location is best-effort: a failed backend save is warned but does not undo local state ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `handleSelect`).
- Timeline keyboard shortcuts are Arrow Left/Right ±1 minute, Shift ±15 minutes, Home sunrise, End sunset ([`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx), `handleKeyDown`).
- Cesium respects `prefers-reduced-motion` for camera flights ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `flyTo3DMap`, `flyToGlobe`).
- Shadows shows tile progress, “from cache”/“live fetch”, automatic-fetch failure, manual GeoTIFF upload, GPU error text, and a terrain camera reset ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `LoadingOverlay`, `ManualUploadFallback`, status panel).
- The app renders `WebGPUUnsupported` for `gpuChecked && !gpuAvailable && viewMode === 'shadows'`, while `ShadowsView` also has its own GPU error panel ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), fallback; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `gpuError`). Duplicate fallback surfaces are present.

## 6. CORE LOGIC AND ALGORITHMS

### Sun position and vector

1. `SolarEngine.getSunPosition` calls `SunCalc.getPosition(date, lat, lng)` ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getSunPosition`).
2. SunCalc’s returned altitude and azimuth are treated as radians, converted to degrees. The code documents the source convention as azimuth `0=South`, positive west, then converts to `0=North`, clockwise with `((azimuthDegrees + 180) % 360)` ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getSunPosition`).
3. `sunVector` converts altitude `a` and north-clockwise azimuth `z` to a local East/North/Up unit vector: `east = cos(a)sin(z)`, `north = cos(a)cos(z)`, `up = sin(a)` ([`frontend/src/solar/sunVector.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/sunVector.js), `sunVector`).
4. The Sky scene maps this local vector to Three.js coordinates `(x, y, z) = (east, up, -north)` and scales it by 180 ([`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx), `useFrame`; [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getSolarArcPoints`).
5. The active Shadows view builds `[east, up, south]` as `[cos(alt)sin(az), sin(alt), -cos(alt)cos(az)]`, because its grid Y increases south ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `sunDirection`; [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), ray coordinate comments).

### Timezone handling

`getInitialSolarState` makes a Luxon `DateTime` from the JavaScript date, sets the requested IANA timezone, takes `startOf('day')`, then adds `timeOfDay * 86,400,000` milliseconds before calling solar functions ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `getInitialSolarState`). The timeline formats labels with `toLocaleTimeString` and the selected timezone ([`frontend/src/lib/utils.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/utils.js), `formatTime`). DST edge handling is partly intended by Luxon, but the timeline’s `timeOfDayToDate` first uses local `setHours(0,0,0,0)` and then formats with a timezone, so exact DST behavior is [UNSURE] ([`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx), `timeOfDayToDate`).

### Solar arc and terminator

`getSolarArcPoints` samples midnight through the next 24 hours at `segments + 1` points, obtains Sun position/vector, maps to a radius-50 local 3D path, and stores altitude/azimuth/time ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getSolarArcPoints`). The initial store uses 96 segments ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `getInitialSolarState`).

`getDayNightTerminator` estimates latitude at solar altitude zero for each longitude using a Spencer declination approximation documented as ±0.3 degrees, then returns GeoJSON-style `[longitude, latitude]` pairs ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getDayNightTerminator`, `_getSunDeclination`). It is drawn as a Cesium glowing polyline ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), terminator effect).

### Active shadow pipeline

1. `useDem` creates one module Web Worker when Shadows becomes enabled and sends latitude, longitude, zoom 12, grid size 1024, and a request ID ([`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), `startFetch`).
2. The worker converts longitude/latitude to Web Mercator tile coordinates. `x = floor(((lng+180)/360) * 2^z)` and `y = floor((1 - asinh(tan(latRadians))/π)/2 * 2^z)` ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `longitudeToTile`, `latitudeToTile`).
3. It requests a 4×4 neighborhood of 256×256 PNG tiles from `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/z/x/y.png`, wrapping X at the antimeridian ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `fetchTileBlob`, `wrapX`, message handler).
4. It reads/writes tile bytes in a per-origin OPFS directory `helios-dem-cache`, with network fallback when OPFS is unavailable or a file is missing ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `getOpfsDir`, `readFromOpfs`, `writeToOpfs`, `fetchTileBlob`).
5. It decodes each Terrarium RGB pixel with `heightMeters = (R * 256 + G + B / 256) - 32768`, stitches all 16 tiles to an OffscreenCanvas, and transfers a `Float32Array` buffer zero-copy to the main thread ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), result loop and `postMessage`; [`frontend/src/shadows/dem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.ts), `fetchDEM` contains the same formula).
6. Ground sample spacing is `156543.03 * cos(latitude) / 2^zoom` metres per sample ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `gridScale`; [`frontend/src/shadows/dem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.ts), returned `gridScale`).
7. `ShadowGpuRenderer` writes the DEM to a storage buffer and compute parameters `{sunDirection, gridScale, mapSize}` to a 48-byte uniform buffer ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), constructor, `render`).
8. The active shader `shadow.wgsl` uses `@workgroup_size(8, 8)`. It starts each ray at one `gridScale` from the source cell, uses that as the initial stride, allows at most 192 steps, advances X by `sunDirection.x * distance / gridScale`, Y by `sunDirection.z * distance / gridScale`, and ray height by `sunDirection.y * distance` ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`).
9. At every step it samples nearest-neighbor elevation using integer coordinates. If terrain elevation is above ray height, the cell becomes shadowed (`lit = 0`); otherwise the stride increases by `1.035`. A below-horizon Sun sets the whole cell to shadowed ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`).
10. The shader stores 0/1 into an `rgba8unorm` storage texture. The render shader samples that texture, computes elevation color, slope factor, fixed diffuse lighting, sky ambient, and blends shadow and lit colors ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainWgsl`, `terrainFragment`).
11. The active path renders the result directly to the WebGPU canvas; it does not read the shadow texture back to JavaScript ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `render`).

An older shader at [`frontend/src/engine/webgpu/shaders/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/shaders/shadow.wgsl), entry `main`, uses 16×16 workgroups, a storage float shadow buffer, `maxSteps` from the caller, unit-cell stepping, and CPU readback in `ShadowCompute`. It is a separate legacy/test pipeline and not mounted by `App` [NOT IMPLEMENTED as the current Shadows renderer] ([`frontend/src/engine/webgpu/ShadowCompute.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/ShadowCompute.js), `compute`; [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx), `EngineTest`).

### Terrain coloring and lighting

The active render shader normalizes elevation within local DEM min/max, blends vegetation/soil, rock, lighter rock, and snow colors with smooth remapping, calculates a normal from neighboring height samples, applies slope shading, fixed directional diffuse, and sky ambient, then mixes a dim shadow color with a lit color ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `elevationColor`, `terrainVertex`, `terrainFragment`).

The Sky scene uses Sun altitude thresholds: below -6° night, -6° to 0° twilight, and at/above 0° daytime; it interpolates predefined colors and changes star count from 2,000 to 6,000 ([`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx), `SkyDome`).

### Performance work

- Search debouncing: 300 ms timeout ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), query effect).
- High-frequency timeline/Sky updates use `_timeRef` and `_sunPosRef` to avoid unnecessary React work; `SunData` subscribes to only `sunPosition` and writes refs ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setTimeOfDay`; [`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx), subscription).
- Web Worker keeps tile decode/stitching off the main thread and transfers the float buffer ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), result `postMessage`).
- OPFS caches raw tile bytes; request IDs ignore stale location results ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), OPFS helpers; [`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), `requestIdRef`).
- Vite manually chunks Three, Cesium, solar, motion, and UI vendor groups ([`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), `build.rollupOptions.output.manualChunks`).
- GPU buffers/textures are reused by `ShadowGpuRenderer`; a depth texture is created per render and is not explicitly destroyed [UNSURE impact] ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `render`).

## 7. EXTERNAL APIs AND DATA SOURCES

| Name | URL/endpoint | Provides | Key needed | Limits | Called where | Failure behavior |
|---|---|---|---|---|---|---|
| Open-Meteo Geocoding | `https://geocoding-api.open-meteo.com/v1/search?name=...&count=10...` | Search results with name, coordinates, timezone, country | No key in code | Provider limit not declared; **UNSURE** | [`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js), `searchLocation` | Backend maps HTTP errors to `OPEN_METEO_ERROR`, other failures to `EXTERNAL_API_UNAVAILABLE`; search UI logs error and stops loading ([`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js); [`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx)). |
| AWS Terrarium | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | RGB elevation tiles | No key in code | Provider limit not declared; 16 tiles per active request | [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `fetchTileBlob` | Non-OK response throws; hook shows error/manual upload fallback; OPFS failures fall back to live fetch. |
| Cesium World Terrain | Cesium provider `C.Terrain.fromWorldTerrain()` | Global terrain | `VITE_CESIUM_TOKEN` conditionally assigned to Cesium Ion | Cesium service limits/terms not in repository [UNSURE] | [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `viewerOptions` | Viewer initialization catches/logs failure; exact visual fallback is Cesium’s behavior [UNSURE]. |
| Cesium ion 3D Tiles | `C.Cesium3DTileset.fromIonAssetId(96188)` | 3D building tiles | Token/access may be needed; exact current rule [UNSURE] | Not declared | [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `CesiumView` | Caught and logged; buildings remain null/hidden. |
| ArcGIS World Imagery | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer` | Satellite imagery | No key in code | Service limits/attribution requirements not specified in repo [UNSURE] | [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `ArcGisMapServerImageryProvider.fromUrl` | Cesium provider/viewer failure is caught in initialization. |
| Google Fonts | `fonts.googleapis.com` and `fonts.gstatic.com` links | Playfair Display, Inter, JetBrains Mono | No key | Not declared | [`frontend/index.html`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/index.html), `<link>` tags | Browser font fallback from CSS (`system-ui`, `ui-monospace`, `serif`) ([`frontend/src/index.css`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/index.css), font variables). |
| Separate API Open-Meteo | Same geocoding endpoint | Location search | No key | Not declared | [`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js), `/api/location/search` | Returns HTTP 500 JSON error. |

The repository contains no active Open-Meteo weather forecast call; `backend/src/integrations/openMeteo.js` only calls geocoding. Weather data is therefore [NOT IMPLEMENTED] in the current UI.

## 8. BACKEND

### Required or optional

The backend is optional for the primary visual modes. The frontend’s `apiClient` uses `/api/v1`, and only `LocationSearch` actively calls location search/create in the default component tree ([`frontend/src/lib/apiClient.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/apiClient.js), `apiClient`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`). If the backend is off, typed search fails and is logged, popular locations still work locally, local solar calculations still work, Globe/Sky can render if their own external services work, and saving a location is warned/skipped ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `handleSelect`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setLocation`).

The active WebGPU Shadows mode does not require the backend; it fetches Terrarium directly and computes locally ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), imports/effects).

### Backend routes

The production backend app mounts versioned routers under `/api/v1` and defines `/api/health` directly ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), route mounting).

| Method | Path | Request | Response/action | File |
|---|---|---|---|---|
| GET | `/api/health` | None | `{success:true,status:'UP',timestamp}` without checking DB | [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), health route |
| GET | `/api/v1/locations/search?q=` | Query `q` | Open-Meteo results wrapped in `{success,data}`; cached for 30 days | [`backend/src/routes/v1/locations.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/routes/v1/locations.js); [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js), `search` |
| POST | `/api/v1/locations` | JSON `name, latitude, longitude`, optional country/region/timezone/elevation | Inserts location and returns 201 record | `locationController.createLocation` in [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js) |
| GET | `/api/v1/locations` | None | All locations ordered newest first | `getLocations` in [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js) |
| GET | `/api/v1/locations/:id` | Path ID | One location or 404 | `getLocationById` in [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js) |
| DELETE | `/api/v1/locations/:id` | Path ID | Deletes one location or 404 | `deleteLocation` in [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js) |
| GET | `/api/v1/solar/day` | `lat, lon, date, time`, optional `location_id, timezone` | Calculates solar data; optionally writes `solar_sessions` and `solar_results` | [`backend/src/routes/v1/solar.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/routes/v1/solar.js); [`backend/src/controllers/solarController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/solarController.js), `getSolarDay` |
| GET | `/api/v1/earth/imagery` and `/api/v1/earth/layers` | None | Static NASA GIBS layer metadata | [`backend/src/controllers/earthController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/earthController.js), `getImageryLayers` |
| GET | `/api/v1/terrain/sources` | None | Static USGS/AWS/SRTM source list | [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js), `getSources` |
| POST | `/api/v1/terrain/register` | JSON name/file metadata | Inserts external terrain dataset metadata | `registerTerrain` in [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js) |
| POST | `/api/v1/terrain/upload` | Multipart `dem_file`, metadata; 100 MB max | Stores local DEM under `uploads/dems`, inserts metadata | [`backend/src/routes/v1/terrain.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/routes/v1/terrain.js), Multer; [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js), `uploadTerrain` |
| GET | `/api/v1/terrain/:id` and `/metadata` | Path ID | Terrain metadata | `getTerrainById` in [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js) |
| DELETE | `/api/v1/terrain/:id` | Path ID | Deletes metadata and local file for local uploads | `deleteTerrain` in [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js) |
| POST | `/api/v1/analysis` | JSON latitude/longitude/date/time/optional terrainId | Creates temporary location, solar session/result, analysis session with `ready` status | [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js), `createAnalysis` |
| GET | `/api/v1/analysis/:id/status` | Path ID | Analysis status/timestamps | `getAnalysisStatus` in [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js) |
| POST | `/api/v1/analysis/:id/result` | JSON compute time, shadow reference, metadata | Saves result reference and marks analysis completed | `submitAnalysisResult` in [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js) |
| GET | `/api/v1/analysis/:id/result` | Path ID | Returns stored result joined to session | `getAnalysisResult` in [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js) |

There is a separate non-versioned API in [`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js): `/api/health`, `/api/location/search`, `/api/solar/position`, and `/api/solar/daylight`. It does not use MySQL and is not the target of the Vite `/api` proxy, which points to port 3000 ([`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), `server.proxy`; [`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js), `PORT`).

### Middleware, error handling, cache, environment, run

- Helmet, CORS allow-list, JSON/urlencoded parsing, Morgan logging, API rate limiter, static `/uploads`, routers, 404 handler, and global error handler are ordered in [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), `app`.
- `/api` is limited to 100 requests per IP per 15 minutes; an additional 20/minute limiter exists but is not mounted in `app` [UNSURE/intended future use] ([`backend/src/middleware/rateLimiter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/rateLimiter.js), `apiLimiter`, `externalApiLimiter`).
- `AppError`, Zod errors, and unexpected errors receive structured JSON; unexpected stack traces are not sent to clients ([`backend/src/middleware/errorHandler.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/errorHandler.js), `errorHandler`).
- Open-Meteo search uses MySQL `api_cache` with a 30-day TTL; cache read/write errors are logged and treated as cache misses ([`backend/src/services/cacheService.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/services/cacheService.js), `get`, `set`; [`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js), `searchLocation`).
- Backend environment names used are `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`; no backend `.env.example` exists in the inspected backend directory [UNSURE whether deployment supplies them externally] ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js), `PORT`; [`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js), pool; [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), `initDB`).
- Run with `npm run start` in `backend` or `npm run dev` with nodemon ([`backend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/package.json), scripts). The server initializes MySQL before listening ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js), `startServer`).

## 9. DATABASE

### Engine and connection

The backend uses MySQL through a `mysql2/promise` pool with a maximum of 10 connections ([`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js), `pool`). Startup creates the configured database and eight tables if absent ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), `initDB`).

### Tables created at backend startup

| Table | Columns and types | Keys/relationships | Writes and reads |
|---|---|---|---|
| `locations` | `id VARCHAR(36)`, `name VARCHAR(255)`, `latitude DECIMAL(10,8)`, `longitude DECIMAL(11,8)`, `country VARCHAR(255)`, `region VARCHAR(255)`, `timezone VARCHAR(100)`, `elevation FLOAT`, created/updated timestamps | PK `id` | Location controller create/list/get/delete; analysis creates temporary location ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js); [`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js); [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js)). |
| `terrain_datasets` | UUID-like `id`, name/source/format strings, bounding DECIMALs, resolution FLOAT, file path TEXT, metadata JSON, timestamps | PK `id` | Terrain register/upload/get/delete ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js); [`backend/src/controllers/terrainController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/terrainController.js)). |
| `solar_sessions` | `id`, nullable `location_id`, `date DATE`, `time TIME`, `timezone`, timestamp | PK `id`; FK location `ON DELETE SET NULL` | Solar day/analysis session creation ([`backend/src/controllers/solarController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/solarController.js); [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js)). |
| `solar_results` | `id`, required `session_id`, altitude/azimuth FLOATs, sunrise/noon/sunset DATETIME, daylight INT, vector x/y/z FLOAT, timestamp | PK `id`; FK session `ON DELETE CASCADE` | Stores backend solar result when location/session persistence is requested ([`backend/src/controllers/solarController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/solarController.js), `getSolarDay`). |
| `analysis_sessions` | `id`, location/terrain IDs, date/time, status, created/completed timestamps | PK `id`; location and terrain FKs `ON DELETE SET NULL` | Created as `ready`; queried for status; marked completed after result ([`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js), all analysis methods). |
| `analysis_results` | `id`, required analysis ID, shadow/sunlight references TEXT, compute time INT, metadata JSON, timestamp | PK `id`; FK analysis `ON DELETE CASCADE` | Stores references/metadata, not the actual active WebGPU texture ([`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js), `submitAnalysisResult`). |
| `api_cache` | `id`, provider, unique cache key, response JSON, expiry, timestamp | PK `id`; unique `cache_key` | Open-Meteo search response cache ([`backend/src/services/cacheService.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/services/cacheService.js), `get`, `set`). |
| `engine_runs` | `id`, nullable analysis ID, client agent, duration, success BOOLEAN, error message, timestamp | PK `id`; FK analysis `ON DELETE SET NULL` | Table is created, but no inspected controller writes it [NOT IMPLEMENTED as active audit logging] ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), table DDL). |

The checked-in [`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql) is a different, older schema: it defines only `locations` with integer auto-increment `id`, `name`, `country(2)`, `lat`, `lng`, `tz`, and `created_at`. It does not match the runtime `initDB` schema, which means Docker initialization from `schema.sql` and backend startup can disagree [UNSURE which is used in deployment] ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), DDL).

### ER diagram

```text
locations 1 ─────< solar_sessions 1 ─────< solar_results
    │                    │
    │                    └────< analysis_sessions 1 ─────< analysis_results
    │                                  │
    └──────────────────────────────────┘
terrain_datasets 1 ───< analysis_sessions
analysis_sessions 1 ──< engine_runs
api_cache is independent
```

Foreign-key actions and table definitions are in [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), `queries`.

### Example rows and DB-down behavior

An ordinary saved location resembles `{id: UUID, name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo", ...}` because `LocationSearch.handleSelect` posts those fields ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `handleSelect`). An analysis creates a synthetic name such as `Analysis @ 30.1000,78.2900` ([`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js), `createAnalysis`).

If MySQL is down, backend startup exits after `initDB` fails; if it goes down during requests, controller errors reach the global 500 handler, while cache failures degrade to cache misses ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js), `startServer`; [`backend/src/middleware/errorHandler.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/errorHandler.js), `errorHandler`; [`backend/src/services/cacheService.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/services/cacheService.js), catches).

## 10. DATA FLOW

### (a) User searches for a city

1. User opens Header’s search button, which sets `isSearchOpen` ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx), search button; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setSearchOpen`).
2. `LocationSearch` updates local `query`; after 300 ms it calls `apiClient.locations.search` ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), query effect).
3. `apiClient` requests `/api/v1/locations/search?q=...`; Vite proxies `/api` to `http://localhost:3000` in development ([`frontend/src/lib/apiClient.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/apiClient.js), `fetchAPI`, `locations.search`; [`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), proxy).
4. `locationController.search` validates `q`, calls `openMeteo.searchLocation`, checks `api_cache`, then calls Open-Meteo if uncached ([`backend/src/controllers/locationController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/locationController.js), `search`; [`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js), `searchLocation`).
5. Results return through `{success,data}`; the component maps them to `name/lat/lng/tz` and displays them ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `formatted`).
6. Selection calls `setLocation`, which recalculates all solar state locally; then it attempts `POST /api/v1/locations` without blocking the UI ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `handleSelect`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setLocation`).

### (b) User drags the timeline

1. The invisible native range input receives pointer/touch input and calls `setTimeOfDay(parseFloat(value))` ([`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx), range input).
2. The store writes `_timeRef`, recalculates Sun position, event times, daylight, arc, and terminator, and writes `_sunPosRef` ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setTimeOfDay`; `getInitialSolarState`).
3. SunData’s subscription updates altitude/azimuth text; SolarTimeline animates the marker; Sky reads `_sunPosRef` each frame; Cesium’s pre-render listener updates `viewer.clock.currentTime` ([`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx), subscription; [`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx), `useFrame`; [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), pre-render listener).
4. In Shadows, the changed `sunPosition` recomputes `sunDirection`, marks `recomputeRef`, and the render effect dispatches a new compute pass on the existing DEM ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `sunDirection` and render effect).

### (c) User switches to Shadows and computes a location’s shadows

1. Header writes `viewMode='shadows'`; App lazy-renders `ShadowsView` ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx), `setViewMode`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), conditional render).
2. `useDem` starts/reuses `dem.worker.ts` and posts location, zoom 12, 1024 grid, and request ID ([`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), `startFetch`).
3. Worker checks OPFS, fetches up to 16 AWS tiles, reports progress, decodes RGB, stitches, computes grid scale/min/max, and transfers the float buffer ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), message handler).
4. `useDem` creates `DemData`; `ShadowsView` sends it to `ShadowGpuRenderer.setDem` ([`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts), result handler; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), DEM effect).
5. WebGPU initialization obtains an adapter/device; `render` writes the Sun direction and view-projection matrix, dispatches the compute shader, then renders the terrain ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `getGpuDevice`, `ShadowGpuRenderer.render`).
6. WGSL ray-marches terrain and writes the mask; the render fragment shader colors the terrain using the mask ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainFragment`).
7. No active backend analysis session is created or result uploaded. That network path exists only in unmounted `EngineTest` [NOT IMPLEMENTED as current flow] ([`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx), `runTest`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), component tree).

### (d) User opens 3D Map

1. Header writes `viewMode='map3d'`; App renders `CesiumView` because the condition includes Globe and Map3D ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx), `setViewMode`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), viewport).
2. If no viewer exists, `loadCesium` sets the Cesium base URL, imports Cesium, optionally assigns the token, constructs World Terrain and ArcGIS imagery, and creates the viewer ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`, initialization effect).
3. It attempts to load ion building asset 96188 and hides it until Map3D mode; failures are caught ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), building load block).
4. Mode synchronization shows buildings, keeps the globe visible, enables viewer shadows, and calls `flyTo3DMap` to the selected location ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), mode effect, `flyTo3DMap`).

## 11. CONFIGURATION AND SETUP

### Environment variables (names only)

- Frontend: `VITE_CESIUM_TOKEN` ([`frontend/.env.example`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/.env.example)).
- Separate API: `PORT`, `CORS_ORIGIN` ([`api/.env.example`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/.env.example); [`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js)).
- Backend: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js); [`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js)).

### Install and run

```bash
npm install
npm run dev                 # workspace root; runs available frontend/backend dev scripts
npm run build               # root; builds frontend

cd frontend
npm run dev
npm run build
npm run preview
npm run lint

cd backend
npm install
npm run start
npm run dev

cd api
npm install
npm run start
npm run dev
```

These commands come from the root, frontend, backend, and API package manifests ([`package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/package.json); [`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json); [`backend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/package.json); [`api/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/package.json)).

### Database setup

```bash
cd database
docker compose up -d
```

This starts MySQL 8.0 on host port 3306 with a root password and mounts `schema.sql` as an initialization script ([`database/docker-compose.yml`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/docker-compose.yml)). The runtime backend expects the richer `initDB` schema, so this Docker route should be reconciled before relying on it ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).

### Build/deploy and browser requirements

Frontend deployment is configured as a Vercel SPA rewrite to `/index.html` ([`frontend/vercel.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vercel.json)). The build output is `frontend/dist` according to Vite configuration ([`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), `build.outDir`). A backend hosting configuration is absent [UNSURE].

The configured Babel target is the last two Chrome, Firefox, and Safari versions ([`frontend/vite.config.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/vite.config.js), React `targets`). Shadows additionally needs a browser/device exposing `navigator.gpu`, `GPUCanvasContext`, WebGPU storage textures, and OffscreenCanvas/createImageBitmap; the fallback text names Chrome/Edge 113+, Safari 18+, and Firefox Nightly with a flag ([`frontend/src/components/WebGPUUnsupported.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/WebGPUUnsupported.jsx), `WebGPUUnsupported`). Hardware limits are not checked beyond adapter availability ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `getGpuDevice`).

Cesium token handling is conditional: the frontend reads `VITE_CESIUM_TOKEN` and assigns it to `CesiumModule.Ion.defaultAccessToken` only when non-empty ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`). The token should be a restricted public browser token; exact allowed origins/quotas are not encoded in this repository [UNSURE].

## 12. SECURITY, PRIVACY AND COST

- The only explicitly named frontend secret-like value is `VITE_CESIUM_TOKEN`; because Vite embeds `VITE_*` values into browser code, it must not be treated as a server secret ([`frontend/.env.example`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/.env.example); [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `loadCesium`).
- Backend DB credentials are read from server environment variables and are not sent by the frontend ([`backend/src/config/db.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/config/db.js), pool).
- API CORS in the backend is an explicit localhost/Vercel allow-list and credentials are enabled ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), CORS middleware). The separate API defaults to `CORS_ORIGIN || true`, which is broad when unset ([`api/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/api/server.js), CORS).
- User-selected location queries go to the backend and then Open-Meteo; saved locations go to MySQL. Active DEM tile fetching, decoding, and shadow calculation happen in the browser; the worker’s OPFS cache is local to the browser origin ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), calls; [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), OPFS/fetch).
- The backend uses parameterized MySQL values for ordinary controller queries, but `initDB` interpolates `DB_NAME` into DDL after reading it from environment; deployment should restrict that variable ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js), `initDB`; parameterized controller queries).
- Helmet, rate limiting, structured errors, and no stack traces in responses are implemented ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js); [`backend/src/middleware/rateLimiter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/rateLimiter.js); [`backend/src/middleware/errorHandler.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/errorHandler.js)).
- Free-tier limits, current pricing, service quotas, and precise licensing obligations are not documented in the repository [UNSURE]. External attribution/credits are partly preserved with Cesium’s credit option, but `creditContainer.style.display = 'none'` also appears in the Cesium setup, so attribution compliance needs review ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), viewer setup). The page includes Cesium widget CSS and `showCreditsOnScreen` for providers, but does not contain a project attribution panel ([`frontend/index.html`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/index.html); [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx)).
- Google Fonts, Cesium, ArcGIS, Open-Meteo, AWS Terrarium, and OSM-derived building data have external terms/attribution requirements that are not copied into this repository [UNSURE]; the building style comments identify the asset as OSM Buildings ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), building style).

## 13. TESTING AND KNOWN ISSUES

### Verification performed in this audit

- Source, configuration, manifests, shader files, test scripts, and database files were read.
- `npm run build` was started from the repository root. Vite reported `vite v7.3.6` and began transforming; it did not finish within the run window and was stopped. Therefore the build is **not certified passing**.
- `npm run lint --workspace=frontend` was started. `npx` attempted to install `eslint@10.13.0`, and the command did not finish within the run window and was stopped. Therefore lint is **not certified passing**.
- Existing browser scripts are manual Puppeteer scripts, not package-script tests. They include `test-all-modes.mjs`, `test-3dmap.mjs`, `test-shadows.mjs`, `test-sky.mjs`, `test-imagery.mjs`, `test-google3d.mjs`, `test-phase5.mjs`, and `test-final.mjs` ([`frontend/test-all-modes.mjs`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/test-all-modes.mjs); [`frontend/test-shadows.mjs`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/test-shadows.mjs)). They were not run in this audit.
- The backend package’s test script intentionally exits with “Error: no test specified” ([`backend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/package.json), `test`), so there is no passing backend test suite to report.

### Known issues and accuracy limits

- The active DEM is a 1024×1024 crop of 16 zoom-12 Terrarium tiles, not a stated SRTM 30 m product. Its actual metre/sample value varies with latitude and is displayed at runtime; buildings are absent from this elevation grid ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `gridScale`; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `activeDem.gridScale`).
- Buildings appear only in Cesium 3D Map; the active WebGPU shadow engine ray-marches terrain heights and cannot cast building shadows ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), building asset; [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), elevation-only input).
- Active shadow rays use nearest-neighbor terrain samples and no bilinear smoothing; a comment in the old shader explicitly calls bilinear interpolation optional and nearest-neighbor faster ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`; [`frontend/src/engine/webgpu/shaders/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/shaders/shadow.wgsl), `getElevation`).
- `ShadowGpuRenderer` uses a fixed diffuse sun vector in the terrain fragment shader for visual coloring while the compute mask uses the selected Sun direction; the visual lighting direction is therefore not fully coupled to the selected direction ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainFragment` and `render`).
- The active shadow renderer does not read its texture back to CPU and does not submit result metadata to the backend ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `render`; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), effects). The old test path does read back and submit a reference ([`frontend/src/engine/webgpu/ShadowCompute.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/ShadowCompute.js), readback; [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx), `submitResult`).
- `DEMUploader` is not mounted in `App`; active manual upload is implemented privately in `ShadowsView` ([`frontend/src/components/DEMUploader.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/DEMUploader.jsx), `DEMUploader`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), component tree; [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `handleManualFile`).
- The frontend store initializes `gpuAvailable` false and only the boot probe changes it; a WebGPU device can still later fail during canvas setup ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `gpuAvailable`; [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `boot`; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `getGpuDevice`).
- The runtime database schema and checked-in Docker schema disagree as described in Section 9 ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js); [`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql)).
- The exact scientific accuracy of SunCalc output, the Spencer terminator approximation, Terrarium coverage/resolution, and Cesium/ArcGIS current service availability were not independently benchmarked in this audit [UNSURE]. The code’s own documented approximation is the Spencer declination error of ±0.3° ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `_getSunDeclination`).

## 14. PLACEMENT PREPARATION KIT

### 30-second pitch

“Helios is a React/Vite browser-based solar observatory. I calculate Sun altitude, azimuth, sunrise and sunset locally with SunCalc, use Cesium for a globe and 3D city view, Three.js for a navigable sky, and WebGPU compute shaders for terrain shadows. The interesting engineering part is a Web Worker that fetches and stitches AWS Terrarium elevation tiles, caches them in OPFS, transfers a 1024×1024 float grid, and ray-marches it on the GPU. The honest limitation is that the active shadow model contains terrain, not buildings, and the backend is optional for the main visualization.” ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js); [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts); [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl)).

### Two-minute pitch

1. Begin with the problem: solar position is hard to explain numerically, and terrain can block sunlight ([`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx); [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx)).
2. Explain the shared model: a Zustand store holds location, timezone, date, time fraction, Sun data, and selected mode ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)).
3. Explain the four renderers: Cesium Globe/3D Map, Three.js Sky, and WebGPU Shadows ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx); [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx); [`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx); [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx)).
4. Explain performance: 300 ms search debounce, worker decoding, OPFS cache, transferable buffer, GPU parallel workgroups, and ref-based timeline updates ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx); [`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts); [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts); [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)).
5. Close with tradeoffs: active shadows are local and backend-independent, but elevation-only and approximate; backend persistence exists but is not wired into the active shadow UI ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx); [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js)).

### Five-minute deep-dive outline

1. Architecture and mode separation: [`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`.
2. Solar coordinate conventions and timezone construction: [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `getSunPosition`; [`frontend/src/solar/sunVector.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/sunVector.js), `sunVector`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `getInitialSolarState`.
3. Data acquisition and cache: [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), worker handler.
4. GPU pipeline and shader: [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `ShadowGpuRenderer`; [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`.
5. Backend boundary and honest limitations: [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js), `app`; [`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js).

### Six resume bullets

1. Built a four-mode React/Vite solar visualization using Zustand, Cesium, React Three Fiber, and WebGPU ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `App`).
2. Implemented SunCalc-based solar position, event, daylight, 96-sample arc, and terminator calculations with local timezone-aware state ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js); [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)).
3. Implemented a Web Worker pipeline that fetches and stitches **16** 256×256 Terrarium tiles into a 1024×1024 elevation grid ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `tileGrid`, `gridSize`).
4. Added OPFS caching and zero-copy transferable `Float32Array` delivery to reduce main-thread blocking ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `writeToOpfs`, result `postMessage`).
5. Wrote a WebGPU 8×8-workgroup ray-marching shader with a 192-step limit and an integrated terrain render pass ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `@workgroup_size`, loop; [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `render`).
6. Built an Express/MySQL backend with location, solar, terrain, analysis, cache, rate limiting, and structured error routes ([`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).

These bullets use only countable values visible in code (16 tiles, 1024 grid, 8×8 workgroups, 192 steps); no runtime performance claim is made because measured output was not obtained.

### Ten hardest technical challenges and solutions

| Challenge | Code-grounded solution |
|---|---|
| Keeping timeline scrubbing responsive | Store mutable time/Sun refs and use direct subscriptions/per-frame reads ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js); [`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx); [`frontend/src/scene/Sun.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/Sun.jsx)). |
| Making solar coordinates consistent | Normalize SunCalc azimuth then explicitly map East/North/Up to renderer coordinates ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js); [`frontend/src/solar/sunVector.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/sunVector.js)). |
| Moving heavy DEM work off the UI thread | Dedicated module worker fetches/decodes/stitches tiles ([`frontend/src/shadows/useDem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/useDem.ts); [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts)). |
| Avoiding repeated elevation downloads | OPFS files keyed by `z_x_y.png` with live-fetch fallback ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), OPFS helpers). |
| Feeding large arrays to WebGPU | Storage buffer write from a transferable `Float32Array` ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `setDem`; [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), transfer list). |
| Parallel terrain shadow testing | One compute invocation per grid cell with 8×8 workgroups and bounded ray loop ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`). |
| Rendering a large terrain mesh | Procedural vertex indexing draws two triangles per DEM cell and computes normals from neighbor heights ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainVertex`, `pass.draw`). |
| Sharing Cesium initialization across modes | One lazy Cesium module/viewer, with mode-specific camera/buildings/shadow toggles ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), initialization/mode effects). |
| Handling backend failure without breaking exploration | Local state is updated before best-effort save; search failures are logged and active rendering remains local ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), `handleSelect`; [`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js), `setLocation`). |

### Twenty-five likely interview questions and honest answers

1. **What is WebGPU?** A browser graphics/compute API used here to run a compute shader and render a terrain canvas; device setup is in [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `getGpuDevice`.
2. **Why a compute shader?** Each terrain cell can test its own Sun ray in parallel; `shadow.wgsl` maps one invocation to one cell ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`).
3. **What is ray marching?** Incrementally sampling along a ray and comparing ray height with terrain height; this is the `for` loop in `main` ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`).
4. **Why cap steps at 192?** To bound GPU work; the active shader uses a fixed `192u` limit ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl), `main`). It is a performance/coverage tradeoff, not a proof of physical completeness.
5. **What is a DEM?** A grid of elevation samples. This project stores it as `Float32Array` data with width, height, scale, min/max, and center ([`frontend/src/shadows/dem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.ts), `DemData`).
6. **How are Terrarium pixels decoded?** `(R*256 + G + B/256) - 32768` metres ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), decode loop).
7. **Why use a Web Worker?** Fetching, image decoding, and stitching are independent of UI rendering ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), worker responsibilities).
8. **What is OPFS?** A browser-origin private filesystem. The worker uses it for raw PNG tile files and falls back to network ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), `getOpfsDir`, `fetchTileBlob`).
9. **What is a transferable?** An `ArrayBuffer` ownership transfer that avoids copying; the worker passes `floats.buffer` in the transfer list ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts), result `postMessage`).
10. **How does state flow?** Components select fields/actions from one Zustand store; `setTimeOfDay` recalculates derived solar state ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)).
11. **Why Zustand instead of Context?** The code uses Zustand selectors and `subscribeWithSelector`, which supports narrow subscriptions/ref updates; the repository does not document a formal comparison ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)). I would describe it as a pragmatic choice, not claim a benchmark.
12. **What does Cesium do?** It supplies the global globe, terrain, imagery, camera, clock, lighting, and optional ion buildings ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `CesiumView`).
13. **What does 3D Map add over Globe?** A tilted 1,200 m camera and visible ion building tiles; it still uses the same Cesium globe ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `flyTo3DMap`, mode effect).
14. **Why Three.js for Sky?** The Sky mode needs a local interactive 3D scene and custom GLSL dome; that is implemented with R3F/Three ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx); [`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx)).
15. **Why not use WebGPU for the Sky?** The repository uses WebGL through R3F for Sky and WebGPU only for active Shadows; a formal comparative evaluation is [NOT IMPLEMENTED] ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx); [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts)).
16. **How is azimuth defined?** The adapter exposes degrees with 0° north clockwise; `sunVector` converts it to East/North/Up ([`frontend/src/solar/sunVector.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/sunVector.js); [`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js)).
17. **How do you handle time zones?** Luxon constructs target-zone start-of-day and the store adds a day fraction; UI formatting also passes the timezone ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js); [`frontend/src/lib/utils.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/lib/utils.js)).
18. **Does the backend compute shadows?** Not in the active flow. The backend has analysis metadata routes, while `ShadowsView` computes locally; only `EngineTest` submits a legacy result ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx); [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx)).
19. **What does the backend store?** Locations, terrain metadata, solar sessions/results, analyses/results, cache, and engine-run table definitions ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).
20. **What happens if MySQL is unavailable?** Startup exits if initialization fails; request errors use the global handler; the UI’s location save is best-effort ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js); [`backend/src/middleware/errorHandler.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/errorHandler.js); [`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx)).
21. **How is API abuse limited?** `/api` has 100 requests per IP per 15 minutes; a stricter limiter exists but is not mounted ([`backend/src/middleware/rateLimiter.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/middleware/rateLimiter.js); [`backend/src/app.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/app.js)).
22. **Why cache in OPFS and not MySQL?** Active Shadows is browser-local and needs tile bytes near the worker; the backend cache is for Open-Meteo search JSON ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts); [`backend/src/services/cacheService.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/services/cacheService.js)).
23. **What is the main accuracy limitation?** It is terrain-only, nearest-neighbor, bounded ray marching at web-map sample spacing; it is an interactive approximation, not a survey tool ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl); [`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts)).
24. **How would you test it?** Run the existing Puppeteer mode scripts and the shadow regression helper, then add deterministic unit tests around vector, tile math, and Terrarium decode; the repository currently has scripts but no configured test runner ([`frontend/test-all-modes.mjs`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/test-all-modes.mjs); [`frontend/scripts/shadowRegression.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/scripts/shadowRegression.js); [`backend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/package.json)).
25. **What would you improve first?** Reconcile database schemas, connect active Shadows to persisted analysis if desired, add tests/CI, and couple terrain lighting to the selected Sun vector ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js); [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts)).

### Ten “why X over Y?” decisions

1. **SunCalc over remote solar API:** local, fast calculation keeps timeline scrubbing independent of network ([`frontend/src/engine/solarEngine.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/solarEngine.js), `SolarEngine`).
2. **Zustand over prop drilling:** shared state is selected directly by many mode components ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js)).
3. **Web Worker over main-thread stitching:** image decode and 16-tile composition are background work ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts)).
4. **OPFS over repeated HTTP:** raw PNG bytes are persisted per browser origin ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts)).
5. **WebGPU over CPU ray marching:** one invocation per cell and workgroup dispatch expose parallel hardware ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts); [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl)).
6. **Cesium over custom globe:** terrain, imagery, camera, and 3D Tiles are supplied as a mature viewer ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx)).
7. **React Three Fiber over imperative Three.js for Sky:** the scene is composed as React components ([`frontend/src/scene/HeliosScene.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/HeliosScene.jsx)).
8. **Direct browser Terrarium fetch over backend proxy:** active Shadows remains usable without backend availability ([`frontend/src/shadows/dem.worker.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.worker.ts); [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx)).
9. **MySQL over browser-only persistence for saved domain records:** backend tables represent locations, sessions, terrain, and results ([`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).
10. **Manual WebGPU terrain shader over a texture-only overlay:** the active renderer draws an elevation mesh and samples the shadow texture per fragment ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainWgsl`).

The repository does not contain design documents proving these were formally compared against alternatives; present them as implementation rationale, not historical facts [UNSURE].

### Honest limitations to admit well

- “The active shadow model is terrain-only; Cesium buildings are visual 3D Map data, not part of the WebGPU DEM” ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx); [`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl)).
- “The ray march is bounded to 192 steps and nearest-neighbor samples, so it is interactive and approximate” ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl)).
- “The active path does not persist a GPU result; the backend analysis path is legacy/unmounted” ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx); [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx)).
- “The runtime and checked-in database schemas need reconciliation” ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).
- “I did not claim a measured FPS or compute time because the verification run did not complete”; the UI has `computeTimeMs` state, but the active renderer does not write it ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js); [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts)).

### Three-minute live demo click order

1. Run the frontend with `npm run dev` from `frontend` ([`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json)).
2. Open `http://localhost:5173/`; wait for “Ready” boot overlay ([`frontend/src/App.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/App.jsx), `boot`; [`frontend/src/components/LoadingScreen.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LoadingScreen.jsx)).
3. In Header, click the location pill, click “Machu Picchu, Peru” from Popular, then close/observe the location marker and updated numbers ([`frontend/src/components/LocationSearch.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/LocationSearch.jsx), popular list/`handleSelect`).
4. Drag the bottom timeline from morning to afternoon; point out altitude, azimuth, daylight, and the Globe terminator/camera clock ([`frontend/src/components/SolarTimeline.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SolarTimeline.jsx); [`frontend/src/components/SunData.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/SunData.jsx)).
5. Click **Sky**; orbit slightly and drag the timeline to show day/twilight/night gradient and Sun arc ([`frontend/src/components/Header.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/Header.jsx); [`frontend/src/scene/SkyDome.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/SkyDome.jsx)).
6. Click **3D Map**; wait for the tilted camera/buildings, explaining that this is Cesium ion 3D Tiles ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx), `flyTo3DMap`, asset load).
7. Click **Shadows**; wait for 16-tile progress and WebGPU render, then drag the terrain and wheel to zoom ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), loading/camera handlers).
8. If WebGPU or external tile access fails, explain the manual GeoTIFF fallback and limitations rather than claiming a successful shadow computation ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx), `ManualUploadFallback`).

## 15. IMPROVEMENT ROADMAP

### Priority 1 — correctness and reproducibility

1. Make `database/schema.sql` match `backend/src/models/init.js`, then test a clean Docker startup and API CRUD flow ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`backend/src/models/init.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/models/init.js)).
2. Add automated unit tests for `sunVector`, SunCalc convention conversion, tile math, Terrarium decode, and shader parameter packing ([`frontend/src/solar/sunVector.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/solar/sunVector.js); [`frontend/src/shadows/dem.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/dem.ts); [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts)).
3. Run the existing Puppeteer scripts in CI against a known browser and record screenshots/console errors ([`frontend/test-all-modes.mjs`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/test-all-modes.mjs)).
4. Fix or remove the two competing shadow pipelines and decide whether the old backend analysis route is current ([`frontend/src/shadows/`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/); [`frontend/src/engine/webgpu/`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/)).

### Priority 2 — product behavior

5. Couple the terrain fragment shader’s diffuse direction to the selected Sun vector rather than its current fixed vector ([`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts), `terrainFragment`).
6. Decide whether to add building footprints/heights to the shadow DEM or clearly label Shadows as terrain-only ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl); [`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx)).
7. If persistence is wanted, wire active `ShadowsView` to create/submit analysis sessions and store a real result reference; otherwise remove misleading unused API surface ([`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx); [`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx); [`backend/src/controllers/analysisController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/analysisController.js)).
8. Mount or remove `DEMUploader`, and standardize the 50 MB UI message versus backend’s 100 MB Multer limit ([`frontend/src/components/DEMUploader.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/components/DEMUploader.jsx); [`backend/src/routes/v1/terrain.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/routes/v1/terrain.js)).

### Priority 3 — operations and compliance

9. Add backend `.env.example`, deployment documentation, health checks that actually check MySQL, and a backend hosting target ([`backend/src/server.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/server.js); [`backend/src/controllers/healthController.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/controllers/healthController.js)).
10. Document and enforce Cesium/ArcGIS/Open-Meteo/AWS/OSM attribution and token restrictions ([`frontend/src/globe/CesiumView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/globe/CesiumView.jsx); [`frontend/index.html`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/index.html)).
11. Measure and publish actual frame time, worker fetch time, GPU compute time, and memory use. Existing `computeTimeMs` is not populated by active Shadows ([`frontend/src/store/useHeliosStore.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/store/useHeliosStore.js); [`frontend/src/scene/ShadowsView.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/scene/ShadowsView.jsx)).

### Not worth doing yet

- Adding more visual polish before database/schema and test reproducibility are fixed ([`database/schema.sql`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/database/schema.sql); [`frontend/package.json`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/package.json)).
- Claiming engineering-grade solar or building-shadow accuracy without higher-quality terrain/building inputs and validation measurements ([`frontend/src/shadows/shadow.wgsl`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/shadow.wgsl)).
- Adding a second external weather provider when no active weather feature consumes the existing Open-Meteo integration ([`backend/src/integrations/openMeteo.js`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/backend/src/integrations/openMeteo.js)).
- Expanding the unused legacy WebGPU engine before deciding which active pipeline to maintain ([`frontend/src/engine/webgpu/EngineTest.jsx`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/engine/webgpu/EngineTest.jsx); [`frontend/src/shadows/gpu.ts`](C:/Users/91882/Documents/My%20Work/Projects/HeliosGPU/frontend/src/shadows/gpu.ts)).

## Things I could not verify

- A completed production build: the observed Vite build started transforming but was stopped after exceeding the run window.
- A completed frontend lint run: `npx` attempted to install ESLint and the command was stopped after exceeding the run window.
- Successful live calls to Cesium ion, Cesium World Terrain, ArcGIS, Open-Meteo, or AWS Terrarium.
- Current third-party quotas, free-tier limits, pricing, and exact licensing/attribution terms.
- Whether Cesium asset 96188 and anonymous/conditional token behavior still work with current provider policies.
- A deployed backend URL or backend hosting configuration.
- A measured FPS, GPU compute time, memory profile, or scientific accuracy benchmark.
- Whether the checked-in `database/schema.sql` or runtime `initDB` schema is the intended deployment source.
- Whether the old `EngineTest` and legacy `engine/webgpu` pipeline are still planned, because they are not mounted by the current `App`.
- Whether all declared but unimported packages (Resium, Rapier, Turf, Simplex Noise, Radix primitives, GSAP, Astronomy Engine, SQLite-WASM) are intentionally reserved or obsolete.
