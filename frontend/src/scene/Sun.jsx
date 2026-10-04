import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useHeliosStore } from '../store/useHeliosStore';
import { solarAdapter } from '../solar/solarAdapter';

const _pos = new THREE.Vector3();

export default function Sun() {
  const sunRef  = useRef();
  const lightRef = useRef();

  // Use per-frame reads from store via _sunPosRef for 60fps scrubbing
  useFrame(() => {
    const { _sunPosRef } = useHeliosStore.getState();
    const sp = _sunPosRef.current;
    if (!sp) return;

    // Below horizon → hide sun mesh, light still active (twilight)
    const aboveHorizon = sp.altitude > -1;
    if (sunRef.current) sunRef.current.visible = aboveHorizon;

    const vec = solarAdapter.sunVector({ altitude: sp.altitude, azimuth: sp.azimuth });
    const radius = 180;
    const x = vec.east * radius, y = vec.up * radius, z = -vec.north * radius;
    _pos.set(x, Math.max(y, -10), z);   // clamp Y so it never goes underground

    if (sunRef.current)  sunRef.current.position.lerp(_pos, 0.08);
    if (lightRef.current) lightRef.current.position.copy(sunRef.current?.position ?? _pos);

    // Vary light color / intensity with altitude (warm at horizon, white at zenith)
    if (lightRef.current) {
      const t = Math.max(0, sp.altitude / 90);      // 0=horizon, 1=zenith
      const r = THREE.MathUtils.lerp(1.0, 1.0, t);
      const g = THREE.MathUtils.lerp(0.55, 0.96, t);
      const b = THREE.MathUtils.lerp(0.2,  0.9,  t);
      lightRef.current.color.setRGB(r, g, b);
      lightRef.current.intensity = Math.max(0, THREE.MathUtils.lerp(0.1, 1.5, t));
    }
  });

  return (
    <group>
      {/* Sun sphere — high emissive for Bloom pickup */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#FDB813" toneMapped={false} />
      </mesh>

      {/* Shadow-casting directional light */}
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-near={0.5}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0004}
      />

      {/* Soft fill from sky */}
      <ambientLight intensity={0.1} color="#3a4a6a" />
    </group>
  );
}
