import React from 'react';
import { useBacktest } from '../context/BacktestContext';

// This component handles automatic syncing with the repository
// It's configured to only run automatic syncing in production
// Manual syncing via UI controls still works in both environments
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();
  const isProd = import.meta.env.PROD;

  // Only run automatic syncing in production
  React.useEffect(() => {
    // Skip automatic syncing in development mode to prevent console clutter
    if (!isProd) {
      // Log only once that automatic syncing is disabled
      console.log('AutoSync: Automatic syncing is disabled in development mode');
      console.log('You can still manually sync data using the UI controls');
      return;
    }
    
    // Function to sync data
    const performSync = async () => {
      try {
        await syncWithRepo();
      } catch (error) {
        // Silent fail in production
      }
    };
    
    // Initial sync after 3 seconds
    const initialTimer = setTimeout(performSync, 3000);
    
    // Periodic sync every 15 minutes (only in production)
    const intervalTimer = setInterval(performSync, 15 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isProd, syncWithRepo]);
  
  // Component doesn't render anything
  return null;
};

export default AutoSync; 