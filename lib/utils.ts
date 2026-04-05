import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount}`;
  }
}

export function formatDelivery(days: number | undefined, destination: string = 'IN'): string {
  if (!days) return "ETA unknown";
  return `~${Math.max(1, days - 3)}-${days + 3} days to ${destination === 'IN' ? 'India' : destination}`;
}

export function getCountryFlag(code: string): string {
  return code.toUpperCase().replace(/./g, c => 
    String.fromCodePoint(c.charCodeAt(0) + 127397))
}

export function calculateMatchColor(score: number): string {
  if (score >= 80) return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800";
  return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800";
}
