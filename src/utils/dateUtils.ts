import { format, parse } from 'date-fns';
import { MONTH_NAMES } from './constants';

/**
 * Get month key in YYYY-MM format
 */
export function getMonthKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

/**
 * Get the month name from a month key
 */
export function getMonthName(monthKey: string): string {
  const [, monthStr] = monthKey.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  return MONTH_NAMES[monthIndex] || '';
}

/**
 * Get year from month key
 */
export function getYear(monthKey: string): number {
  const [yearStr] = monthKey.split('-');
  return parseInt(yearStr, 10);
}

/**
 * Parse month key to Date object
 */
export function parseMonthKey(monthKey: string): Date {
  return parse(monthKey, 'yyyy-MM', new Date());
}

/**
 * Format month for display (e.g., "January 2025")
 */
export function formatMonthDisplay(monthKey: string): string {
  const monthName = getMonthName(monthKey);
  const year = getYear(monthKey);
  return `${monthName} ${year}`;
}

/**
 * Get short month label (e.g., "Jan")
 */
export function getShortMonthLabel(monthKey: string): string {
  const [, monthStr] = monthKey.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  return MONTH_NAMES[monthIndex]?.substring(0, 3) || '';
}

/**
 * Generate list of months for picker (last 24 months + next 12 months)
 */
export function generateMonthOptions(): { key: string; label: string }[] {
  const options: { key: string; label: string }[] = [];
  const today = new Date();
  
  // Past 24 months
  for (let i = 24; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = getMonthKey(date);
    options.push({ key, label: formatMonthDisplay(key) });
  }
  
  // Future 12 months
  for (let i = 1; i <= 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const key = getMonthKey(date);
    options.push({ key, label: formatMonthDisplay(key) });
  }
  
  return options;
}

/**
 * Sort month keys chronologically (newest first)
 */
export function sortMonthsDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

/**
 * Sort month keys chronologically (oldest first)
 */
export function sortMonthsAsc(a: string, b: string): number {
  return a.localeCompare(b);
}
