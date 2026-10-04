import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useHeliosStore } from '../store/useHeliosStore';
import SceneCamera from './SceneCamera';
import Sun from './Sun';
import SolarArc from './SolarArc';
import SkyDome from './SkyDome';
import CompassRose from './CompassRose';

// Forces the WebGL clear color to match the app dark background
function SceneBackground() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor('#07070d', 1);
  }, [gl]);
  return null;
}

export default function HeliosScene() {
  const viewMode = useHeliosStore((state) => state.viewMode);

  if (viewMode !== 'sky') return null;

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas
        shadows
        camera={{ position: [0, 1.6, 0], fov: 75 }}
        gl={{ antialias: true, toneMappingExposure: 0.7 }}
      >
        <SceneBackground />
        <Suspense fallback={null}>
          <SceneCamera />
          <Sun />
          <SolarArc />
          <SkyDome />
          <CompassRose />
          
          <EffectComposer>
            <Bloom luminanceThreshold={0.95} intensity={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
