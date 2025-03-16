import React, { useEffect, useState } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Version identifier for the application code
const APP_VERSION = '1.0.1'; // Increment this for forced refreshes
const LAST_VERSION_KEY = 'backtest_app_version';
const DATA_VERSION_KEY = 'backtest_data_version';
const CHECK_INTERVAL = 30 * 1000; // 30 seconds - more aggressive!

// This component ensures data is always fresh
const AutoSync: React.FC = () => {
  const { syncWithRepo, state } = useBacktest();
  const [isInitialSync, setIsInitialSync] = useState(true);

  // Handles code version changes (app updates)
  useEffect(() => {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '0';
    
    console.log(`[AutoSync] Current app version: ${APP_VERSION}`);
    
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
      
      if (lastVersion !== '0' && lastVersion !== APP_VERSION) {
        console.log(`[AutoSync] App version changed from ${lastVersion} to ${APP_VERSION}`);
        
        // Clear caches before reload
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
            console.log('[AutoSync] Browser caches cleared');
          });
        }
        
        console.log('[AutoSync] Reloading app to apply updates...');
        window.location.reload();
      }
    }
  }, []);

  // Data sync with clear console output
  useEffect(() => {
    // Important! Track the current data version
    const currentDataVersion = state.lastUpdated || '0';
    
    // Set initial data version if not exists
    if (!localStorage.getItem(DATA_VERSION_KEY)) {
      localStorage.setItem(DATA_VERSION_KEY, currentDataVersion);
      console.log(`[AutoSync] Initial data version: ${currentDataVersion}`);
    }
    
    // Sync function with better logging
    const checkForUpdates = async () => {
      try {
        console.log('[AutoSync] Checking for data updates...');
        
        // Force sync to always check with server
        await syncWithRepo(true);
        
        // After sync, check if data version changed
        const newDataVersion = state.lastUpdated || '0';
        const lastKnownVersion = localStorage.getItem(DATA_VERSION_KEY) || '0';
        
        console.log(`[AutoSync] Data version check: current=${newDataVersion}, previous=${lastKnownVersion}`);
        
        // Update stored version if changed
        if (newDataVersion !== lastKnownVersion) {
          console.log(`[AutoSync] Data updated: ${lastKnownVersion} → ${newDataVersion}`);
          localStorage.setItem(DATA_VERSION_KEY, newDataVersion);
        } else {
          console.log('[AutoSync] No data changes detected');
        }
        
        // Extra info on first sync
        if (isInitialSync) {
          console.log('[AutoSync] Initial sync completed successfully');
          setIsInitialSync(false);
        }
      } catch (error) {
        console.error('[AutoSync] Sync error:', error);
      }
    };
    
    // Always check on mount
    console.log('[AutoSync] Starting immediate data check');
    checkForUpdates();
    
    // Continue checking periodically 
    const intervalTimer = setInterval(() => {
      console.log('[AutoSync] Running scheduled data check');
      checkForUpdates();
    }, CHECK_INTERVAL);
    
    return () => {
      clearInterval(intervalTimer);
    };
  }, [syncWithRepo, state.lastUpdated, isInitialSync]);
  
  return null;
};

export default AutoSync; 