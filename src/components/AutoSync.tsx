import React, { useState, useEffect } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Version identifier for the application code
const APP_VERSION = '1.0.0'; // Fixed version
const LAST_VERSION_KEY = 'backtest_app_version';
const LAST_SYNC_KEY = 'backtest_last_sync_time';
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

// This component handles automatic syncing with the repository
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();

  // Code version check (for app updates)
  useEffect(() => {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '0';
    
    // Only update if version changed
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
      
      // Only refresh if coming from a different version (not initial load)
      if (lastVersion !== '0' && lastVersion !== APP_VERSION) {
        console.log(`App version changed from ${lastVersion} to ${APP_VERSION}`);
        
        // Clear caches before reload
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        
        window.location.reload();
      }
    }
  }, []);

  // Data syncing logic - much less aggressive
  useEffect(() => {
    const isProd = import.meta.env.PROD;
    
    // Only check if we should sync based on time elapsed
    const shouldSync = (): boolean => {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      if (!lastSync) return true;
      
      const lastSyncTime = parseInt(lastSync, 10);
      const now = Date.now();
      
      // If more than sync interval has passed
      return (now - lastSyncTime) > SYNC_INTERVAL;
    };
    
    // Record that we've synced
    const updateSyncTime = () => {
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    };
    
    // Perform sync with minimal logging
    const performSync = async () => {
      try {
        // Only sync if needed
        if (!shouldSync()) return;
        
        // Standard sync without forcing
        await syncWithRepo(false);
        updateSyncTime();
      } catch (error) {
        // Silent fail in production
        if (!isProd) console.error('Sync error:', error);
      }
    };
    
    // Initial sync after a short delay
    const initialTimer = setTimeout(performSync, 2000);
    
    // Much less frequent periodic sync (15 min)
    const intervalTimer = setInterval(performSync, SYNC_INTERVAL);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [syncWithRepo]);
  
  // Component doesn't render anything
  return null;
};

export default AutoSync; 