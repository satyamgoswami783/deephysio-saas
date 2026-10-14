import React, { useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { FaWifi, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const [retrying, setRetrying] = useState(false);

  if (isOnline) return null;

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 shadow-lg flex items-center justify-between z-50 text-xs font-medium sticky top-0 animate-fade-in border-b border-amber-700">
      <div className="flex items-center gap-2.5">
        <span className="p-1.5 bg-amber-700/60 rounded-full flex items-center justify-center animate-pulse">
          <FaExclamationTriangle className="w-3.5 h-3.5 text-amber-200" />
        </span>
        <div>
          <span className="font-bold tracking-wide">You are working offline.</span>{' '}
          <span className="text-amber-100 hidden sm:inline">
            Your login session is preserved. Reconnect to sync medical records.
          </span>
        </div>
      </div>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-800 rounded-md font-bold text-[11px] uppercase tracking-wider hover:bg-amber-50 active:scale-95 transition-all shrink-0"
      >
        <FaRedo className={`w-2.5 h-2.5 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Checking...' : 'Retry'}
      </button>
    </div>
  );
};

export default OfflineBanner;
