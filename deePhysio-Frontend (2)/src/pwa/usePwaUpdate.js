import { useState, useEffect } from 'react';
import { pwaManager } from './PwaManager';

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(pwaManager.updateAvailable);

  useEffect(() => {
    const unsub = pwaManager.onUpdateAvailable((available) => {
      setUpdateAvailable(available);
    });
    return () => unsub();
  }, []);

  const updateApp = () => {
    pwaManager.applyUpdate();
  };

  return { updateAvailable, updateApp };
}

export default usePwaUpdate;
