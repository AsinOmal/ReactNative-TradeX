import { Trade, TradeFormInput, TradeStats } from '../types';

/**
 * Calculate P&L and other derived fields for a trade
 */
export function calculateTradePnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  tradeType: 'long' | 'short'
): { pnl: number; returnPercentage: number; isWin: boolean } {
  const direction = tradeType === 'long' ? 1 : -1;
  const pnl = (exitPrice - entryPrice) * quantity * direction;
  const returnPercentage = entryPrice > 0 
    ? ((exitPrice - entryPrice) / entryPrice) * 100 * direction 
    : 0;
  const isWin = pnl > 0;
  
  return { pnl, returnPercentage, isWin };
}

/**
 * Create a complete trade record from form input
 */
export function createTradeRecord(
  id: string,
  form: TradeFormInput
): Trade {
  const entryPrice = parseFloat(form.entryPrice) || 0;
  const quantity = parseFloat(form.quantity) || 0;
  
  // Parse tags from comma-separated string
  const tags = form.tags
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
  
  // For open trades, use entry date for monthKey
  // For closed trades, use exit date
  const dateForMonth = form.status === 'open' ? form.entryDate : (form.exitDate || form.entryDate);
  const dateObj = new Date(dateForMonth);
  const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  
  // Base trade object
  const baseTrade = {
    id,
    symbol: form.symbol.toUpperCase().trim(),
    tradeType: form.tradeType,
    status: form.status,
    entryDate: form.entryDate,
    entryPrice,
    quantity,
    notes: form.notes.trim(),
    tags,
    monthKey,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // If trade is closed, calculate P&L
  if (form.status === 'closed' && form.exitDate && form.exitPrice) {
    const exitPrice = parseFloat(form.exitPrice) || 0;
    const { pnl, returnPercentage, isWin } = calculateTradePnL(
      entryPrice, 
      exitPrice, 
      quantity, 
      form.tradeType
    );
    
    return {
      ...baseTrade,
      exitDate: form.exitDate,
      exitPrice,
      pnl,
      returnPercentage,
      isWin,
    };
  }
  
  // For open trades, return without exit data
  return baseTrade as Trade;
}

/**
 * Calculate streak information from trades (sorted by date)
 */
export function calculateStreaks(trades: Trade[]): {
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
} {
  if (trades.length === 0) {
    return { currentStreak: 0, longestWinStreak: 0, longestLoseStreak: 0 };
  }
  
  // Sort by exit date ascending for chronological order
  const sorted = [...trades].sort((a, b) => {
    const dateA = a.exitDate ? new Date(a.exitDate).getTime() : 0;
    const dateB = b.exitDate ? new Date(b.exitDate).getTime() : 0;
    return dateA - dateB;
  });
  
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let tempWinStreak = 0;
  let tempLoseStreak = 0;
  
  for (const trade of sorted) {
    const tradePnL = trade.pnl || 0;
    if (tradePnL > 0) {
      // Win
      tempWinStreak++;
      tempLoseStreak = 0;
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
    } else if (tradePnL < 0) {
      // Loss
      tempLoseStreak++;
      tempWinStreak = 0;
      if (tempLoseStreak > longestLoseStreak) longestLoseStreak = tempLoseStreak;
    } else {
      // Break-even, reset streaks
      tempWinStreak = 0;
      tempLoseStreak = 0;
    }
  }
  
  // Current streak from most recent trades
  const lastTrade = sorted[sorted.length - 1];
  const lastPnL = lastTrade.pnl || 0;
  if (lastPnL > 0) {
    currentStreak = tempWinStreak;
  } else if (lastPnL < 0) {
    currentStreak = -tempLoseStreak; // Negative for losing streak
  }
  
  return { currentStreak, longestWinStreak, longestLoseStreak };
}

/**
 * Calculate overall trade statistics
 */
export function calculateTradeStats(trades: Trade[]): TradeStats {
  // Filter out open trades - only calculate stats for closed trades
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      bestTrade: null,
      worstTrade: null,
    };
  }
  
  let totalPnL = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let bestTrade: Trade | null = null;
  let worstTrade: Trade | null = null;
  
  for (const trade of closedTrades) {
    const tradePnL = trade.pnl || 0;
    totalPnL += tradePnL;
    
    if (tradePnL > 0) {
      winningTrades++;
      totalProfit += tradePnL;
    } else if (tradePnL < 0) {
      losingTrades++;
      totalLoss += Math.abs(tradePnL);
    } else {
      breakEvenTrades++;
    }
    
    if (!bestTrade || tradePnL > (bestTrade.pnl || 0)) {
      bestTrade = trade;
    }
    if (!worstTrade || tradePnL < (worstTrade.pnl || 0)) {
      worstTrade = trade;
    }
  }
  
  const { currentStreak, longestWinStreak, longestLoseStreak } = calculateStreaks(closedTrades);
  
  return {
    totalTrades: closedTrades.length,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    totalPnL,
    winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
    avgWin: winningTrades > 0 ? totalProfit / winningTrades : 0,
    avgLoss: losingTrades > 0 ? totalLoss / losingTrades : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? Infinity : 0),
    currentStreak,
    longestWinStreak,
    longestLoseStreak,
    bestTrade,
    worstTrade,
  };
}

/**
 * Calculate monthly P&L from trades
 */
export function calculateMonthlyPnLFromTrades(trades: Trade[], monthKey: string): number {
  return trades
    .filter(t => t.monthKey === monthKey && t.status === 'closed')
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
}

/**
 * Group trades by month
 */
export function groupTradesByMonth(trades: Trade[]): Record<string, Trade[]> {
  return trades.reduce((acc, trade) => {
    if (!acc[trade.monthKey]) {
      acc[trade.monthKey] = [];
    }
    acc[trade.monthKey].push(trade);
    return acc;
  }, {} as Record<string, Trade[]>);
}

/**
 * Get statistics for a specific symbol
 */
export function getSymbolStats(trades: Trade[], symbol: string): TradeStats {
  const symbolTrades = trades.filter(t => t.symbol === symbol.toUpperCase());
  return calculateTradeStats(symbolTrades);
}

/**
 * Get unique symbols from trades
 */
export function getUniqueSymbols(trades: Trade[]): string[] {
  const symbols = new Set(trades.map(t => t.symbol));
  return Array.from(symbols).sort();
}

/**
 * Get recent trades (sorted newest first)
 */
export function getRecentTrades(trades: Trade[], limit = 10): Trade[] {
  return [...trades]
    .sort((a, b) => {
      const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
      const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}
