import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BacktestState, Backtest, Analysis, DailyProgress } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Main context interface
interface BacktestContextType {
  state: BacktestState;
  addBacktest: (backtest: Omit<Backtest, 'id'>) => void;
  deleteBacktest: (id: string) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id'>) => void;
  deleteAnalysis: (id: string) => void;
  
  cleanAndValidateData: (data: BacktestState) => BacktestState;
}

// Initial state
const initialState: BacktestState = {
  dailyProgress: {},
  analyses: {},
  currentStreak: 0,
  totalBacktests: 0,
  totalAnalyses: 0,
  lastUpdated: Date.now().toString(),
};

// Create context
const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

// Provider component
export const BacktestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {


  const cleanAndValidateData = (data: BacktestState): BacktestState => {
    const validatedData = { ...data };
    
    // Initialize analyses if it doesn't exist
    if (!validatedData.analyses) {
      validatedData.analyses = {};
    }
    
    // Validate analyses if they exist
    Object.keys(validatedData.analyses).forEach(date => {
      if (Array.isArray(validatedData.analyses[date])) {
        validatedData.analyses[date] = validatedData.analyses[date].filter(analysis => {
          const isValidDate = !isNaN(Date.parse(analysis.datePerformed));
          return isValidDate && analysis.resultType.match(/[abcde]/);
        });
      }
    });
    
    return validatedData;
  };

  // Load initial state from Supabase
  const [state, setState] = useState<BacktestState>(initialState);

  useEffect(() => {
    (async () => {
      const { data: backtests } = await supabase.from('backtests').select('*');
      const { data: analyses } = await supabase.from('analyses').select('*');
      const dailyProgress: Record<string, DailyProgress> = {};
      
      // Process backtests
      backtests?.forEach(b => {
        // Map snake_case to camelCase for Backtest
        const mapped = {
          ...b,
          backtestDate: b.backtest_date,
          datePerformed: b.date_performed,
          noSetupFound: b.no_setup_found,
          hasLiqSweep: b.has_liq_sweep,
          swingFormationTime: b.swing_formation_time,
          swingFormationDateTime: b.swing_formation_datetime,
          obviousnessRating: b.obviousness_rating,
          mssTime: b.mss_time,
          mssDateTime: b.mss_datetime,
          timeframe: b.timeframe,
          isProtectedSwing: b.is_protected_swing,
          didPriceExpand: b.did_price_expand,
          pipsFromSwingLow: b.pips_from_swing_low,
          pipsFromMSS: b.pips_from_mss,
          chartUrl: b.chart_url,
          liqSwingType: b.liq_swing_type,
          convincingRating: b.convincing_rating,
          notes: b.notes,
          id: b.id,
        };
        // Use datePerformed for consistency with new entries
        const date = format(new Date(mapped.datePerformed), 'yyyy-MM-dd');
        if (!dailyProgress[date]) {
          dailyProgress[date] = { date, backtests: [], isComplete: false };
        }
        dailyProgress[date].backtests.push(mapped);
      });

      // Process analyses
      const analysesRecord: Record<string, Analysis[]> = {};
      analyses?.forEach(a => {
        const mapped = {
          ...a,
          backtestDate: a.backtest_date,
          datePerformed: a.date_performed,
          resultType: a.result_type,
          notionUrl: a.notion_url,
          id: a.id,
        };
        // Use datePerformed for consistency
        const date = format(new Date(mapped.datePerformed), 'yyyy-MM-dd');
        if (!analysesRecord[date]) {
          analysesRecord[date] = [];
        }
        analysesRecord[date].push(mapped);
      });

      setState(prev => {
        const newState = {
          ...prev,
          dailyProgress,
          analyses: analysesRecord,
          totalAnalyses: analyses?.length ?? 0,
          lastUpdated: Date.now().toString(),
        };

        // Calculate total backtests
        let total = 0;
        Object.values(dailyProgress).forEach(day => {
          total += countUniqueBacktestDates(day.backtests);
        });
        newState.totalBacktests = total;

        // Calculate streak using the new state
        const sortedDates = Object.keys(dailyProgress)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        if (sortedDates.length === 0) {
          newState.currentStreak = 0;
        } else {
          let streak = 0;
          const today = format(new Date(), 'yyyy-MM-dd');
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = format(yesterdayDate, 'yyyy-MM-dd');
          
          const hasRecentComplete = isDayComplete(today, newState) || isDayComplete(yesterday, newState);
          
          if (!hasRecentComplete) {
            newState.currentStreak = 0;
          } else {
            for (let i = 0; i < sortedDates.length; i++) {
              const date = sortedDates[i];
              if (isDayComplete(date, newState)) {
                streak++;
              } else {
                break;
              }
            }
            newState.currentStreak = streak;
          }
        }

        return newState;
      });
    })();
  }, []);
  
  // Update the total backtest count to match actual data
  const updateTotalCount = () => {
    let total = 0;
    Object.values(state.dailyProgress).forEach(day => {
      total += countUniqueBacktestDates(day.backtests);
    });
    
    if (total !== state.totalBacktests) {
      setState(prev => ({ ...prev, totalBacktests: total }));
    }
  };

  // Helper function to check if a day is complete (5+ unique backtests OR 5+ analyses)
  const isDayComplete = (date: string, currentState: BacktestState = state): boolean => {
    const dayProgress = currentState.dailyProgress[date];
    if (!dayProgress) return false;
    
    // Check if there are 5+ unique backtest dates
    const uniqueDatesCount = countUniqueBacktestDates(dayProgress.backtests);
    if (uniqueDatesCount >= 5) return true;
    
    // Check if there are 5+ analyses for this date
    const dateAnalyses = currentState.analyses[date] || [];
    return dateAnalyses.length >= 5;
  };

  // Calculate streak based on consecutive completed days
  const calculateStreak = () => {
    const sortedDates = Object.keys(state.dailyProgress)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (sortedDates.length === 0) {
      setState(prev => ({ ...prev, currentStreak: 0 }));
      return;
    }

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = format(yesterdayDate, 'yyyy-MM-dd');
    
    // Check if today or yesterday is complete using the new criteria
    const hasRecentComplete = isDayComplete(today) || isDayComplete(yesterday);
    
    if (!hasRecentComplete) {
      setState(prev => ({ ...prev, currentStreak: 0 }));
      return;
    }
    
    // Count consecutive days
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      
      if (isDayComplete(date)) {
        streak++;
      } else {
        break;
      }
    }
    
    setState(prev => ({ ...prev, currentStreak: streak }));
  };

  // Helper function to count unique backtest dates
  const countUniqueBacktestDates = (backtests: Backtest[]): number => {
    const uniqueDates = new Set(backtests.map(bt => bt.backtestDate));
    return uniqueDates.size;
  };

  // Add a new backtest
  const addBacktest = async (backtest: Omit<Backtest, 'id'>) => {
    const id = `${Date.now()}`;
    const backtestWithId = { ...backtest, id };
    // Map camelCase to snake_case for Supabase
    const dbBacktest = {
      id: backtestWithId.id,
      backtest_date: backtestWithId.backtestDate,
      date_performed: backtestWithId.datePerformed,
      no_setup_found: backtestWithId.noSetupFound,
      has_liq_sweep: backtestWithId.hasLiqSweep,
      swing_formation_time: backtestWithId.swingFormationTime || '00:00',
      swing_formation_datetime: backtestWithId.swingFormationDateTime || null,
      obviousness_rating: backtestWithId.obviousnessRating,
      mss_time: backtestWithId.mssTime || '00:00',
      mss_datetime: backtestWithId.mssDateTime || null,
      timeframe: backtestWithId.timeframe,
      is_protected_swing: backtestWithId.isProtectedSwing,
      did_price_expand: backtestWithId.didPriceExpand,
      pips_from_swing_low: backtestWithId.pipsFromSwingLow,
      pips_from_mss: backtestWithId.pipsFromMSS,
      chart_url: backtestWithId.chartUrl ?? null,
      liq_swing_type: backtestWithId.liqSwingType ?? null,
      convincing_rating: backtestWithId.convincingRating ?? null,
      notes: backtestWithId.notes ?? null,
    };
    await supabase.from('backtests').insert(dbBacktest);
    setState(prev => {
      const date = format(new Date(backtest.datePerformed), 'yyyy-MM-dd');
      const day = prev.dailyProgress[date] || { date, backtests: [], isComplete: false };
      return {
        ...prev,
        dailyProgress: {
          ...prev.dailyProgress,
          [date]: { date, backtests: [...day.backtests, backtestWithId], isComplete: false },
        },
        lastUpdated: Date.now().toString(),
      };
    });
    calculateStreak();
    updateTotalCount();
  };

  // Delete a backtest
  const deleteBacktest = async (id: string) => {
    await supabase.from('backtests').delete().eq('id', id);
    setState(prev => {
      const newDailyProgress = { ...prev.dailyProgress };
      Object.keys(newDailyProgress).forEach(date => {
        const day = newDailyProgress[date];
        day.backtests = day.backtests.filter(bt => bt.id !== id);
        if (day.backtests.length === 0) {
          delete newDailyProgress[date];
        }
      });
      return {
        ...prev,
        dailyProgress: newDailyProgress,
        lastUpdated: Date.now().toString(),
      };
    });
    calculateStreak();
    updateTotalCount();
  };

  // Add a new analysis
  const addAnalysis = async (analysis: Omit<Analysis, 'id'>) => {
    const id = `${Date.now()}`;
    const analysisWithId = { ...analysis, id };
    // Map camelCase to snake_case for Supabase
    const dbAnalysis = {
      id: analysisWithId.id,
      backtest_date: analysisWithId.backtestDate,
      date_performed: analysisWithId.datePerformed,
      result_type: analysisWithId.resultType,
      notion_url: analysisWithId.notionUrl,
    };
    await supabase.from('analyses').insert(dbAnalysis);
    setState(prev => {
      const date = format(new Date(analysis.datePerformed), 'yyyy-MM-dd');
      const dateAnalyses = prev.analyses[date] || [];
      return {
        ...prev,
        analyses: {
          ...prev.analyses,
          [date]: [...dateAnalyses, analysisWithId],
        },
        totalAnalyses: prev.totalAnalyses + 1,
        lastUpdated: Date.now().toString(),
      };
    });
    calculateStreak();
    updateTotalCount();
  };

  // Delete an analysis
  const deleteAnalysis = async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    setState(prev => {
      const newAnalyses = { ...prev.analyses };
      let deletedCount = 0;
      Object.keys(newAnalyses).forEach(date => {
        const dateAnalyses = newAnalyses[date];
        const filteredAnalyses = dateAnalyses.filter(a => a.id !== id);
        if (filteredAnalyses.length !== dateAnalyses.length) {
          deletedCount++;
        }
        if (filteredAnalyses.length === 0) {
          delete newAnalyses[date];
        } else {
          newAnalyses[date] = filteredAnalyses;
        }
      });
      return {
        ...prev,
        analyses: newAnalyses,
        totalAnalyses: Math.max(0, prev.totalAnalyses - deletedCount),
        lastUpdated: Date.now().toString(),
      };
    });
    calculateStreak();
    updateTotalCount();
  };

  // Export data as JSON


  // Export data as CSV

  return (
    <BacktestContext.Provider value={{
      state,
      addBacktest,
      deleteBacktest,
      addAnalysis,
      deleteAnalysis,

      cleanAndValidateData
    }}>
      {children}
    </BacktestContext.Provider>
  );
};

// Custom hook to use the backtest context
export const useBacktest = () => {
  const context = useContext(BacktestContext);
  if (context === undefined) {
    throw new Error('useBacktest must be used within a BacktestProvider');
  }
  return context;
};