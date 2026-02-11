import { ChartDataPoint, MonthRecord, OverallStats, Trade } from '../types';
import { getMonthName, getShortMonthLabel, getYear, sortMonthsAsc } from '../utils/dateUtils';

//!Calculate all derived fields for a month
export function calculateMonthMetrics(
  startingCapital: number,
  endingCapital: number,
  deposits: number,
  withdrawals: number
): { grossChange: number; netProfitLoss: number; returnPercentage: number } {
  const grossChange = endingCapital - startingCapital;
  const netProfitLoss = grossChange - deposits + withdrawals;
  const returnPercentage = startingCapital > 0 
    ? (netProfitLoss / startingCapital) * 100 
    : 0;
  
  return {
    grossChange,
    netProfitLoss,
    returnPercentage,
  };
}

//! Create a complete month record from form input
export function createMonthRecord(
  id: string,
  month: string,
  startingCapital: number,
  endingCapital: number,
  deposits: number,
  withdrawals: number,
  notes: string,
  status: 'active' | 'closed' = 'closed',
  pnlSource: 'manual' | 'trades' = 'manual'
): MonthRecord {
  const metrics = calculateMonthMetrics(startingCapital, endingCapital, deposits, withdrawals);
  
  return {
    id,
    month,
    year: getYear(month),
    monthName: getMonthName(month),
    startingCapital,
    endingCapital,
    deposits,
    withdrawals,
    grossChange: metrics.grossChange,
    netProfitLoss: metrics.netProfitLoss,
    returnPercentage: metrics.returnPercentage,
    pnlSource,
    status,
    notes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get overall statistics across all months
 */
export function calculateOverallStats(months: MonthRecord[]): OverallStats {
  if (months.length === 0) {
    return {
      totalProfitLoss: 0,
      totalProfit: 0,
      totalLoss: 0,
      averageReturn: 0,
      bestMonth: null,
      worstMonth: null,
      profitableMonths: 0,
      totalMonths: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
    };
  }
  
  let totalProfitLoss = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let totalReturn = 0;
  let profitableMonths = 0;
  let bestMonth: MonthRecord | null = null;
  let worstMonth: MonthRecord | null = null;
  
  for (const month of months) {
    totalProfitLoss += month.netProfitLoss;
    totalReturn += month.returnPercentage;
    
    if (month.netProfitLoss > 0) {
      totalProfit += month.netProfitLoss;
      profitableMonths++;
    } else if (month.netProfitLoss < 0) {
      totalLoss += Math.abs(month.netProfitLoss);
    }
    
    if (!bestMonth || month.netProfitLoss > bestMonth.netProfitLoss) {
      bestMonth = month;
    }
    if (!worstMonth || month.netProfitLoss < worstMonth.netProfitLoss) {
      worstMonth = month;
    }
  }
  
  return {
    totalProfitLoss,
    totalProfit,
    totalLoss,
    averageReturn: totalReturn / months.length,
    bestMonth,
    worstMonth,
    profitableMonths,
    totalMonths: months.length,
    winRate: (profitableMonths / months.length) * 100,
    averageWin: profitableMonths > 0 ? totalProfit / profitableMonths : 0,
    averageLoss: (months.length - profitableMonths) > 0 ? totalLoss / (months.length - profitableMonths) : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
  };
}

/**
 * Calculate combined stats from months and trades with double-counting prevention.
 * For each month: if trades exist for that month, use trade P&L; otherwise use month's manual P&L.
 */
export function calculateCombinedStats(
  months: MonthRecord[],
  trades: Trade[]
): OverallStats & { tradeMonths: string[]; tradeTotalPnL: number } {
  // Group trades by month
  const tradesByMonth: Record<string, Trade[]> = {};
  for (const trade of trades) {
    if (!tradesByMonth[trade.monthKey]) {
      tradesByMonth[trade.monthKey] = [];
    }
    tradesByMonth[trade.monthKey].push(trade);
  }
  
  // Calculate P&L for each month (trades take priority)
  const monthsWithTradeKeys = Object.keys(tradesByMonth);
  let totalProfitLoss = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let totalReturn = 0;
  let profitableMonths = 0;
  let bestMonth: MonthRecord | null = null;
  let worstMonth: MonthRecord | null = null;
  let tradeTotalPnL = 0;
  
  // Set of month keys we've already counted
  const countedMonths = new Set<string>();
  
  // First, process months that have trades
  for (const monthKey of monthsWithTradeKeys) {
    countedMonths.add(monthKey);
    const monthTrades = tradesByMonth[monthKey];
    // Only sum P&L from closed trades (open trades have undefined pnl)
    const monthPnL = monthTrades
      .filter(t => t.status === 'closed' && typeof t.pnl === 'number')
      .reduce((sum, t) => sum + t.pnl!, 0);
    tradeTotalPnL += monthPnL;
    totalProfitLoss += monthPnL;
    
    if (monthPnL > 0) {
      totalProfit += monthPnL;
      profitableMonths++;
    } else if (monthPnL < 0) {
      totalLoss += Math.abs(monthPnL);
    }
    
    // Find matching month record for best/worst comparison
    const existingMonth = months.find(m => m.month === monthKey);
    const virtualMonth: MonthRecord = existingMonth || {
      id: monthKey,
      month: monthKey,
      year: parseInt(monthKey.split('-')[0]),
      monthName: '',
      startingCapital: 0,
      endingCapital: monthPnL,
      deposits: 0,
      withdrawals: 0,
      grossChange: monthPnL,
      netProfitLoss: monthPnL,
      returnPercentage: 0,
      pnlSource: 'trades',
      status: 'closed',
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Override P&L with trade P&L for comparison
    const compareMonth = { ...virtualMonth, netProfitLoss: monthPnL };
    
    if (!bestMonth || monthPnL > bestMonth.netProfitLoss) {
      bestMonth = compareMonth;
    }
    if (!worstMonth || monthPnL < worstMonth.netProfitLoss) {
      worstMonth = compareMonth;
    }
    
    // Calculate return if we have starting capital
    if (existingMonth && existingMonth.startingCapital > 0) {
      totalReturn += (monthPnL / existingMonth.startingCapital) * 100;
    }
  }
  
  // Then, add months that don't have trades (manual P&L)
  for (const month of months) {
    if (!countedMonths.has(month.month)) {
      countedMonths.add(month.month);
      totalProfitLoss += month.netProfitLoss;
      totalReturn += month.returnPercentage;
      
      if (month.netProfitLoss > 0) {
        totalProfit += month.netProfitLoss;
        profitableMonths++;
      } else if (month.netProfitLoss < 0) {
        totalLoss += Math.abs(month.netProfitLoss);
      }
      
      if (!bestMonth || month.netProfitLoss > bestMonth.netProfitLoss) {
        bestMonth = month;
      }
      if (!worstMonth || month.netProfitLoss < worstMonth.netProfitLoss) {
        worstMonth = month;
      }
    }
  }
  
  const totalMonthsCount = countedMonths.size;
  
  return {
    totalProfitLoss,
    totalProfit,
    totalLoss,
    averageReturn: totalMonthsCount > 0 ? totalReturn / totalMonthsCount : 0,
    bestMonth,
    worstMonth,
    profitableMonths,
    totalMonths: totalMonthsCount,
    winRate: totalMonthsCount > 0 ? (profitableMonths / totalMonthsCount) * 100 : 0,
    averageWin: profitableMonths > 0 ? totalProfit / profitableMonths : 0,
    averageLoss: (totalMonthsCount - profitableMonths) > 0 ? totalLoss / (totalMonthsCount - profitableMonths) : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
    tradeMonths: monthsWithTradeKeys,
    tradeTotalPnL,
  };
}

/**
 * Get chart data for graph (sorted by date)
 */
export function getChartData(months: MonthRecord[]): ChartDataPoint[] {
  // Sort by month ascending for chronological display
  const sorted = [...months].sort((a, b) => sortMonthsAsc(a.month, b.month));
  
  return sorted.map(m => ({
    month: m.month,
    label: getShortMonthLabel(m.month),
    value: m.netProfitLoss,
    percentage: m.returnPercentage,
  }));
}

/**
 * Filter months by time range
 */
export function filterMonthsByRange(
  months: MonthRecord[], 
  range: '6M' | '1Y' | 'ALL'
): MonthRecord[] {
  if (range === 'ALL') return months;
  
  const now = new Date();
  const monthsBack = range === '6M' ? 6 : 12;
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const cutoffKey = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;
  
  return months.filter(m => m.month >= cutoffKey);
}

/**
 * Get recent months (sorted newest first)
 */
export function getRecentMonths(months: MonthRecord[], limit = 5): MonthRecord[] {
  return [...months]
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, limit);
}
