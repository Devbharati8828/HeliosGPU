import React, { useState, useEffect } from 'react';
import { useHeliosStore } from '../store/useHeliosStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

export default function LocationSearch() {
  const isOpen = useHeliosStore((state) => state.isSearchOpen);
  const setSearchOpen = useHeliosStore((state) => state.setSearchOpen);
  const setLocation = useHeliosStore((state) => state.setLocation);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.locations.search(query);
        const formatted = res.map((r, i) => ({
          id: `loc-${i}`,
          name: r.name + (r.country ? `, ${r.country}` : ''),
          lat: r.latitude,
          lng: r.longitude,
          tz: r.timezone
        }));
        setResults(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (result) => {
    setLocation(result.lat, result.lng, result.name, result.tz);
    setSearchOpen(false);
    setQuery('');
    
    try {
      await apiClient.locations.create({
        name: result.name,
        latitude: result.lat,
        longitude: result.lng,
        timezone: result.tz
      });
    } catch (err) {
      console.warn('Backend save skipped/failed:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-helios-void/70 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-lg bg-helios-surface border border-line-active rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <style>{`
              [data-cmdk-root] {
                display: flex;
                flex-direction: column;
                width: 100%;
              }
              [data-cmdk-input] {
                font-family: var(--font-sans);
                font-size: 1.125rem;
                padding: 1.25rem 1rem 1.25rem 0.75rem;
                border: none;
                width: 100%;
                background: transparent;
                outline: none;
                color: var(--color-text-primary);
              }
              [data-cmdk-input]::placeholder {
                color: var(--color-text-muted);
              }
              [data-cmdk-list] {
                max-height: 300px;
                overflow-y: auto;
                padding: 0.5rem;
                border-top: 1px solid var(--color-line-subtle);
              }
              [data-cmdk-item] {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                cursor: pointer;
                transition: background 0.2s, color 0.2s;
                color: var(--color-text-secondary);
              }
              [data-cmdk-item][data-selected="true"] {
                background: var(--color-line-default);
                color: var(--color-text-primary);
              }
              [data-cmdk-item][data-selected="true"] .loc-name {
                color: var(--color-sun-glow);
              }
              [data-cmdk-empty] {
                padding: 2rem;
                text-align: center;
                color: var(--color-text-muted);
                font-size: 0.875rem;
              }
            `}</style>
            
            <Command shouldFilter={false}>
              <div className="flex items-center px-4">
                <Search size={18} className="text-text-muted shrink-0" />
                <Command.Input 
                  autoFocus 
                  value={query} 
                  onValueChange={setQuery} 
                  placeholder="Search globally..." 
                />
              </div>
              <Command.List>
                {isLoading && <Command.Loading><div className="p-4 text-center text-text-muted text-sm">Searching...</div></Command.Loading>}
                {!isLoading && results.length === 0 && query && <Command.Empty>No locations found.</Command.Empty>}
                
                {!isLoading && results.map((res) => (
                  <Command.Item
                    key={res.id}
                    value={res.id}
                    onSelect={() => handleSelect(res)}
                  >
                    <span className="loc-name font-medium transition-colors">{res.name}</span>
                    <span className="helios-mono-readout opacity-50">
                      {Math.abs(res.lat).toFixed(2)}°{res.lat >= 0 ? 'N' : 'S'} {Math.abs(res.lng).toFixed(2)}°{res.lng >= 0 ? 'E' : 'W'}
                    </span>
                  </Command.Item>
                ))}

                {!query && (
                  <div className="pt-2">
                    <div className="px-3 pb-2 helios-mono-readout">Popular</div>
                    {[
                      { id: 'pop-1', name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
                      { id: 'pop-2', name: 'Reykjavík, Iceland', lat: 64.1466, lng: -21.9426, tz: 'Atlantic/Reykjavik' },
                      { id: 'pop-3', name: 'Machu Picchu, Peru', lat: -13.1631, lng: -72.5450, tz: 'America/Lima' },
                      { id: 'pop-4', name: 'Chamonix, France', lat: 45.9237, lng: 6.8694, tz: 'Europe/Paris' },
                    ].map((loc) => (
                      <Command.Item
                        key={loc.id}
                        value={loc.id}
                        onSelect={() => handleSelect(loc)}
                      >
                        <span className="loc-name font-medium transition-colors">{loc.name}</span>
                        <span className="helios-mono-readout opacity-50">
                          {Math.abs(loc.lat).toFixed(2)}°{loc.lat >= 0 ? 'N' : 'S'} {Math.abs(loc.lng).toFixed(2)}°{loc.lng >= 0 ? 'E' : 'W'}
                        </span>
                      </Command.Item>
                    ))}
                  </div>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
