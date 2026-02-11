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
  
  // P&L source: manual entry or calculated from trades
  pnlSource: 'manual' | 'trades';
  
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

// Individual Trade Data Model
export interface Trade {
  id: string;
  symbol: string;                    // e.g., "AAPL", "BTC"
  tradeType: 'long' | 'short';
  status: 'open' | 'closed';         // trade status
  entryDate: string;                 // ISO date string
  exitDate?: string;                 // ISO date string (optional for open trades)
  entryPrice: number;
  exitPrice?: number;                // optional for open trades
  quantity: number;
  pnl?: number;                      // calculated: (exit - entry) * qty * direction (optional for open)
  returnPercentage?: number;         // calculated (optional for open)
  notes: string;
  tags: string[];                    // e.g., ["swing", "earnings"]
  monthKey: string;                  // links to month: 'YYYY-MM' (based on entry for open trades)
  isWin?: boolean;                   // calculated: pnl > 0 (optional for open)
  createdAt: number;
  updatedAt: number;
}

// Trade form input (before calculations)
export interface TradeFormInput {
  symbol: string;
  tradeType: 'long' | 'short';
  status: 'open' | 'closed';
  entryDate: string;
  exitDate?: string;                 // optional for open trades
  entryPrice: string;
  exitPrice?: string;                // optional for open trades
  quantity: string;
  notes: string;
  tags: string;                      // comma-separated
}

// Trade statistics
export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  currentStreak: number;             // +N for wins, -N for losses
  longestWinStreak: number;
  longestLoseStreak: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
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
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

// Chart data point
export interface ChartDataPoint {
  month: string;
  label: string;
  value: number;
  percentage: number;
}
