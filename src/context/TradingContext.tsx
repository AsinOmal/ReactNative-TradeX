import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { calculateOverallStats, getRecentMonths } from '../services/calculationService';
import { generateAndSharePDF } from '../services/pdfService';
import * as storageService from '../services/storageService';
import { MonthRecord, OverallStats } from '../types';

interface TradingContextType {
  // State
  months: MonthRecord[];
  activeMonth: MonthRecord | null;
  isLoading: boolean;
  error: string | null;
  stats: OverallStats;
  
  // Actions
  loadMonths: () => Promise<void>;
  addMonth: (monthData: MonthRecord) => Promise<void>;
  updateMonth: (id: string, updates: Partial<MonthRecord>) => Promise<void>;
  deleteMonth: (id: string) => Promise<void>;
  closeMonth: (id: string, endingCapital: number) => Promise<void>;
  generatePDF: (monthId: string) => Promise<void>;
  getMonthById: (id: string) => MonthRecord | undefined;
  getRecentMonths: (limit?: number) => MonthRecord[];
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [months, setMonths] = useState<MonthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state
  const activeMonth = months.find(m => m.status === 'active') || null;
  const stats = calculateOverallStats(months);
  
  // Load months on mount
  useEffect(() => {
    loadMonths();
  }, []);
  
  const loadMonths = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await storageService.getAllMonths();
      setMonths(data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Load months error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const addMonth = useCallback(async (monthData: MonthRecord) => {
    try {
      setError(null);
      const updated = await storageService.saveMonth(monthData);
      setMonths(updated);
    } catch (err) {
      setError('Failed to save month');
      console.error('Add month error:', err);
      throw err;
    }
  }, []);
  
  const updateMonth = useCallback(async (id: string, updates: Partial<MonthRecord>) => {
    try {
      setError(null);
      const existing = months.find(m => m.id === id);
      if (!existing) throw new Error('Month not found');
      
      const updated = await storageService.saveMonth({
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      });
      setMonths(updated);
    } catch (err) {
      setError('Failed to update month');
      console.error('Update month error:', err);
      throw err;
    }
  }, [months]);
  
  const deleteMonthAction = useCallback(async (id: string) => {
    try {
      setError(null);
      const updated = await storageService.deleteMonth(id);
      setMonths(updated);
    } catch (err) {
      setError('Failed to delete month');
      console.error('Delete month error:', err);
      throw err;
    }
  }, []);
  
  const closeMonthAction = useCallback(async (id: string, endingCapital: number) => {
    try {
      setError(null);
      const updated = await storageService.closeMonth(id, endingCapital);
      setMonths(updated);
    } catch (err) {
      setError('Failed to close month');
      console.error('Close month error:', err);
      throw err;
    }
  }, []);
  
  const generatePDF = useCallback(async (monthId: string) => {
    try {
      setError(null);
      const month = months.find(m => m.id === monthId);
      if (!month) throw new Error('Month not found');
      await generateAndSharePDF(month);
    } catch (err) {
      setError('Failed to generate PDF');
      console.error('Generate PDF error:', err);
      throw err;
    }
  }, [months]);
  
  const getMonthByIdAction = useCallback((id: string) => {
    return months.find(m => m.id === id);
  }, [months]);
  
  const getRecentMonthsAction = useCallback((limit = 5) => {
    return getRecentMonths(months, limit);
  }, [months]);
  
  const value: TradingContextType = {
    months,
    activeMonth,
    isLoading,
    error,
    stats,
    loadMonths,
    addMonth,
    updateMonth,
    deleteMonth: deleteMonthAction,
    closeMonth: closeMonthAction,
    generatePDF,
    getMonthById: getMonthByIdAction,
    getRecentMonths: getRecentMonthsAction,
  };
  
  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading(): TradingContextType {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
