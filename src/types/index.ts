// Monthly Record Data Model
export interface MonthRecord {
  id: string;
  month: string;           // 'YYYY-MM' format
  year: number;
  monthName: string;
  
  // Capital tracking
  startingCapital: number;
  endingCapital: number;
  deposits: number;
  withdrawals: number;
  
  // Calculated fields
  grossChange: number;
  netProfitLoss: number;
  returnPercentage: number;
  
  // Metadata
  status: 'active' | 'closed';
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// Form input (before calculations)
export interface MonthFormInput {
  month: string;
  startingCapital: string;
  endingCapital: string;
  deposits: string;
  withdrawals: string;
  notes: string;
}

// Overall statistics
export interface OverallStats {
  totalProfitLoss: number;
  totalProfit: number;
  totalLoss: number;
  averageReturn: number;
  bestMonth: MonthRecord | null;
  worstMonth: MonthRecord | null;
  profitableMonths: number;
  totalMonths: number;
  winRate: number;
}

// Chart data point
export interface ChartDataPoint {
  month: string;
  label: string;
  value: number;
  percentage: number;
}
