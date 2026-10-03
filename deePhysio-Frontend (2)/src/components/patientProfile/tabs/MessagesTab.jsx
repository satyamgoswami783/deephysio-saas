import React from 'react';
import { FaEnvelope, FaPlus } from 'react-icons/fa';

const MessagesTab = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in duration-300">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
        <FaEnvelope className="text-slate-400" size={14} /> Communication History
      </h3>
      <button className="flex items-center gap-1.5 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-clinicPrimary/90 transition-all">
        <FaPlus size={10} /> Send Message
      </button>
    </div>
    <div className="p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 mb-4">
        <FaEnvelope size={24} />
      </div>
      <h4 className="text-[14px] font-bold text-slate-700">Messages coming soon</h4>
      <p className="text-[12px] text-slate-400 max-w-[250px] mx-auto mt-1 mb-4 leading-relaxed">
        Communication history through SMS and Email will appear here.
      </p>
    </div>
  </div>
);

export default MessagesTab;
