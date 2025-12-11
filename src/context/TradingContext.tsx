import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { calculateOverallStats, getRecentMonths } from '../services/calculationService';
import {
  deleteMonthFromFirestore,
  getMonths,
  monthExistsInFirestore,
  saveMonth as saveMonthToFirestore,
  subscribeToMonths,
} from '../services/firestoreService';
import { generateAndSharePDF } from '../services/pdfService';
import { MonthRecord, OverallStats } from '../types';
import { useAuth } from './AuthContext';

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
  monthExists: (monthKey: string) => Promise<boolean>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [months, setMonths] = useState<MonthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state
  const activeMonth = months.find(m => m.status === 'active') || null;
  const stats = calculateOverallStats(months);
  
  // Subscribe to real-time updates when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMonths([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Subscribe to real-time Firestore updates
    const unsubscribe = subscribeToMonths(user.uid, (updatedMonths) => {
      setMonths(updatedMonths);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);
  
  const loadMonths = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMonths(user.uid);
      setMonths(data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Load months error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  const addMonth = useCallback(async (monthData: MonthRecord) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      await saveMonthToFirestore(user.uid, {
        ...monthData,
        createdAt: Date.now(),
      });
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to save month');
      console.error('Add month error:', err);
      throw err;
    }
  }, [user]);
  
  const updateMonth = useCallback(async (id: string, updates: Partial<MonthRecord>) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      const existing = months.find(m => m.id === id);
      if (!existing) throw new Error('Month not found');
      
      await saveMonthToFirestore(user.uid, {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      });
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to update month');
      console.error('Update month error:', err);
      throw err;
    }
  }, [user, months]);
  
  const deleteMonthAction = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      await deleteMonthFromFirestore(user.uid, id);
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to delete month');
      console.error('Delete month error:', err);
      throw err;
    }
  }, [user]);
  
  const closeMonthAction = useCallback(async (id: string, endingCapital: number) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      const existing = months.find(m => m.id === id);
      if (!existing) throw new Error('Month not found');
      
      await saveMonthToFirestore(user.uid, {
        ...existing,
        endingCapital,
        status: 'closed',
        updatedAt: Date.now(),
      });
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to close month');
      console.error('Close month error:', err);
      throw err;
    }
  }, [user, months]);
  
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
  
  const monthExistsAction = useCallback(async (monthKey: string) => {
    if (!user) return false;
    return monthExistsInFirestore(user.uid, monthKey);
  }, [user]);
  
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
    monthExists: monthExistsAction,
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
