import React, { useRef, useEffect } from 'react';
import { CameraControls } from '@react-three/drei';
import { useHeliosStore } from '../store/useHeliosStore';

export default function SceneCamera() {
  const cameraRef = useRef(null);
  const viewMode = useHeliosStore((state) => state.viewMode);

  useEffect(() => {
    if (!cameraRef.current) return;
    const controls = cameraRef.current;
    
    if (viewMode === 'sky') {
      controls.minDistance = 0.1;
      controls.maxDistance = 2;
      controls.maxPolarAngle = Math.PI / 2; // Can't look below ground
      controls.setTarget(0, 4, 10, true);
      controls.setPosition(0, 1, 0, true);
    } else if (viewMode === 'shadows') {
      controls.minDistance = 10;
      controls.maxDistance = 200;
      controls.maxPolarAngle = Math.PI / 2 - 0.1; 
      controls.setTarget(0, 0, 0, true);
      controls.setPosition(0, 50, 100, true);
    }
  }, [viewMode]);

  return (
    <CameraControls
      ref={cameraRef}
      makeDefault
      dollyToCursor
      smoothTime={0.25}
      minPolarAngle={0}
    />
  );
}
