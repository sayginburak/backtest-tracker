import React, { useState, useEffect } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Version identifier for the application code
// This should be updated whenever a new deployment is made
const APP_VERSION = '1.0.0'; // Fixed version instead of Date.now()
const LAST_VERSION_KEY = 'backtest_app_version';

// This component handles automatic syncing with the repository
// It's configured to force update on page load to ensure the app always has the latest data
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Force update detection on page load
  useEffect(() => {
    const lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '0';
    
    // Only update localStorage if the version is different to prevent writes on every load
    if (lastVersion !== APP_VERSION) {
      // Store the current version for future checks
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
      
      // Only refresh if coming from a different version (not a fresh load)
      // This prevents refresh loops
      if (lastVersion !== '0' && lastVersion !== APP_VERSION) {
        console.log(`App version changed from ${lastVersion} to ${APP_VERSION}, refreshing...`);
        
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
    }
  }, []);

  // Force data sync on page load and periodically
  useEffect(() => {
    // Function to sync data with force update
    const performSync = async (force = false) => {
      try {
        // Force sync will bypass version checking
        const result = await syncWithRepo(force);
        
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
                  syncWithRepo(true);
                });
              } else {
                // Basic retry if cache API isn't available
                syncWithRepo(true);
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