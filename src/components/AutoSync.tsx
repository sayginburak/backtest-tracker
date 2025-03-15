import React from 'react';
import { useBacktest } from '../context/BacktestContext';

// This component handles syncing data with the repository
// It's completely disabled in development mode to prevent any console noise
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();
  const isProd = import.meta.env.PROD;

  // Only run in production
  React.useEffect(() => {
    // Skip everything in development mode
    if (!isProd) return;
    
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