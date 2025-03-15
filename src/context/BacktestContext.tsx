import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BacktestState, Backtest } from '../types';
import { format } from 'date-fns';

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
    fetchRepoDataAndSync();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('backtestData', JSON.stringify(state));
  }, [state]);

  // Calculate streak whenever dailyProgress changes
  useEffect(() => {
    calculateStreak();
  }, [state.dailyProgress]);

  // Function to fetch the latest JSON data from the repo
  const fetchRepoDataAndSync = async () => {
    try {
      // Fetch the JSON file with a cache-busting parameter
      const timestamp = new Date().getTime();
      
      console.log('Current pathname:', window.location.pathname);
      console.log('Base URL from helper:', getBaseUrl());
      
      // Try different possible paths
      const pathsToTry = [
        `${getBaseUrl()}data/backtests.json`, // Try with base URL
        `/backtest-tracker/data/backtests.json`, // Hardcoded path
        `/data/backtests.json`, // Root-relative path
        `./data/backtests.json`, // Relative path
      ];
      
      console.log('Will try these paths:', pathsToTry);
      
      let response = null;
      let url = '';
      let fetchError = null;
      
      // Try each path until one works
      for (const path of pathsToTry) {
        url = `${path}?t=${timestamp}`;
        console.log("\nAttempting fetch from:", url);
        console.log("Full URL:", new URL(url, window.location.href).href);
        
        try {
          response = await fetch(url);
          console.log(`Response for ${url}:`, {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
          });
          
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
        setState({
          ...repoData.data,
          lastUpdated: repoVersion
        });
        return { success: true, message: "Updated from repo data" };
      } else {
        console.log("Local data is up to date, local version:", localVersion, "repo version:", repoVersion);
        return { success: false, message: "Local data is up to date" };
      }
    } catch (error) {
      console.error("Error fetching repo data:", error);
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
      // If datePerformed is provided in backtestData, it will be used, otherwise use today
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
      
      return {
        ...prevState,
        dailyProgress: updatedDailyProgress,
        totalBacktests: prevState.totalBacktests + 1,
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
      
      return {
        ...prevState,
        dailyProgress: updatedDailyProgress,
        totalBacktests: prevState.totalBacktests - 1,
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