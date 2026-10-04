import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { solarAdapter } from '../solar/solarAdapter';
import { DateTime } from 'luxon';

const getInitialSolarState = (baseDate, lat, lng, timeOfDay, tz) => {
  // Get start of day in the target timezone
  const startOfDay = DateTime.fromJSDate(new Date(baseDate)).setZone(tz).startOf('day');
  // Add fraction of the day
  const targetDt = startOfDay.plus({ milliseconds: timeOfDay * 86400000 });
  const d = targetDt.toJSDate();

  return {
    date: d,
    sunPosition: solarAdapter.getSunPosition(d, lat, lng),
    sunTimes: solarAdapter.getSunTimes(d, lat, lng),
    daylightDuration: solarAdapter.getDaylightInfo(d, lat, lng).formatted,
    solarArcPoints: solarAdapter.getSolarArcSamples(d, lat, lng, 96),
    terminatorCoords: solarAdapter.getTerminator(d, 120),
  };
};

export const useHeliosStore = create(subscribeWithSelector((set, get) => {
  const initialLat = 30.10;
  const initialLng = 78.29;
  const initialDate = new Date();
  const initialTimeOfDay = 0.5; // noon
  const initialTz = 'Asia/Kolkata';

  const solarData = getInitialSolarState(initialDate, initialLat, initialLng, initialTimeOfDay, initialTz);

  return {
    // === LOCATION ===
    latitude: initialLat,
    longitude: initialLng,
    locationName: 'Uttarakhand Himalaya',
    timezone: 'Asia/Kolkata',
    
    // === TIME ===
    date: solarData.date,
    timeOfDay: initialTimeOfDay,
    
    // === SOLAR ===
    sunPosition: solarData.sunPosition,
    sunTimes: solarData.sunTimes,
    daylightDuration: solarData.daylightDuration,
    solarArcPoints: solarData.solarArcPoints,
    terminatorCoords: solarData.terminatorCoords,
    
    // === VIEW ===
    viewMode: 'globe', // globe | map3d | sky | shadows
    isSearchOpen: false,
    isDatePickerOpen: false,
    
    // === DATA (Engine) ===
    demData: null,
    gpuAvailable: false,
    isLoading: false,
    loadingMessage: '',
    computeTimeMs: 0,
    isComputing: false,
    
    // === ACTIONS ===
    setLocation: (lat, lng, name, tz) => {
      const state = get();
      const newTz = tz || state.timezone;
      const newSolar = getInitialSolarState(state.date, lat, lng, state.timeOfDay, newTz);
      set({ 
        latitude: lat, 
        longitude: lng, 
        locationName: name, 
        timezone: newTz,
        ...newSolar 
      });
    },
    
    setDate: (newDate) => {
      const state = get();
      const newSolar = getInitialSolarState(newDate, state.latitude, state.longitude, state.timeOfDay, state.timezone);
      set({ ...newSolar });
    },
    
    setTimeOfDay: (fraction) => {
      const state = get();
      // Write to ref for high-frequency access (timeline scrub)
      state._timeRef.current = fraction;
      
      const newSolar = getInitialSolarState(state.date, state.latitude, state.longitude, fraction, state.timezone);
      state._sunPosRef.current = newSolar.sunPosition;
      
      set({ timeOfDay: fraction, ...newSolar });
    },
    
    setViewMode: (mode) => set({ viewMode: mode }),
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
    setDatePickerOpen: (isOpen) => set({ isDatePickerOpen: isOpen }),
    setLoading: (isLoading, msg = '') => set({ isLoading, loadingMessage: msg }),
    setGpuAvailable: (isAvailable) => set({ gpuAvailable: isAvailable }),
    setDemData: (data) => set({ demData: data }),
    setComputeTime: (ms) => set({ computeTimeMs: ms }),
    setIsComputing: (isComputing) => set({ isComputing }),
    
    // === REFS (for GPU/Canvas access without React re-renders) ===
    _sunPosRef: { current: solarData.sunPosition },
    _cameraRef: { current: null },
    _timeRef: { current: initialTimeOfDay },
  };
}));
