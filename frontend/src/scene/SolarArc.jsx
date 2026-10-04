import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useHeliosStore } from '../store/useHeliosStore';
import * as THREE from 'three';

export default function SolarArc() {
  const arcPoints = useHeliosStore((state) => state.solarArcPoints);
  
  const points = useMemo(() => {
    return arcPoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
  }, [arcPoints]);

  if (points.length === 0) return null;

  return (
    <group>
      <Line
        points={points}
        color="rgba(253, 184, 19, 0.4)"
        lineWidth={2}
        dashed
        dashScale={5}
        dashSize={1}
        dashOffset={0}
      />
    </group>
  );
}
