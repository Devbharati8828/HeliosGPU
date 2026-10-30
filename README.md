# HeliosGPU ☀️

WebGPU-accelerated urban shadow and solar simulator that runs in the browser.

🔗 **Live demo:** https://helios-gpu.vercel.app

![HeliosGPU screenshot](add-screenshot-link)

## Features
- Computes terrain shadows on the GPU with a WebGPU compute shader that ray-marches a 1024×1024 elevation grid for any location.
- Streams, decodes and caches real-world elevation tiles off the main thread using a Web Worker and OPFS, so repeat visits skip the download.
- Explores the Sun's path in four linked views (globe, 3D city map, sky, shadows) driven by one timezone-aware timeline.

## Tech Stack
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4, Zustand, Framer Motion
- **3D and Maps:** WebGPU (WGSL), CesiumJS, Three.js, React Three Fiber
- **Solar and Time:** SunCalc, Luxon, geotiff
- **Backend:** Node.js, Express 5 (city search via Open-Meteo, saved locations)
- **Database:** MySQL 8 (Docker Compose)

## Deployment
- **Frontend:** Vercel
- **Backend:** Render

## Data Sources
AWS Terrarium elevation tiles, ArcGIS World Imagery, Cesium World Terrain, Open-Meteo geocoding

## Run Locally
```bash
git clone https://github.com/Devbharati8828/HeliosGPU.git
cd HeliosGPU/frontend
npm install
npm run dev
```

## Author
Devneal Bharati | [LinkedIn](https://www.linkedin.com/in/devneal-bharati)
