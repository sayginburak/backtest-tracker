import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BacktestState, Backtest, Analysis } from '../types';
import { format } from 'date-fns';

// Simple interface for sync result
interface SyncResult {
  success: boolean;
  message: string;
}

// Main context interface
interface BacktestContextType {
  state: BacktestState;
  addBacktest: (backtest: Omit<Backtest, 'id'>) => void;
  deleteBacktest: (id: string) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id'>) => void;
  deleteAnalysis: (id: string) => void;
  exportData: () => string;
  exportToCsv: () => string;
  importData: (jsonData: string) => void;
  syncWithRepo: (force?: boolean) => Promise<SyncResult>;
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
  // Migrate existing backtest data to include new fields
  const migrateBacktestData = (currentState: BacktestState): BacktestState => {
    const updatedState = { ...currentState };
    let dataUpdated = false;
    // Add noSetupFound field to all backtests
    Object.keys(updatedState.dailyProgress).forEach(date => {
      const day = updatedState.dailyProgress[date];
      day.backtests = day.backtests.map(backtest => {
        if (!('noSetupFound' in backtest)) {
          dataUpdated = true;
          return { 
            ...backtest as any, 
            noSetupFound: false 
          } as Backtest;
        }
        return backtest;
      });
    });
    if (dataUpdated) {
      console.log('Migrated backtest data to include noSetupFound field');
      updatedState.lastUpdated = Date.now().toString();
    }
    return updatedState;
  };

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

  // Load initial state from localStorage
  const [state, setState] = useState<BacktestState>(() => {
    const savedData = localStorage.getItem('backtestData');
    let loadedState = savedData ? JSON.parse(savedData) : initialState;
    
    // Migrate existing data to include noSetupFound field
    loadedState = migrateBacktestData(loadedState);
    
    return loadedState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Use a small timeout to batch updates and improve performance
    const saveTimer = setTimeout(() => {
      localStorage.setItem('backtestData', JSON.stringify(state));
    }, 300);
    
    return () => clearTimeout(saveTimer);
  }, [state]);
  
