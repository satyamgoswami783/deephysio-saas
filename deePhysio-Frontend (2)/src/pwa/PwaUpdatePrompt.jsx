import React from 'react';
import { usePwaUpdate } from './usePwaUpdate';
import { FaSyncAlt, FaArrowUp } from 'react-icons/fa';

export const PwaUpdatePrompt = () => {
  const { updateAvailable, updateApp } = usePwaUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-clinicPrimary/20 flex items-center justify-center text-clinicPrimary shrink-0">
          <FaSyncAlt className="w-4 h-4 animate-spin" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">New Update Available</p>
          <p className="text-[11px] text-slate-400">Upgrade to the latest clinical release</p>
        </div>
      </div>
      <button
        onClick={updateApp}
        className="px-3.5 py-2 bg-clinicPrimary text-white rounded-xl text-xs font-bold hover:bg-clinicPrimary-dark active:scale-95 transition-all shadow-md shadow-clinicPrimary/25 flex items-center gap-1.5 shrink-0"
      >
        <FaArrowUp className="w-3 h-3" />
        Update
      </button>
    </div>
  );
};

export default PwaUpdatePrompt;
