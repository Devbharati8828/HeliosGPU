import React from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Globe, Map, Sunset, Mountain } from 'lucide-react';
import { useHeliosStore } from '../store/useHeliosStore';
import { cn } from '../lib/utils';

export default function Header() {
  const setSearchOpen = useHeliosStore((state) => state.setSearchOpen);
  const setDatePickerOpen = useHeliosStore((state) => state.setDatePickerOpen);
  const locationName = useHeliosStore((state) => state.locationName);
  const date = useHeliosStore((state) => state.date);
  const timezone = useHeliosStore((state) => state.timezone);
  
  const viewMode = useHeliosStore((state) => state.viewMode);
  const setViewMode = useHeliosStore((state) => state.setViewMode);

  const modes = [
    { id: 'globe', label: 'Globe', icon: Globe },
    { id: 'map3d', label: '3D Map', icon: Map },
    { id: 'sky', label: 'Sky', icon: Sunset },
    { id: 'shadows', label: 'Shadows', icon: Mountain },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none"
    >
      {/* Brand */}
      <div className="flex items-center space-x-2 pointer-events-auto">
        <span className="font-serif text-2xl tracking-[0.15em] font-medium text-text-primary uppercase" style={{ letterSpacing: '0.2em' }}>
          Helios
        </span>
      </div>

      {/* Mode Selector */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto hidden md:flex items-center p-1 rounded-full bg-helios-void/80 border border-line-subtle backdrop-blur-md">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={cn(
              "relative px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-colors flex items-center space-x-2",
              viewMode === mode.id ? "text-helios-void" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {viewMode === mode.id && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute inset-0 bg-text-primary rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <mode.icon size={14} className="relative z-10" />
            <span className="relative z-10">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 pointer-events-auto">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-helios-void/80 backdrop-blur-md border border-line-subtle hover:border-line-active transition-colors group"
        >
          <Search size={14} className="text-text-secondary group-hover:text-text-primary transition-colors" />
          <span className="text-sm font-medium tracking-wide">{locationName}</span>
        </button>

        <button
          onClick={() => setDatePickerOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-helios-void/80 backdrop-blur-md border border-line-subtle hover:border-line-active transition-colors group"
        >
          <Calendar size={14} className="text-text-secondary group-hover:text-sun-glow transition-colors" />
          <span className="text-sm font-medium tracking-wide">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone })}
          </span>
        </button>
      </div>
    </motion.header>
  );
}
