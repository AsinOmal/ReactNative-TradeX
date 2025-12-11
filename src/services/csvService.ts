import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MonthRecord } from '../types';
import { formatMonthDisplay } from '../utils/dateUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';

/**
 * Generate CSV content from month records
 */
export function generateCSVContent(months: MonthRecord[]): string {
  // CSV Headers
  const headers = [
    'Month',
    'Year',
    'Starting Capital',
    'Ending Capital',
    'Deposits',
    'Withdrawals',
    'Gross Change',
    'Net P&L',
    'Return %',
    'Status',
    'Notes',
  ].join(',');
  
  // CSV Rows
  const rows = months.map(month => [
    formatMonthDisplay(month.month),
    month.year,
    month.startingCapital,
    month.endingCapital,
    month.deposits,
    month.withdrawals,
    month.grossChange,
    month.netProfitLoss,
    month.returnPercentage.toFixed(2),
    month.status,
    `"${(month.notes || '').replace(/"/g, '""')}"`, // Escape quotes in notes
  ].join(','));
  
  return [headers, ...rows].join('\n');
}

/**
 * Generate and share CSV file
 */
export async function generateAndShareCSV(months: MonthRecord[]): Promise<void> {
  const csvContent = generateCSVContent(months);
  const fileName = `TradeX_Export_${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;
  
  // Write file
  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  // Share file
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Trading Data',
    });
  }
}

/**
 * Generate CSV for summary statistics
 */
export function generateSummaryCSV(months: MonthRecord[]): string {
  const closedMonths = months.filter(m => m.status === 'closed');
  const totalPnL = closedMonths.reduce((sum, m) => sum + m.netProfitLoss, 0);
  const avgReturn = closedMonths.length > 0
    ? closedMonths.reduce((sum, m) => sum + m.returnPercentage, 0) / closedMonths.length
    : 0;
  const profitableMonths = closedMonths.filter(m => m.netProfitLoss > 0).length;
  
  const summaryHeaders = ['Metric', 'Value'].join(',');
  const summaryRows = [
    ['Total Months', closedMonths.length],
    ['Total P&L', formatCurrency(totalPnL)],
    ['Average Return', formatPercentage(avgReturn)],
    ['Profitable Months', profitableMonths],
    ['Losing Months', closedMonths.length - profitableMonths],
    ['Win Rate', `${((profitableMonths / closedMonths.length) * 100).toFixed(1)}%`],
  ].map(row => row.join(',')).join('\n');
  
  return [summaryHeaders, summaryRows].join('\n');
}
