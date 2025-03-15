import { useEffect } from 'react';
import { useBacktest } from '../context/BacktestContext';

// This component doesn't render anything, it's just for synchronization
const AutoSync: React.FC = () => {
  const { syncWithRepo } = useBacktest();

  useEffect(() => {
    const autoSync = async () => {
      try {
        console.log('AutoSync: Checking for updates...');
        await syncWithRepo();
      } catch (error) {
        console.error('AutoSync: Error checking for updates', error);
      }
    };

    // Sync when component mounts
    autoSync();

    // Also set up an interval to check every 5 minutes (for long-lived sessions)
    const intervalId = setInterval(autoSync, 5 * 60 * 1000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [syncWithRepo]);

  // This component doesn't render anything
  return null;
};

export default AutoSync; 