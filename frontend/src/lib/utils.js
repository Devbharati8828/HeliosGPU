import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(date, timeZone) {
  if (!date || isNaN(date.getTime())) return '--:--';
  const options = { hour: 'numeric', minute: '2-digit' };
  if (timeZone) options.timeZone = timeZone;
  return date.toLocaleTimeString('en-US', options);
}

export function formatDegrees(value) {
  if (value === undefined || value === null) return '--°';
  return `${value.toFixed(1)}°`;
}
