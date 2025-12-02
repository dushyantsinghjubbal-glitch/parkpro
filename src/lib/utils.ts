import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ParkingRecord, PricingConfig } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDuration(entryTime: string, exitTime: string) {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  let diff = exit.getTime() - entry.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));

  let formatted = '';
  if (days > 0) formatted += `${days}d `;
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0 || (days === 0 && hours === 0)) formatted += `${minutes}m`;


  return {
    totalMinutes: Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60)),
    days,
    hours,
    minutes,
    formatted: formatted.trim(),
  };
}

export function calculateCharges(
    duration: { hours: number; minutes: number; days: number }, 
    customerType: ParkingRecord['customerType'] = 'regular',
    pricing: PricingConfig
) {
  if (customerType === 'monthly') {
    return 0; // Monthly subscribers are not charged per session
  }

  // Calculate total hours, rounding up if there are any minutes.
  const totalHours = duration.days * 24 + duration.hours + (duration.minutes > 0 ? 1 : 0);

  // If total hours exceeds the threshold, double the hourly rate for the entire duration.
  if (totalHours > pricing.dailyRateHoursThreshold) {
    return totalHours * pricing.hourlyRate * 2;
  }
  
  // Otherwise, charge the standard hourly rate.
  const totalCharge = totalHours * pricing.hourlyRate;
  return totalCharge;
}
