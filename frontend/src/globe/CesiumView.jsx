import React, { useRef, useEffect } from 'react';
import { useHeliosStore } from '../store/useHeliosStore';
import { heliosCesiumConfig } from './cesiumConfig';

// ── Cesium lazy-load ─────────────────────────────────────────────────────────
let CesiumModule = null;

async function loadCesium() {
  if (CesiumModule) return CesiumModule;
  window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium/`;
  CesiumModule = await import('cesium');

  // Only set Ion token if user has provided one
  const userToken = import.meta.env.VITE_CESIUM_TOKEN;
  if (userToken) {
    CesiumModule.Ion.defaultAccessToken = userToken;
  }

  return CesiumModule;
}

/**
 * Fly to a city-level tilted view for 3D Map mode.
 * altitude: 1200 m, pitch: -40° (horizon visible, buildings extruded)
 */
function flyTo3DMap(viewer, C, lng, lat, duration = 1.5) {
  const destination = C.Cartesian3.fromDegrees(lng, lat - 0.005, 1200);
  const orientation = {
    heading: 0,
    pitch: C.Math.toRadians(-40),
    roll: 0,
  };

  return new Promise((resolve) => {
    viewer.camera.flyTo({
      destination,
      orientation,
      duration,
      complete: () => {
        const pitchDeg = C.Math.toDegrees(viewer.camera.pitch);
        console.log(`[Helios] 3D Map camera pitch after flyTo: ${pitchDeg.toFixed(1)}°`);
        resolve();
      },
    });
  });
}

/**
 * Fly to an orbital globe view.
 * altitude: 12 000 km, pitch: -90° (straight down)
 */
function flyToGlobe(viewer, C, lng, lat, duration = 2.5) {
  const destination = C.Cartesian3.fromDegrees(lng, lat, 12_000_000);
  const orientation = { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 };

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion || duration === 0) {
    viewer.camera.setView({ destination, orientation });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    viewer.camera.flyTo({ destination, orientation, duration, complete: resolve });
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CesiumView() {
  const viewMode     = useHeliosStore((s) => s.viewMode);
  const lat          = useHeliosStore((s) => s.latitude);
  const lng          = useHeliosStore((s) => s.longitude);
  const locationName = useHeliosStore((s) => s.locationName);
  const terminatorCoords = useHeliosStore((s) => s.terminatorCoords);
  const date         = useHeliosStore((s) => s.date);
  const timeOfDay    = useHeliosStore((s) => s.timeOfDay);
  const _timeRef     = useHeliosStore((s) => s._timeRef);

  const containerRef  = useRef(null);
  const viewerRef     = useRef(null);  // { viewer, C, buildings }
  const markerRef     = useRef(null);
  const terminatorRef = useRef(null);

  // ── Step 1 + 2 + 4: Initialize Cesium, terrain, buildings, lighting ──────
  useEffect(() => {
    if (viewerRef.current) return;

    let destroyed = false;

    loadCesium().then(async (C) => {
      if (destroyed || !containerRef.current) return;

      try {

      const viewerOptions = {
        ...heliosCesiumConfig,
        terrain: C.Terrain.fromWorldTerrain(),
        baseLayer: C.ImageryLayer.fromProviderAsync(
          C.ArcGisMapServerImageryProvider.fromUrl(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
          )
        ),
        showCreditsOnScreen: true,
      };

      if (destroyed || !containerRef.current) return;

      const viewer = new C.Viewer(containerRef.current, viewerOptions);

      // ── Scene settings ───────────────────────────────────────────────
      viewer.scene.backgroundColor = C.Color.fromCssColorString('#07070d');
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyBox.show = true;
      viewer.scene.skyAtmosphere.show = true;
      // Keep the Cesium ion attribution visible for hosted terrain and tiles.
      viewer.cesiumWidget.creditContainer.style.display = 'none';
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
      // Improve photorealistic tile rendering quality
      viewer.scene.msaaSamples = 4;
      viewer.scene.fog.enabled = false;  // disable fog — photorealistic tiles look better without it
      viewer.scene.highDynamicRange = false; // keep colors true-to-life

      // Step 4: Allow high-quality shadows (will be toggled per mode)
      viewer.shadowMap.maximumDistance = 10000;
      viewer.shadowMap.softShadows = true;
      // Enable shadows on the globe surface
      viewer.scene.globe.receiveShadows = true;
      viewer.scene.globe.castShadows = true;
      viewer.terrainShadows = C.ShadowMode.ENABLED;

      // ── Step 2: Cesium ion 3D Buildings ──────────────────────────────
      const CESIUM_3D_TILES_ASSET_ID = 96188;
      let buildings = null;
      try {
        buildings = await C.Cesium3DTileset.fromIonAssetId(CESIUM_3D_TILES_ASSET_ID, {
          showCreditsOnScreen: true,
        });
        
        // Step 4: Color the buildings based on height.
        // OSM Buildings stores height as a string, so we cast with Number().
        // The "true" fallback catches anything where Number() returns NaN (no height property).
        buildings.style = new C.Cesium3DTileStyle({
          color: { conditions: [
            ["Number(${height}) >= 100", "color('#8B98A8', 0.95)"],
            ["Number(${height}) >= 50",  "color('#A9B4C0', 0.95)"],
            ["Number(${height}) >= 20",  "color('#C7CFD8', 0.95)"],
            ["true",                     "color('#cfd8dc', 0.9)"],
          ] }
        });

        viewer.scene.primitives.add(buildings);
        buildings.show = false; // hide until map3d mode
        console.log('[Cesium] Cesium ion 3D Buildings loaded ✓');
      } catch (e) {
        console.warn('[Cesium] Cesium ion 3D Buildings failed to load:', e.message);
      }

      viewerRef.current = { viewer, C, buildings };

      // ── Apply initial mode ───────────────────────────────────────────
      const initMode = useHeliosStore.getState().viewMode;
      const initLat  = useHeliosStore.getState().latitude;
      const initLng  = useHeliosStore.getState().longitude;
      const initName = useHeliosStore.getState().locationName;

      if (buildings) buildings.show = (initMode === 'map3d');
      // Globe must remain visible even in 3D map mode so imagery/ground doesn't disappear
      viewer.scene.globe.show = true;

      // Step 4: shadows in both Globe and 3D Map mode
      viewer.shadows = (initMode === 'map3d' || initMode === 'globe');

      if (initMode === 'map3d') {
        // Use setView (no animation on init) then animate in
        viewer.camera.setView({
          destination: C.Cartesian3.fromDegrees(initLng, initLat - 0.005, 1200),
          orientation: { heading: 0, pitch: C.Math.toRadians(-40), roll: 0 },
        });
      } else {
        viewer.camera.setView({
          destination: C.Cartesian3.fromDegrees(initLng, initLat, 12_000_000),
          orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 },
        });
      }

      // ── Location marker ──────────────────────────────────────────────
      markerRef.current = viewer.entities.add({
        position: C.Cartesian3.fromDegrees(initLng, initLat),
        point: {
          pixelSize: 12,
          color: C.Color.fromCssColorString('#FDB813'),
          outlineColor: C.Color.fromCssColorString('#07070d'),
          outlineWidth: 2,
          heightReference: C.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: initName,
          font: '13px "Inter", sans-serif',
          fillColor: C.Color.WHITE,
          outlineColor: C.Color.BLACK,
          outlineWidth: 2,
          style: C.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: C.VerticalOrigin.BOTTOM,
          pixelOffset: new C.Cartesian2(0, -18),
          showBackground: true,
          backgroundColor: C.Color.fromCssColorString('#141428cc'),
          backgroundPadding: new C.Cartesian2(8, 4),
          // Hide label in 3D map — too cluttered at street level
          show: initMode !== 'map3d',
        },
      });

      viewer.scene.requestRender();

      } catch (err) {
        console.error('[Cesium] Initialization failed:', err.message || err);
      }
    });

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        viewerRef.current.viewer.destroy();
        viewerRef.current = null;
        markerRef.current = null;
        terminatorRef.current = null;
      }
    };
  }, []); // run once on mount

  // ── Step 1: Sync location & mode with camera fly-to ──────────────────────
  useEffect(() => {
    if (!viewerRef.current) return;
    const { viewer, C, buildings } = viewerRef.current;

    // Update marker
    if (markerRef.current) {
      markerRef.current.position = C.Cartesian3.fromDegrees(lng, lat);
      markerRef.current.label.text = new C.ConstantProperty(locationName);
      // Hide label at street level in 3D Map
      markerRef.current.label.show = new C.ConstantProperty(viewMode !== 'map3d');
    }

    // Step 2: Toggle Cesium ion 3D Buildings and hide globe beneath it
    if (buildings) {
      buildings.show = (viewMode === 'map3d');
    }
    // Globe must remain visible to show the ground/imagery
    viewer.scene.globe.show = true;

    // Step 4: Toggle shadows
    viewer.shadows = (viewMode === 'map3d' || viewMode === 'globe');

    // Step 1: Camera fly — tilted for 3D Map, orbital for Globe
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (viewMode === 'map3d') {
      flyTo3DMap(viewer, C, lng, lat, isReducedMotion ? 0 : 1.5);
    } else {
      flyToGlobe(viewer, C, lng, lat, isReducedMotion ? 0 : 2.5);
    }

    viewer.scene.requestRender();
  }, [lat, lng, locationName, viewMode]);

  // ── Terminator polyline ───────────────────────────────────────────────────
  useEffect(() => {
    if (!viewerRef.current || terminatorCoords.length < 2) return;
    const { viewer, C } = viewerRef.current;

    if (terminatorRef.current) {
      viewer.entities.remove(terminatorRef.current);
    }

    const positions = terminatorCoords
      .filter(([lngT, latT]) => isFinite(lngT) && isFinite(latT))
      .map(([lngT, latT]) => C.Cartesian3.fromDegrees(lngT, latT));

    if (positions.length > 1) {
      terminatorRef.current = viewer.entities.add({
        polyline: {
          positions,
          width: 2,
          material: new C.PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: C.Color.fromCssColorString('#E8845C').withAlpha(0.7),
          }),
          clampToGround: false,
        },
      });
    }

    viewer.scene.requestRender();
  }, [terminatorCoords]);

  // ── Step 4: Sync Cesium clock from timeline for moving sun/shadows ────────
  useEffect(() => {
    if (!viewerRef.current) return;
    const { viewer, C } = viewerRef.current;

    const preRenderListener = () => {
      const fraction = _timeRef.current;
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setMilliseconds(fraction * 86_400_000);

      const julianDate = C.JulianDate.fromDate(d);
      if (!C.JulianDate.equals(viewer.clock.currentTime, julianDate)) {
        viewer.clock.currentTime = julianDate;
        viewer.scene.requestRender();
      }
    };

    viewer.scene.preRender.addEventListener(preRenderListener);
    return () => {
      if (viewerRef.current) {
        viewerRef.current.viewer.scene.preRender.removeEventListener(preRenderListener);
      }
    };
  }, [date, _timeRef]);

  // Force render on timeOfDay React state change (initial loads)
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.viewer.scene.requestRender();
    }
  }, [timeOfDay]);

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <div ref={containerRef} className="w-full h-full" />

      {/* Mode indicator badge for 3D Map */}
      {viewMode === 'map3d' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-helios-void/70 backdrop-blur px-3 py-1.5 rounded-full border border-line-active z-10 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-sun-glow animate-pulse" />
          <span className="font-mono text-[10px] text-text-muted tracking-widest uppercase">
            {import.meta.env.VITE_CESIUM_TOKEN
              ? '3D · Cesium Buildings · Real Terrain · Shadows'
              : '3D · Satellite Imagery · Real Terrain'}
          </span>
        </div>
      )}
    </div>
  );
}
