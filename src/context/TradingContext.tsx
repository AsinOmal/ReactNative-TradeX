import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { calculateCombinedStats, getRecentMonths } from '../services/calculationService';
import {
    deleteMonthFromFirestore,
    deleteTradeFromFirestore,
    getMonths,
    monthExistsInFirestore,
    saveMonth as saveMonthToFirestore,
    saveTrade as saveTradeToFirestore,
    subscribeToMonths,
    subscribeToTrades,
} from '../services/firestoreService';
import { generateAndSharePDF } from '../services/pdfService';
import {
    calculateMonthlyPnLFromTrades,
    calculateTradeStats,
    getRecentTrades as getRecentTradesUtil,
} from '../services/tradeCalculationService';
import { MonthRecord, OverallStats, Trade, TradeStats } from '../types';
import { useAuth } from './AuthContext';

interface TradingContextType {
  // State - Months
  months: MonthRecord[];
  activeMonth: MonthRecord | null;
  isLoading: boolean;
  error: string | null;
  stats: OverallStats;
  
  // State - Trades
  trades: Trade[];
  tradeStats: TradeStats;
  isLoadingTrades: boolean;
  
  // Month Actions
  loadMonths: () => Promise<void>;
  addMonth: (monthData: MonthRecord) => Promise<void>;
  updateMonth: (id: string, updates: Partial<MonthRecord>) => Promise<void>;
  deleteMonth: (id: string) => Promise<void>;
  closeMonth: (id: string, endingCapital: number) => Promise<void>;
  generatePDF: (monthId: string) => Promise<void>;
  getMonthById: (id: string) => MonthRecord | undefined;
  getRecentMonths: (limit?: number) => MonthRecord[];
  monthExists: (monthKey: string) => Promise<boolean>;
  
  // Trade Actions
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (id: string, trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getTradeById: (id: string) => Trade | undefined;
  getTradesByMonth: (monthKey: string) => Trade[];
  getRecentTrades: (limit?: number) => Trade[];
  recalculateMonthPnL: (monthKey: string) => Promise<void>;
  
  // User Profile
  yearlyGoal: number;
  setYearlyGoal: (goal: number) => Promise<void>;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [months, setMonths] = useState<MonthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Trade state
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  
  // Derived state
  const activeMonth = months.find(m => m.status === 'active') || null;
  // Use combined stats: trades take priority for months with trades, otherwise use manual P&L
  const combinedStats = calculateCombinedStats(months, trades);
  const stats: OverallStats = combinedStats;
  const tradeStats = calculateTradeStats(trades);
  
  // Subscribe to real-time updates when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMonths([]);
      setTrades([]);
      setIsLoading(false);
      setIsLoadingTrades(false);
      return;
    }
    
    setIsLoading(true);
    setIsLoadingTrades(true);
    
    // Subscribe to real-time Firestore updates for months
    const unsubscribeMonths = subscribeToMonths(user.uid, (updatedMonths) => {
      setMonths(updatedMonths);
      setIsLoading(false);
    });
    
    // Subscribe to real-time Firestore updates for trades
    const unsubscribeTrades = subscribeToTrades(user.uid, (updatedTrades) => {
      setTrades(updatedTrades);
      setIsLoadingTrades(false);
    });
    
