import React, { useState, useEffect } from 'react';
import { pwaManager } from './PwaManager';
import { isPwa, isNative } from '../mobile/platform';
import { FaDownload, FaTimes } from 'react-icons/fa';

export const PwaInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // If running inside Capacitor native shell or already installed PWA, do not show install prompt
    if (isNative || isPwa()) {
      return;
    }

    const unsub = pwaManager.onInstallAvailable((available) => {
      setCanInstall(available);
    });
    return () => unsub();
  }, []);

  if (!canInstall || dismissed) return null;

  const handleInstall = async () => {
    await pwaManager.promptInstall();
    setCanInstall(false);
  };

  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between z-40 text-xs border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-clinicPrimary flex items-center justify-center text-white shrink-0">
          <FaDownload className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-bold text-slate-100">Install ClinicPilot App</span>
          <span className="hidden sm:inline text-slate-400 ml-1.5">
            Add to home screen for faster offline access and fullscreen experience.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1 bg-clinicPrimary text-white rounded-md font-bold text-[11px] uppercase tracking-wider hover:bg-clinicPrimary-dark active:scale-95 transition-all"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          title="Dismiss"
        >
          <FaTimes className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
