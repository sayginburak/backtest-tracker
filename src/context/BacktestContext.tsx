import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BacktestState, Backtest } from '../types';
import { format } from 'date-fns';

// Config to control sync behavior
const SYNC_CONFIG = {
  // Only enable auto-sync in production, never in development
  AUTO_SYNC_ENABLED: import.meta.env.PROD,
  // Longer delay to prevent rapid syncing
  INITIAL_SYNC_DELAY: 2000,
  // Limit fetch attempts
  MAX_FETCH_ATTEMPTS: 2,
};

// Helper function to get the base URL for the application
const getBaseUrl = (): string => {
  // Get the base URL from the current location
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  
  // If we're in the preview server or GitHub Pages
  if (pathSegments[0] === 'backtest-tracker') {
    return '/backtest-tracker/';
  }
  
  // If we're in development
  return '/';
};

interface SyncResult {
  success: boolean;
  message: string;
}

interface BacktestContextType {
  state: BacktestState;
  addBacktest: (backtest: Omit<Backtest, 'id'>) => void;
  deleteBacktest: (id: string) => void;
  exportData: () => string;
  importData: (jsonData: string) => void;
  syncWithRepo: () => Promise<SyncResult>;
}

const initialState: BacktestState = {
  dailyProgress: {},
  currentStreak: 0,
  totalBacktests: 0,
  lastUpdated: Date.now().toString(),
};

const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

