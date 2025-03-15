import { useEffect } from 'react';
import { useBacktest } from '../context/BacktestContext';

// Configuration for auto-sync behavior
const AUTO_SYNC_CONFIG = {
  // Only enable in production
  ENABLED: import.meta.env.PROD,
  // Initial delay before first sync (ms)
  INITIAL_DELAY: 5000,
  // Interval between syncs (ms)
  INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// This component doesn't render anything, it's just for synchronization
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();

  useEffect(() => {
    // Skip completely in development mode
    if (!AUTO_SYNC_CONFIG.ENABLED) {
      console.log('AutoSync: Disabled in development mode');
      return;
    }

    const autoSync = async () => {
      try {
        console.log('AutoSync: Checking for updates...');
        await syncWithRepo();
      } catch (error) {
        console.error('AutoSync: Error checking for updates', error);
      }
    };

    // Sync when component mounts, but with a delay
    const initialSyncTimer = setTimeout(() => {
      console.log('AutoSync: Performing initial sync');
      autoSync();
    }, AUTO_SYNC_CONFIG.INITIAL_DELAY);

    // Also set up an interval to check periodically (for long-lived sessions)
    const intervalId = setInterval(autoSync, AUTO_SYNC_CONFIG.INTERVAL);

    // Clean up the interval when component unmounts
    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(intervalId);
    };
  }, [syncWithRepo]);

  // This component doesn't render anything
  return null;
};

export default AutoSync; 