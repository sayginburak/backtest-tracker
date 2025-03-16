import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BacktestState, Backtest } from '../types';
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
  exportData: () => string;
  importData: (jsonData: string) => void;
  syncWithRepo: (force?: boolean) => Promise<SyncResult>;
}

// Initial state
const initialState: BacktestState = {
  dailyProgress: {},
  currentStreak: 0,
  totalBacktests: 0,
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
      total += day.backtests.length;
    });
    
    if (total !== state.totalBacktests) {
      setState(prev => ({ ...prev, totalBacktests: total }));
    }
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
    
    // Check if today or yesterday is complete
    const hasRecentComplete = state.dailyProgress[today]?.isComplete || 
                             state.dailyProgress[yesterday]?.isComplete;
    
    if (!hasRecentComplete) {
      setState(prev => ({ ...prev, currentStreak: 0 }));
      return;
    }
    
    // Count consecutive days
    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const progress = state.dailyProgress[date];
      
      if (progress.isComplete) {
        streak++;
      } else {
        break;
      }
    }
    
    setState(prev => ({ ...prev, currentStreak: streak }));
  };

  // Add a new backtest
  const addBacktest = (backtestData: Omit<Backtest, 'id'>) => {
    const performDate = backtestData.datePerformed || format(new Date(), 'yyyy-MM-dd');
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    setState(prevState => {
      const updatedDailyProgress = { ...prevState.dailyProgress };
      const dayProgress = updatedDailyProgress[performDate] || { 
        date: performDate, 
        backtests: [], 
        isComplete: false 
      };
      
      const updatedBacktests = [...dayProgress.backtests, { ...backtestData, id }];
      
      updatedDailyProgress[performDate] = {
        ...dayProgress,
        backtests: updatedBacktests,
        isComplete: updatedBacktests.length >= 5,
      };
      
      // Calculate new total
      let newTotal = 0;
      Object.values(updatedDailyProgress).forEach(day => {
        newTotal += day.backtests.length;
      });
      
      return {
        ...prevState,
        dailyProgress: updatedDailyProgress,
        totalBacktests: newTotal,
        lastUpdated: Date.now().toString(),
      };
    });
  };

  // Delete a backtest
  const deleteBacktest = (id: string) => {
    setState(prevState => {
      // Find which day contains this backtest
      let targetDate: string | null = null;
      const updatedDailyProgress = { ...prevState.dailyProgress };
      
      for (const date in updatedDailyProgress) {
        if (updatedDailyProgress[date].backtests.some(bt => bt.id === id)) {
          targetDate = date;
          break;
        }
      }
      
      if (!targetDate) return prevState;
      
      // Update the day's backtests
      const dayProgress = updatedDailyProgress[targetDate];
      const updatedBacktests = dayProgress.backtests.filter(bt => bt.id !== id);
      
      updatedDailyProgress[targetDate] = {
        ...dayProgress,
        backtests: updatedBacktests,
        isComplete: updatedBacktests.length >= 5,
      };
      
      // Calculate new total
      let newTotal = 0;
      Object.values(updatedDailyProgress).forEach(day => {
        newTotal += day.backtests.length;
      });
      
      return {
        ...prevState,
        dailyProgress: updatedDailyProgress,
        totalBacktests: newTotal,
        lastUpdated: Date.now().toString(),
      };
    });
  };

  // Export data to JSON
  const exportData = (): string => {
    return JSON.stringify({
      version: Date.now().toString(),
      data: state
    }, null, 2);
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

  // Sync with repository data - modified to work in both development and production
  const syncWithRepo = async (force: boolean = false): Promise<SyncResult> => {
    try {
      // Simple flag to prevent multiple syncs
      if ((window as any).__syncInProgress) {
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
      
      // Add cache-busting parameter
      const cacheBuster = Date.now();
      const url = `${base}data/backtests.json?t=${cacheBuster}`;
      
      // Single fetch attempt
      console.log(`Syncing data from: ${url}`);
      const response = await fetch(url, {
        // Ensure we're not getting cached responses
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.warn(`Sync failed: ${response.status} ${response.statusText}`);
        (window as any).__syncInProgress = false;
        return { 
          success: false, 
          message: `Failed to fetch data: ${response.status}` 
        };
      }
      
      // Parse the data
      const repoData = await response.json();
      const repoState = repoData.data;
      
      // Validate data before processing
      try {
        // Validate dates in the data
        Object.keys(repoState.dailyProgress).forEach(dateKey => {
          const day = repoState.dailyProgress[dateKey];
          
          // Validate and filter out entries with invalid dates
          day.backtests = day.backtests.filter((backtest: any) => {
            try {
              // Check if dates are valid by trying to parse them
              if (backtest.backtestDate) {
                const date = new Date(backtest.backtestDate);
                if (isNaN(date.getTime())) {
                  console.error(`Invalid backtestDate: ${backtest.backtestDate} - Skipping entry`);
                  return false;
                }
              }
              
              if (backtest.datePerformed) {
                const date = new Date(backtest.datePerformed);
                if (isNaN(date.getTime())) {
                  console.error(`Invalid datePerformed: ${backtest.datePerformed} - Skipping entry`);
                  return false;
                }
              }
              
              // Entry passed validation
              return true;
            } catch (error) {
              console.error(`Error validating backtest: ${error}`);
              return false;
            }
          });
        });
      } catch (error) {
        console.error("Data validation error:", error);
        // Continue with sync despite validation errors
      }
      
      // Only update if there's a meaningful difference or force is true
      const currentVersion = state.lastUpdated || '0';
      if (force || repoData.version > currentVersion) {
        console.log(`Updating from version ${currentVersion} to ${repoData.version}`);
        
        // Calculate actual backtest count from repo data
        let repoBacktestCount = 0;
        Object.values(repoState.dailyProgress).forEach((day: any) => {
          repoBacktestCount += day.backtests.length;
        });
        
        // Update state with the correct count
        setState({
          ...repoState,
          totalBacktests: repoBacktestCount,
          lastUpdated: repoData.version
        });
        
        (window as any).__syncInProgress = false;
        return { success: true, message: "Data updated from repository" };
      }
      
      console.log("Local data is already up-to-date");
      (window as any).__syncInProgress = false;
      return { success: true, message: "Local data is up to date" };
    } catch (error) {
      console.error("Error during sync:", error);
      (window as any).__syncInProgress = false;
      return { 
        success: false, 
        message: "Error syncing with repository" 
      };
    }
  };

  return (
    <BacktestContext.Provider value={{ 
      state, 
      addBacktest, 
      deleteBacktest, 
      exportData, 
      importData, 
      syncWithRepo 
    }}>
      {children}
    </BacktestContext.Provider>
  );
};

// Hook to access the context
export const useBacktest = () => {
  const context = useContext(BacktestContext);
  if (context === undefined) {
    throw new Error('useBacktest must be used within a BacktestProvider');
  }
  return context;
}; 