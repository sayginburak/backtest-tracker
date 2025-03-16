import React, { useEffect, useRef } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Version identifier for the application code
// This should only be incremented when there's a change that requires a client refresh
const APP_VERSION = '1.0.7';
const LAST_VERSION_KEY = 'backtest_app_version';
const LAST_SYNC_KEY = 'backtest_last_sync_time';

// How long to wait before checking for updates again (24 hours) - only used in development
const SYNC_INTERVAL = 24 * 60 * 60 * 1000;

const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();
  const syncInProgressRef = useRef(false);
  const hasCompletedInitialSyncRef = useRef(false);
  const isProd = import.meta.env.PROD;
  
  // Handle app version changes (code updates)
  useEffect(() => {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '0';
    
    console.log(`[AutoSync] Current app version: ${APP_VERSION}`);
    
    // Store the current version
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
      
      // Only reload if this isn't the first visit (lastVersion !== '0')
      // and the version has changed
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

  // Data sync - behavior differs between production and development
  useEffect(() => {
    // Check if we should sync based on environment and time elapsed
    const shouldSync = () => {
      // In production, always sync on page load
      if (isProd) {
        return true;
      }
      
      // In development, use the time-based approach
      const lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
      
      if (!lastSyncTime) {
        return true; // Always sync if we've never synced before
      }
      
      const lastSync = parseInt(lastSyncTime, 10);
      const timeSinceLastSync = Date.now() - lastSync;
      
      return timeSinceLastSync > SYNC_INTERVAL;
    };
    
    // Perform sync with controlled logging
    const performSync = async () => {
      // Prevent multiple simultaneous syncs
      if (syncInProgressRef.current || hasCompletedInitialSyncRef.current) {
        return;
      }
      
      try {
        syncInProgressRef.current = true;
        console.log(`[AutoSync] Checking for data updates... (in ${isProd ? 'production' : 'development'})`);
        
        // ALWAYS use force=true in production to bypass cache
        // In development, we still use the less aggressive approach
        const result = await syncWithRepo(isProd ? true : false);
        
        if (result.success) {
          console.log('[AutoSync] Sync completed successfully');
          localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        } else {
          console.warn(`[AutoSync] Sync failed: ${result.message}`);
        }
        
        // Mark that we've completed the initial sync
        hasCompletedInitialSyncRef.current = true;
      } catch (error) {
        console.error('[AutoSync] Error during sync:', error);
      } finally {
        syncInProgressRef.current = false;
      }
    };
    
    // Only sync if needed
    if (shouldSync()) {
      console.log(`[AutoSync] Performing data sync (${isProd ? 'Production mode - always sync with cache busting' : 'Development mode - sync if needed'})`);
      performSync();
    } else {
      console.log('[AutoSync] Skipping sync - data is recent (Development mode)');
      hasCompletedInitialSyncRef.current = true;
    }
    
    // Cleanup function isn't needed anymore
    return () => {};
    
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return null;
};

export default AutoSync; 