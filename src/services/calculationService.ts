import { ChartDataPoint, MonthRecord, OverallStats } from '../types';
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
  status: 'active' | 'closed' = 'closed'
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
