import React, { useState, useEffect } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Version identifier for the application code
// This should be updated whenever a new deployment is made
const APP_VERSION = Date.now().toString();
const LAST_VERSION_KEY = 'backtest_app_version';

// This component handles automatic syncing with the repository
// It's configured to force update on page load to ensure the app always has the latest data
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Force update detection on page load
  useEffect(() => {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '0';
    
    // Always store the current version for future checks
    localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    
    // Function to perform a hard refresh if needed
    const checkForCodeUpdates = () => {
      // If lastVersion doesn't match current and we're not in a fresh session
      if (lastVersion !== '0' && lastVersion !== APP_VERSION) {
        console.log('App version changed, refreshing...');
        
        // Clear any caches before forcing reload
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // Force reload without cache
        window.location.reload();
      }
    };
    
    // Check for code updates
    checkForCodeUpdates();
  }, []);

  // Force data sync on page load and periodically
  useEffect(() => {
    // Function to sync data with force update
    const performSync = async (force = false) => {
      try {
        // Force sync will bypass version checking
        const result = await syncWithRepo();
        
        // Update initial sync status after first attempt
        if (!initialSyncDone) {
          setInitialSyncDone(true);
          
          // If force was true but sync failed, try once more with cache-busting
          if (force && !result.success) {
            // Add a small delay before retry
            setTimeout(() => {
              console.log('Initial sync failed, retrying with cache-busting...');
              
              // Clear fetch cache if possible
              if ('caches' in window) {
                caches.open('v1').then(cache => {
                  // Delete any cached data JSON files
                  cache.delete('/data/backtests.json');
                  cache.delete('./data/backtests.json');
                  cache.delete(`${window.location.origin}/data/backtests.json`);
                  
                  // Try sync again
                  syncWithRepo();
                });
              } else {
                // Basic retry if cache API isn't available
                syncWithRepo();
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    };
    
    // Initial sync immediately with force flag
    performSync(true);
    
    // Periodic sync every 5 minutes
    const intervalTimer = setInterval(() => performSync(false), 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalTimer);
    };
  }, [syncWithRepo, initialSyncDone]);
  
  // Component doesn't render anything
  return null;
};

export default AutoSync; 