export interface Backtest {
  id: string;
  backtestDate: string; // The date this backtest is for
  datePerformed: string; // When the backtest was performed
  noSetupFound: boolean; // No valid setup was found
  hasLiqSweep: boolean; // Is there an obvious liq sweep?
  swingFormationTime: string; // When the swing high/low was formed (HH:mm)
  swingFormationDateTime?: string; // Full date and time for swing formation (yyyy-MM-dd HH:mm)
  obviousnessRating: number; // Rate of obviousness (1-10)
  mssTime: string; // When MSS came after the sweep (HH:mm)
  mssDateTime?: string; // Full date and time for MSS (yyyy-MM-dd HH:mm)
  timeframe: '1m' | '5m'; // Is in 5m or 1m timeframe
  isProtectedSwing: boolean; // Is liq sweep formed a protected swing?
  didPriceExpand: boolean; // Did price expand?
  pipsFromSwingLow: number; // How many pips from the new swing low
  pipsFromMSS: number; // How many pips from the MSS
  chartUrl?: string; // URL to the chart for this backtest
  liqSwingType?: string; // Type of liquidity swing
  convincingRating?: number; // How convincing the liq sweep is (1-10)
}

export interface DailyProgress {
  date: string; // Format: YYYY-MM-DD
  backtests: Backtest[];
  isComplete: boolean; // True if >= 5 backtests were performed
}

export interface BacktestState {
  dailyProgress: Record<string, DailyProgress>;
  currentStreak: number;
  totalBacktests: number;
  lastUpdated?: string; // Timestamp of when the data was last updated
} 