import React, { useEffect, useRef, useState } from 'react';
import { useHeliosStore } from '../../store/useHeliosStore';
import { latLngToTile, fetchTerrariumTile } from '../data/TileFetcher';
import { decodeTerrariumBlob } from '../data/DemDecoder';
import { ShadowCompute } from '../webgpu/ShadowCompute';
import { apiClient } from '../../lib/apiClient';
import { format } from 'date-fns';

export default function EngineTest() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Initializing Engine...');
  const lat = useHeliosStore((s) => s.latitude);
  const lng = useHeliosStore((s) => s.longitude);
  const date = useHeliosStore((s) => s.date);
  
  useEffect(() => {
    let isMounted = true;
    
    async function runTest() {
      if (!canvasRef.current) return;
      
      try {
        setStatus('Fetching Tile (Zoom 12)...');
        const { x, y, z } = latLngToTile(lat, lng, 12);
        const blob = await fetchTerrariumTile(x, y, z);
        
        if (!isMounted) return;
        setStatus('Decoding Tile...');
        const elevations = await decodeTerrariumBlob(blob);
        
        if (!isMounted) return;
        setStatus('Creating Backend Analysis Session...');
        const dateStr = format(date, 'yyyy-MM-dd');
        const timeStr = format(date, 'HH:mm');
        
        // Let the backend compute the formal solar vector and create a session
        const session = await apiClient.analysis.createSession({
          latitude: lat,
          longitude: lng,
          date: dateStr,
          time: timeStr,
          terrainId: 'local-test-tile'
        });
        
        setStatus('Computing Shadows via WebGPU...');
        const compute = new ShadowCompute();
        await compute.init();
        
        // Use the backend's authoritative solar vector
        const sunVector = session.solar.solarVector;
        
        const startTime = performance.now();
        // 256x256 grid, ~38 meters per pixel at zoom 12
        const shadowMap = await compute.compute(elevations, 256, 256, 38.0, [sunVector.x, sunVector.z, sunVector.y]); 
        const computeTime = Math.round(performance.now() - startTime);
        
        if (!isMounted) return;
        setStatus('Submitting Result to Backend...');
        
        await apiClient.analysis.submitResult(session.analysisId, {
          compute_time_ms: computeTime,
          shadow_reference: 'local-memory-buffer',
          metadata_json: { resolution: '38m', zoom: 12 }
        });

        setStatus(`Rendering (${computeTime}ms compute)...`);
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(256, 256);
        
        for (let i = 0; i < shadowMap.length; i++) {
          const val = shadowMap[i]; // 1.0 = lit, 0.0 = shadowed
          const color = val > 0.5 ? 255 : 30; // Lit = white, shadow = dark grey
          imgData.data[i * 4] = color;
          imgData.data[i * 4 + 1] = color;
          imgData.data[i * 4 + 2] = color;
          imgData.data[i * 4 + 3] = 255;
        }
        
        ctx.putImageData(imgData, 0, 0);
        setStatus(`Complete. Session: ${session.analysisId.split('-')[0]}...`);
        
      } catch (err) {
        console.error(err);
        if (isMounted) setStatus(`Error: ${err.message}`);
      }
    }
    
    runTest();
    
    return () => { isMounted = false; };
  }, [lat, lng, date]);

  return (
    <div className="absolute top-32 left-6 z-50 p-4 bg-helios-surface/90 backdrop-blur-md rounded-xl border border-line-active text-text-primary font-mono text-xs shadow-2xl pointer-events-auto">
      <h3 className="mb-2 text-sun-glow helios-mono-readout">WEBGPU ENGINE TEST</h3>
      <p className="mb-3 text-text-secondary">{status}</p>
      <canvas ref={canvasRef} width={256} height={256} className="bg-helios-void border border-line-subtle rounded-lg w-48 h-48" />
    </div>
  );
}
