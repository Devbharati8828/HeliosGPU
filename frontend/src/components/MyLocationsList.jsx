import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader } from 'lucide-react';
import api from '../services/apiClient';
import { useHeliosStore } from '../store/useHeliosStore';

export default function MyLocationsList({ onClose }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const setLocation = useHeliosStore((s) => s.setLocation);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/v1/locations/mine')
      .then((res) => { if (!cancelled) { setLocations(res.data || []); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (loc) => {
    setLocation(parseFloat(loc.latitude), parseFloat(loc.longitude), loc.name, loc.timezone);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="relative w-full max-w-sm mx-4 bg-helios-surface border border-line-subtle rounded-2xl shadow-xl overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-line-subtle">
            <span className="text-sm font-medium tracking-wide uppercase text-text-primary">My Locations</span>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 text-text-muted">
                <Loader size={16} className="animate-spin mr-2" /> Loading…
              </div>
            )}
            {error && (
              <p className="text-center text-red-400 text-sm py-6 px-4">{error}</p>
            )}
            {!loading && !error && locations.length === 0 && (
              <p className="text-center text-text-muted text-sm py-6">No saved locations yet.</p>
            )}
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center space-x-3 px-5 py-3 hover:bg-helios-void/40 transition-colors text-left border-b border-line-subtle/40 last:border-0"
              >
                <MapPin size={14} className="text-sun-glow shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{loc.name}</p>
                  {loc.country && (
                    <p className="text-xs text-text-muted">{[loc.region, loc.country].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

