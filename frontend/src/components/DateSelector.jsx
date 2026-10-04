import React from 'react';
import { useHeliosStore } from '../store/useHeliosStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export default function DateSelector() {
  const isOpen = useHeliosStore((state) => state.isDatePickerOpen);
  const setDatePickerOpen = useHeliosStore((state) => state.setDatePickerOpen);
  const date = useHeliosStore((state) => state.date);
  const setDate = useHeliosStore((state) => state.setDate);

  // Note: For a real app, custom styling for DayPicker should be added to index.css
  // overriding the default variables with our design tokens.
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-6 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={() => setDatePickerOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative bg-helios-surface border border-line-default rounded-xl shadow-2xl p-4"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-line-subtle">
              <span className="font-medium text-text-primary">Select Date</span>
              <button onClick={() => setDatePickerOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            
            <style>{`
              .rdp {
                --rdp-cell-size: 32px;
                --rdp-accent-color: var(--color-sun-core);
                --rdp-background-color: var(--color-helios-elevated);
                --rdp-accent-color-dark: var(--color-sun-glow);
                --rdp-background-color-dark: var(--color-helios-surface);
                --rdp-outline: 2px solid var(--color-sun-core);
                --rdp-outline-selected: 2px solid var(--color-sun-core);
                margin: 0;
              }
              .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                color: #000;
                background-color: var(--color-sun-core);
              }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                background-color: var(--color-line-subtle);
              }
            `}</style>
            
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) setDate(d);
                setDatePickerOpen(false);
              }}
              className="text-text-primary font-sans text-sm"
            />
            
            <div className="mt-4 pt-4 border-t border-line-subtle flex justify-between">
              <button 
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  setDate(d);
                }}
                className="flex items-center text-xs text-text-secondary hover:text-sun-glow transition-colors"
              >
                <ChevronLeft size={14} className="mr-1" /> Prev Day
              </button>
              <button 
                onClick={() => {
                  setDate(new Date());
                  setDatePickerOpen(false);
                }}
                className="text-xs font-medium text-text-primary hover:text-sun-glow"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  setDate(d);
                }}
                className="flex items-center text-xs text-text-secondary hover:text-sun-glow transition-colors"
              >
                Next Day <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
