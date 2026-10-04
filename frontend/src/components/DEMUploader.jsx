import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileImage } from 'lucide-react';
import { useHeliosStore } from '../store/useHeliosStore';
import { DEMLoader } from '../engine/demLoader';

export default function DEMUploader() {
  const viewMode = useHeliosStore((s) => s.viewMode);
  const demData = useHeliosStore((s) => s.demData);
  const setDemData = useHeliosStore((s) => s.setDemData);
  const setLoading = useHeliosStore((s) => s.setLoading);

  const [isDragging, setIsDragging] = React.useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.tif')) return;

    setLoading(true, 'Parsing elevation data…');
    try {
      const buf = await file.arrayBuffer();
      const data = await DEMLoader.parseGeoTIFF(buf);
      setDemData(data);
    } catch (e) {
      console.error('DEM parse error:', e);
    } finally {
      setLoading(false);
    }
  }, [setDemData, setLoading]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  // Only show in Shadows mode when no DEM is loaded
  if (viewMode !== 'shadows' || demData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute right-6 top-20 z-20 w-64"
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            helios-panel rounded-xl p-5 flex flex-col items-center text-center cursor-pointer
            transition-colors border-2
            ${isDragging
              ? 'border-sun-glow bg-helios-elevated/80'
              : 'border-dashed border-line-default hover:border-line-active'}
          `}
          onClick={() => document.getElementById('dem-file-input').click()}
        >
          <input
            id="dem-file-input"
            type="file"
            accept=".tif,.tiff"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="w-10 h-10 rounded-full bg-helios-elevated flex items-center justify-center mb-3">
            <FileImage size={18} className="text-sun-glow" />
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">Drop a GeoTIFF DEM</p>
          <p className="text-xs text-text-muted mb-3">or click to browse</p>
          <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
            .tif / .tiff · max 50 MB
          </span>
        </div>

        <button
          className="w-full mt-2 py-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors text-center"
          onClick={() => setDemData({ _procedural: true })}
        >
          Use demo terrain instead →
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
