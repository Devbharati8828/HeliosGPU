import React, { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import { useHeliosStore } from '../store/useHeliosStore';
import { solarAdapter } from '../solar/solarAdapter';
import * as THREE from 'three';

// Custom gradient sky shader — full control, never blows out to white
const SKY_VERTEX = /* glsl */`
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = /* glsl */`
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uGroundColor;
uniform float uSunAltitude;

varying vec3 vWorldPosition;

void main() {
  vec3 dir = normalize(vWorldPosition);
  float height = dir.y; // -1 = below, +1 = above

  // Create a continuous smooth gradient for the entire sphere
  // height goes from -1 (bottom) to 1 (top)
  // We'll map it so the horizon (0) is uSkyHorizon, and both top (1) and bottom (-1) fade to uSkyTop/uGroundColor
  
  vec3 color;
  if (height >= -0.05) {
    // Sky and slightly below horizon
    float skyFrac = max(0.0, height + 0.05);
    color = mix(uSkyHorizon, uSkyTop, pow(skyFrac, 0.5));
  } else {
    // Deep ground fade (softer transition)
    float groundFrac = max(0.0, -height - 0.05);
    // Mix the horizon color with the ground color much more softly
    color = mix(uSkyHorizon, uGroundColor, pow(groundFrac, 0.8));
  }
  
  gl_FragColor = vec4(color, 1.0);
}
`;

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function colorLerp(c1, c2, t) {
  return new THREE.Color(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t),
  );
}

const NIGHT_TOP     = new THREE.Color('#020408');
const NIGHT_HORIZON = new THREE.Color('#0a0f1e');
const TWILIGHT_TOP  = new THREE.Color('#1a1040');
const TWILIGHT_HORIZ= new THREE.Color('#c05020');
const DAY_TOP       = new THREE.Color('#1460b8');
const DAY_HORIZON   = new THREE.Color('#6aabf7');
const GROUND        = new THREE.Color('#1c2a45'); // Softer deep blue instead of harsh black

export default function SkyDome() {
  const sunPosition = useHeliosStore((s) => s.sunPosition);

  const uniforms = useMemo(() => ({
    uSkyTop:     { value: new THREE.Color('#1460b8') },
    uSkyHorizon: { value: new THREE.Color('#6aabf7') },
    uGroundColor:{ value: GROUND.clone() },
    uSunAltitude:{ value: 0 },
  }), []);

  // Fallback if not initialized
  if (!sunPosition) return null;

  const alt = sunPosition.altitude;
  const isNight    = alt < -6;
  const isTwilight = alt >= -6 && alt < 0;
  const isDaytime  = alt >= 0;

  // Update uniforms based on sun altitude
  if (isDaytime) {
    const t = Math.min(alt / 40, 1); // full day effect by 40°
    uniforms.uSkyTop.value   = colorLerp(TWILIGHT_TOP, DAY_TOP, t);
    uniforms.uSkyHorizon.value = colorLerp(TWILIGHT_HORIZ, DAY_HORIZON, t);
  } else if (isTwilight) {
    const t = (alt + 6) / 6; // 0 at -6°, 1 at 0°
    uniforms.uSkyTop.value   = colorLerp(NIGHT_TOP, TWILIGHT_TOP, t);
    uniforms.uSkyHorizon.value = colorLerp(NIGHT_HORIZON, TWILIGHT_HORIZ, t);
  } else {
    uniforms.uSkyTop.value.copy(NIGHT_TOP);
    uniforms.uSkyHorizon.value.copy(NIGHT_HORIZON);
  }
  uniforms.uGroundColor.value.copy(GROUND);
  uniforms.uSunAltitude.value = alt;

  return (
    <>
      {/* Custom gradient sky dome — large sphere, inside-out */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[400, 32, 16]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Removed the black physical ground plane so the sky shader is fully visible */}

      {/* Stars at night / twilight */}
      {(isNight || isTwilight) && (
        <Stars
          radius={200}
          depth={60}
          count={isNight ? 6000 : 2000}
          factor={4}
          saturation={0.1}
          fade
          speed={0.5}
        />
      )}

      {isNight && <ambientLight intensity={0.05} color="#1a2040" />}
    </>
  );
}
