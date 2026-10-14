import { useState, useEffect } from 'react';
import { networkManager } from './NetworkManager';

export function useNetworkStatus() {
  const [status, setStatus] = useState({
    isOnline: networkManager.isOnline,
    connectionType: networkManager.connectionType
  });

  useEffect(() => {
    const unsubscribe = networkManager.addListener((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  return status;
}

export default useNetworkStatus;
