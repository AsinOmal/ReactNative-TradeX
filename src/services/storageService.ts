import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonthRecord } from '../types';
import { STORAGE_KEY } from '../utils/constants';

/**
 * Get all monthly records from storage
 */
export async function getAllMonths(): Promise<MonthRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as MonthRecord[];
  } catch (error) {
    console.error('Error getting months:', error);
    return [];
  }
}

/**
 * Save all monthly records to storage
 */
async function saveAllMonths(months: MonthRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(months));
  } catch (error) {
    console.error('Error saving months:', error);
    throw error;
  }
}

/**
 * Save a new month or update existing
 */
export async function saveMonth(monthData: MonthRecord): Promise<MonthRecord[]> {
  const months = await getAllMonths();
  const existingIndex = months.findIndex(m => m.id === monthData.id);
  
  if (existingIndex >= 0) {
    // Update existing
    months[existingIndex] = {
      ...monthData,
      updatedAt: Date.now(),
    };
  } else {
    // Add new
    months.push({
      ...monthData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  await saveAllMonths(months);
  return months;
}

/**
 * Get a specific month by ID
 */
export async function getMonthById(id: string): Promise<MonthRecord | null> {
  const months = await getAllMonths();
  return months.find(m => m.id === id) || null;
}

/**
 * Get month by year-month string (e.g., '2025-01')
 */
export async function getMonthByPeriod(month: string): Promise<MonthRecord | null> {
  const months = await getAllMonths();
  return months.find(m => m.month === month) || null;
}

/**
 * Delete a month by ID
 */
export async function deleteMonth(id: string): Promise<MonthRecord[]> {
  const months = await getAllMonths();
  const filtered = months.filter(m => m.id !== id);
  await saveAllMonths(filtered);
  return filtered;
}

/**
 * Get the active (current) month
 */
export async function getActiveMonth(): Promise<MonthRecord | null> {
  const months = await getAllMonths();
  return months.find(m => m.status === 'active') || null;
}

/**
 * Close current month and optionally create next month
 */
export async function closeMonth(
  id: string, 
  endingCapital: number
): Promise<MonthRecord[]> {
  const months = await getAllMonths();
  const monthIndex = months.findIndex(m => m.id === id);
  
  if (monthIndex >= 0) {
    months[monthIndex] = {
      ...months[monthIndex],
      endingCapital,
      status: 'closed',
      updatedAt: Date.now(),
    };
    await saveAllMonths(months);
  }
  
  return months;
}

/**
 * Check if a month period already exists
 */
export async function monthExists(month: string, excludeId?: string): Promise<boolean> {
  const months = await getAllMonths();
  return months.some(m => m.month === month && m.id !== excludeId);
}

/**
 * Clear all data (for development/testing)
 */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
