import React from 'react';
import { Html } from '@react-three/drei';

// Uses HTML overlays via drei/Html for compass labels — avoids font file dependency
const DIRECTIONS = [
  { label: 'N', x:  0, z: -65, color: 'rgba(253,184,19,0.85)' },
  { label: 'S', x:  0, z:  65, color: 'rgba(255,255,255,0.35)' },
  { label: 'E', x:  65, z:  0, color: 'rgba(255,255,255,0.35)' },
  { label: 'W', x: -65, z:  0, color: 'rgba(255,255,255,0.35)' },
];

export default function CompassRose() {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Thin radial lines */}
      {DIRECTIONS.map((d) => (
        <mesh key={d.label} position={[d.x / 2, 0, d.z / 2]}>
          <boxGeometry args={[
            d.z !== 0 ? 0.15 : Math.abs(d.x),
            0.05,
            d.z !== 0 ? Math.abs(d.z) : 0.15,
          ]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      ))}

      {/* HTML label billboards */}
      {DIRECTIONS.map((d) => (
        <Html
          key={d.label}
          position={[d.x, 0.5, d.z]}
          center
          distanceFactor={80}
          style={{ pointerEvents: 'none' }}
        >
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            fontWeight: 500,
            color: d.color,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
            {d.label}
          </span>
        </Html>
      ))}
    </group>
  );
}