    return () => {
      unsubscribeMonths();
      unsubscribeTrades();
    };
  }, [isAuthenticated, user]);

  // Auto-recalculate P&L for months with pnlSource='trades' when trades change
  useEffect(() => {
    if (!user || months.length === 0 || trades.length === 0) return;
    
    // Find months that use trades as P&L source
    const tradeMonths = months.filter(m => m.pnlSource === 'trades');
    if (tradeMonths.length === 0) return;
    
    // Recalculate each trade-based month
    tradeMonths.forEach(async (month) => {
      const monthTrades = trades.filter(t => t.monthKey === month.month);
      const totalPnL = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
      
      // Only update if P&L changed
      if (Math.abs(totalPnL - month.netProfitLoss) > 0.01) {
        const newEndingCapital = month.startingCapital + totalPnL + month.deposits - month.withdrawals;
        try {
          await saveMonthToFirestore(user.uid, {
            ...month,
            endingCapital: newEndingCapital,
            netProfitLoss: totalPnL,
            grossChange: newEndingCapital - month.startingCapital,
            returnPercentage: month.startingCapital > 0 ? (totalPnL / month.startingCapital) * 100 : 0,
            updatedAt: Date.now(),
          });
        } catch (error) {
          console.error('Auto-recalculate P&L error:', error);
        }
      }
    });
  }, [trades, months, user]);

  const [yearlyGoal, setUserYearlyGoal] = useState<number>(0);
  const [displayName, setUserDisplayName] = useState<string>('');

  // Subscribe to user profile
  useEffect(() => {
      if (!isAuthenticated || !user) return;
      
      const { subscribeToUserProfile } = require('../services/firestoreService');
      const unsubscribe = subscribeToUserProfile(user.uid, (data: any) => {
          if (data) {
              if (data.yearlyGoal) setUserYearlyGoal(data.yearlyGoal);
              if (data.displayName !== undefined) setUserDisplayName(data.displayName);
          }
      });
      return () => unsubscribe();
  }, [isAuthenticated, user]);

  const setYearlyGoal = useCallback(async (goal: number) => {
      if (!user) return;
      const { saveUserProfile } = require('../services/firestoreService');
      await saveUserProfile(user.uid, { yearlyGoal: goal });
      setUserYearlyGoal(goal); // optimistic
  }, [user]);

  const setDisplayName = useCallback(async (name: string) => {
      if (!user) return;
      const { saveUserProfile } = require('../services/firestoreService');
      setUserDisplayName(name); // optimistic update
      await saveUserProfile(user.uid, { displayName: name });
  }, [user]);
  
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
  
  // ============================================
  // TRADE ACTIONS
  // ============================================
  
  const addTrade = useCallback(async (trade: Trade) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      await saveTradeToFirestore(user.uid, {
        ...trade,
        createdAt: Date.now(),
      });
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to save trade');
      console.error('Add trade error:', err);
      throw err;
    }
  }, [user]);
  
  const updateTrade = useCallback(async (id: string, trade: Trade) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      await saveTradeToFirestore(user.uid, {
        ...trade,
        id,
        updatedAt: Date.now(),
      });
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to update trade');
      console.error('Update trade error:', err);
      throw err;
    }
  }, [user]);
  
  const deleteTrade = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    try {
      setError(null);
      await deleteTradeFromFirestore(user.uid, id);
      // State will update automatically via subscription
    } catch (err) {
      setError('Failed to delete trade');
      console.error('Delete trade error:', err);
      throw err;
    }
  }, [user]);
  
  const getTradeByIdAction = useCallback((id: string) => {
    return trades.find(t => t.id === id);
  }, [trades]);
  
  const getTradesByMonthAction = useCallback((monthKey: string) => {
    return trades.filter(t => t.monthKey === monthKey);
  }, [trades]);
  
  const getRecentTradesAction = useCallback((limit = 10) => {
    return getRecentTradesUtil(trades, limit);
  }, [trades]);
  
  // Recalculate month P&L from trades (for pnlSource='trades' months)
  const recalculateMonthPnL = useCallback(async (monthKey: string) => {
    if (!user) throw new Error('Not authenticated');
    
    const month = months.find(m => m.month === monthKey);
    if (!month || month.pnlSource !== 'trades') return;
    
    const monthTrades = trades.filter(t => t.monthKey === monthKey);
    const netProfitLoss = calculateMonthlyPnLFromTrades(monthTrades, monthKey);
    
    // Update the month with new P&L
    const newEndingCapital = month.startingCapital + netProfitLoss + month.deposits - month.withdrawals;
    
    await saveMonthToFirestore(user.uid, {
      ...month,
      endingCapital: newEndingCapital,
      netProfitLoss,
      grossChange: newEndingCapital - month.startingCapital,
      returnPercentage: month.startingCapital > 0 ? (netProfitLoss / month.startingCapital) * 100 : 0,
      updatedAt: Date.now(),
    });
  }, [user, months, trades]);
  
  const value: TradingContextType = {
    // Months
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
    
    // Trades
    trades,
    tradeStats,
    isLoadingTrades,
    addTrade,
    updateTrade,
    deleteTrade,
    getTradeById: getTradeByIdAction,
    getTradesByMonth: getTradesByMonthAction,
    getRecentTrades: getRecentTradesAction,
    recalculateMonthPnL,
    
    // User Profile
    yearlyGoal,
    setYearlyGoal,
    displayName,
    setDisplayName,
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