  // Calculate streak and ensure total count is accurate
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      calculateStreak();
      updateTotalCount();
    }, 100);
    
    return () => clearTimeout(updateTimer);
  }, [state.dailyProgress]);
  
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
  const isDayComplete = (date: string): boolean => {
    const dayProgress = state.dailyProgress[date];
    if (!dayProgress) return false;
    
    // Check if there are 5+ unique backtest dates
    const uniqueDatesCount = countUniqueBacktestDates(dayProgress.backtests);
    if (uniqueDatesCount >= 5) return true;
    
    // Check if there are 5+ analyses for this date
    const dateAnalyses = state.analyses[date] || [];
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
  const addBacktest = (backtest: Omit<Backtest, 'id'>) => {
    const id = `${Date.now()}`;
    const date = format(new Date(), 'yyyy-MM-dd');
    
    setState(prevState => {
      const dailyProgress = prevState.dailyProgress[date] || { date, backtests: [], isComplete: false };
      
      return {
        ...prevState,
        dailyProgress: {
          ...prevState.dailyProgress,
          [date]: {
            date,
            backtests: [...dailyProgress.backtests, { ...backtest, id }],
            isComplete: false
          }
        },
        lastUpdated: Date.now().toString()
      };
    });
  };

  // Delete a backtest
  const deleteBacktest = (id: string) => {
    setState(prevState => {
      const newDailyProgress = { ...prevState.dailyProgress };
      
      // Find and remove the backtest
      Object.keys(newDailyProgress).forEach(date => {
        const day = newDailyProgress[date];
        day.backtests = day.backtests.filter(bt => bt.id !== id);
        
        // Remove the day if it's empty
        if (day.backtests.length === 0) {
          delete newDailyProgress[date];
        }
      });
      
      return {
        ...prevState,
        dailyProgress: newDailyProgress,
        lastUpdated: Date.now().toString()
      };
    });
  };

  // Add a new analysis
  const addAnalysis = (analysis: Omit<Analysis, 'id'>) => {
    const id = `${Date.now()}`;
    const date = format(new Date(analysis.backtestDate), 'yyyy-MM-dd');
    
    setState(prevState => {
      const dateAnalyses = prevState.analyses[date] || [];
      
      return {
        ...prevState,
        analyses: {
          ...prevState.analyses,
          [date]: [...dateAnalyses, { ...analysis, id }]
        },
        totalAnalyses: prevState.totalAnalyses + 1,
        lastUpdated: Date.now().toString()
      };
    });
  };

  // Delete an analysis
  const deleteAnalysis = (id: string) => {
    setState(prevState => {
      const newAnalyses = { ...prevState.analyses };
      let deletedCount = 0;
      
      // Find and remove the analysis
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
        ...prevState,
        analyses: newAnalyses,
        totalAnalyses: Math.max(0, prevState.totalAnalyses - deletedCount),
        lastUpdated: Date.now().toString()
      };
    });
  };

  // Export data as JSON
  const exportData = () => {
    return JSON.stringify({
      data: state,
      version: Date.now().toString()
    });
  };

  // Export data as CSV
  const exportToCsv = () => {
    // Helper function to escape CSV fields
    const escapeField = (field: string) => {
      if (!field) return '';
      return `"${field.replace(/"/g, '""')}"`;
    };
    
    let csvContent = '';
    
    // Define CSV headers
    const headers = [
      'ID',
      'Date',
      'Backtest Date',
      'No Setup Found',
      'Notes'
    ];
    
    // Add headers to CSV content
    csvContent += headers.join(',') + '\n';
    
    // Convert each backtest to a CSV row
    Object.entries(state.dailyProgress).forEach(([date, dayProgress]) => {
      dayProgress.backtests.forEach(backtest => {
        // Map backtest to CSV row values
        const row = [
          escapeField(backtest.id),
          escapeField(date),
          escapeField(backtest.backtestDate),
          escapeField(backtest.noSetupFound ? 'true' : 'false'),
          escapeField(backtest.notes || '')
        ];
        
        // Add row to CSV content
        csvContent += row.join(',') + '\n';
      });
    });
    
    return csvContent;
  };

  // Import data from JSON
  const importData = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      const stateData = parsedData.data || parsedData;
      
      setState({
        ...stateData,
        lastUpdated: parsedData.version || Date.now().toString()
      });
    } catch (error) {
      console.error('Failed to import data:', error);
      alert('Failed to import data. Please check the JSON format.');
    }
  };

  // Sync with repository data - optimized to prevent unnecessary updates and caching
  const handleSyncWithRepo = async (force: boolean = false): Promise<SyncResult> => {
    try {
      // Prevent multiple syncs
      if ((window as any).__syncInProgress) {
        console.log('[Sync] Sync already in progress, skipping');
        return { success: false, message: "Sync already in progress" };
      }
      
      (window as any).__syncInProgress = true;
      
      // Determine correct path based on environment
      let base;
      if (import.meta.env.PROD) {
        // In production, calculate base from pathname
        base = window.location.pathname.includes('backtest-tracker') 
          ? '/backtest-tracker/' 
          : '/';
      } else {
        // In development, use relative path
        base = './';
      }
      
      // ALWAYS add cache-busting parameter in production or when force=true
      // This prevents browsers from serving stale data
      const isProd = import.meta.env.PROD;
      const needsCacheBusting = isProd || force;
      const cacheBuster = Date.now();
      const url = needsCacheBusting 
        ? `${base}data/backtests.json?t=${cacheBuster}`
        : `${base}data/backtests.json`;
      
      console.log(`[Sync] Fetching data from: ${url}`);
      
      // Configure fetch options to prevent caching if needed
      const fetchOptions: RequestInit = needsCacheBusting ? {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      } : {};
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const repoData = await response.json();
      
      // Extract the actual data from the response
      const actualData = repoData.data || repoData;
      const validatedRepoData = cleanAndValidateData(actualData);
      
      // Compare lastUpdated timestamps
      const currentLastUpdated = parseInt(state.lastUpdated || '0');
      const repoLastUpdated = parseInt(validatedRepoData.lastUpdated || '0');
      
      if (!force && currentLastUpdated >= repoLastUpdated) {
        console.log('[Sync] Local data is up to date');
        (window as any).__syncInProgress = false;
        return { success: true, message: "Your data is up to date" };
      }
      
      // Merge data, giving priority to repo data for shared fields
      setState(prevState => ({
        ...prevState,
        ...validatedRepoData,
        lastUpdated: repoLastUpdated.toString()
      }));
      
      console.log('[Sync] Data synchronized successfully');
      (window as any).__syncInProgress = false;
      return { success: true, message: "Data synchronized successfully" };
      
    } catch (error) {
      console.error('[Sync] Error:', error);
      (window as any).__syncInProgress = false;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };

  return (
    <BacktestContext.Provider value={{
      state,
      addBacktest,
      deleteBacktest,
      addAnalysis,
      deleteAnalysis,
      exportData,
      exportToCsv,
      importData,
      syncWithRepo: handleSyncWithRepo,
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