export const BacktestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BacktestState>(() => {
    // Try to load from localStorage on initial render
    const savedData = localStorage.getItem('backtestData');
    const localData = savedData ? JSON.parse(savedData) : initialState;
    
    return localData;
  });

  // Try to sync with repo data when component mounts
  useEffect(() => {
    // Skip auto-sync completely in development mode
    if (!SYNC_CONFIG.AUTO_SYNC_ENABLED) {
      console.log('Auto-sync disabled in development mode');
      return;
    }
    
    // Only run once on mount with longer delay in production
    const timer = setTimeout(() => {
      console.log('Performing initial data sync');
      fetchRepoDataAndSync();
    }, SYNC_CONFIG.INITIAL_SYNC_DELAY);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once

  // Calculate streak whenever dailyProgress changes
  useEffect(() => {
    // Use a debounce mechanism to avoid rapid recalculations
    const timer = setTimeout(() => {
      calculateStreak();
      recalculateTotalBacktests();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [state.dailyProgress]);

  // Save to localStorage whenever state changes, but debounced to reduce frequency
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('backtestData', JSON.stringify(state));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [state]);

  // Function to recalculate the total number of backtests
  const recalculateTotalBacktests = () => {
    let total = 0;
    Object.values(state.dailyProgress).forEach(day => {
      total += day.backtests.length;
    });
    
    if (total !== state.totalBacktests) {
      console.log('Updating total backtests count:', { previous: state.totalBacktests, new: total });
      setState(prev => ({ ...prev, totalBacktests: total }));
    }
  };

  // Function to fetch the latest JSON data from the repo
  const fetchRepoDataAndSync = async () => {
    // Add debounce flag to prevent multiple syncs
    if ((window as any).__isSyncing) {
      console.log('Sync already in progress, skipping');
      return { success: false, message: "Sync already in progress" };
    }
    
    (window as any).__isSyncing = true;
    
    try {
      // Fetch the JSON file with a cache-busting parameter
      const timestamp = new Date().getTime();
      
      // In development mode, only try the local data path
      const pathsToTry = import.meta.env.DEV
        ? ['./data/backtests.json'] // Only try local path in dev
        : [
            `${getBaseUrl()}data/backtests.json`, 
            `/backtest-tracker/data/backtests.json`,
          ];
      
      console.log('Will try these paths:', pathsToTry);
      
      let response = null;
      let url = '';
      let fetchError = null;
      let attemptCount = 0;
      
      // Try each path until one works, but limit attempts
      for (const path of pathsToTry) {
        if (attemptCount >= SYNC_CONFIG.MAX_FETCH_ATTEMPTS) {
          console.log('Reached maximum fetch attempts, stopping');
          break;
        }
        
        attemptCount++;
        url = `${path}?t=${timestamp}`;
        
        try {
          console.log(`Attempt ${attemptCount}: Fetching from ${url}`);
          response = await fetch(url);
          
          if (response.ok) {
            console.log("Successfully fetched from:", url);
            break; // Exit the loop if fetch is successful
          } else {
            console.warn(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`Error fetching from ${url}:`, error);
          fetchError = error;
        }
      }
      
      // If all fetch attempts failed
      if (!response || !response.ok) {
        console.error('All fetch attempts failed. Last URL attempted:', url);
        if (fetchError) console.error('Last error:', fetchError);
        (window as any).__isSyncing = false;
        return { 
          success: false, 
          message: response 
            ? `Failed to fetch: ${response.status} ${response.statusText}` 
            : 'Failed to fetch data file from all paths' 
        };
      }
      
      const repoData = await response.json();
      console.log('Successfully parsed JSON data:', repoData);
      
      // In production, always use the repo data
      const isProd = import.meta.env.PROD;
      const repoVersion = repoData.version;
      const localVersion = state.lastUpdated || "0";
      
      console.log('Environment and version info:', {
        isProd,
        repoVersion,
        localVersion,
        willUpdate: isProd || parseInt(repoVersion) > parseInt(localVersion)
      });
      
      // Always use repo data in production, or if repo version is newer in development
      if (isProd || parseInt(repoVersion) > parseInt(localVersion)) {
        console.log("Using repo data because:", isProd ? "production mode" : "newer version");
        
        // Check if the data is actually different before updating state
        const repoTotalBacktests = repoData.data.totalBacktests;
        let repoDailyBacktestsCount = 0;
        
        Object.values(repoData.data.dailyProgress).forEach((day: any) => {
          repoDailyBacktestsCount += day.backtests.length;
        });
        
        // Only update if there's a meaningful difference in the data
        if (repoTotalBacktests !== state.totalBacktests || repoDailyBacktestsCount !== state.totalBacktests) {
          console.log("Updating state with repo data. Previous count:", state.totalBacktests, "New count:", repoDailyBacktestsCount);
          
          // Make sure totalBacktests is set to match the actual count
          const updatedData = {
            ...repoData.data,
            totalBacktests: repoDailyBacktestsCount,
            lastUpdated: repoVersion
          };
          
          setState(updatedData);
          (window as any).__isSyncing = false;
          return { success: true, message: "Updated from repo data" };
        } else {
          console.log("Repo data has same backtest count, skipping update");
          (window as any).__isSyncing = false;
          return { success: false, message: "No meaningful difference in data" };
        }
      } else {
        console.log("Local data is up to date, local version:", localVersion, "repo version:", repoVersion);
        (window as any).__isSyncing = false;
        return { success: false, message: "Local data is up to date" };
      }
    } catch (error) {
      console.error("Error fetching repo data:", error);
      (window as any).__isSyncing = false;
      return { success: false, message: "Error fetching repo data" };
    }
  };

  const calculateStreak = () => {
    // Implementation for calculating the current streak
    // This will be calculated based on consecutive days with isComplete = true
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

  const addBacktest = (backtestData: Omit<Backtest, 'id'>) => {
    // Use the datePerformed from the input or default to today
    const performDate = backtestData.datePerformed || format(new Date(), 'yyyy-MM-dd');
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newBacktest: Backtest = {
      ...backtestData,
      id,
    };
    
    setState(prevState => {
      const updatedDailyProgress = { ...prevState.dailyProgress };
      const dayProgress = updatedDailyProgress[performDate] || { 
        date: performDate, 
        backtests: [], 
        isComplete: false 
      };
      
      const updatedBacktests = [...dayProgress.backtests, newBacktest];
      const isComplete = updatedBacktests.length >= 5;
      
      updatedDailyProgress[performDate] = {
        ...dayProgress,
        backtests: updatedBacktests,
        isComplete,
      };
      
      // Calculate the new total directly instead of incrementing
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

  const deleteBacktest = (id: string) => {
    setState(prevState => {
      const updatedDailyProgress = { ...prevState.dailyProgress };
      
      // Find which day this backtest belongs to
      let targetDate: string | null = null;
      for (const date in updatedDailyProgress) {
        if (updatedDailyProgress[date].backtests.some(bt => bt.id === id)) {
          targetDate = date;
          break;
        }
      }
      
      if (!targetDate) return prevState;
      
      const dayProgress = updatedDailyProgress[targetDate];
      const updatedBacktests = dayProgress.backtests.filter(bt => bt.id !== id);
      
      updatedDailyProgress[targetDate] = {
        ...dayProgress,
        backtests: updatedBacktests,
        isComplete: updatedBacktests.length >= 5,
      };
      
      // Calculate the new total directly
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

  const exportData = (): string => {
    const exportObj = {
      version: Date.now().toString(),
      data: state
    };
    return JSON.stringify(exportObj, null, 2);
  };

  const importData = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      // Handle both formats: direct state object or {version, data} format
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

  // Function to manually sync with repo
  const syncWithRepo = async (): Promise<SyncResult> => {
    // In development, warn when auto-syncing is disabled
    if (import.meta.env.DEV && !SYNC_CONFIG.AUTO_SYNC_ENABLED) {
      console.log('Note: Auto-sync is disabled in development mode. This is a manual sync.');
    }
    
    return fetchRepoDataAndSync();
  };

  return (
    <BacktestContext.Provider value={{ state, addBacktest, deleteBacktest, exportData, importData, syncWithRepo }}>
      {children}
    </BacktestContext.Provider>
  );
};

export const useBacktest = () => {
  const context = useContext(BacktestContext);
  if (context === undefined) {
    throw new Error('useBacktest must be used within a BacktestProvider');
  }
  return context;
}; 