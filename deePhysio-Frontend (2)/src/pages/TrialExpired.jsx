import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCalendarTimes, FaCreditCard, FaHeadset, FaSignOutAlt } from 'react-icons/fa';

const TrialExpired = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-outfit">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center">
        <div className="bg-rose-50 p-8 border-b border-rose-100">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCalendarTimes size={36} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Trial Expired</h1>
          <p className="text-slate-600 font-medium">Your 7-Day Free Trial has ended. Please upgrade your plan to continue accessing your clinic dashboard.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/#pricing')} 
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-clinicPrimary/20 bg-clinicPrimary/5 hover:bg-clinicPrimary hover:text-white hover:border-clinicPrimary transition-all group cursor-pointer"
            >
              <FaCreditCard size={24} className="text-clinicPrimary group-hover:text-white mb-3 transition-colors" />
              <span className="font-bold text-sm">Buy Plan Now</span>
              <span className="text-xs opacity-70 mt-1">Upgrade your workspace</span>
            </button>
            <button 
              onClick={() => navigate('/#pricing')} 
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <FaLock size={24} className="text-slate-400 mb-3" />
              <span className="font-bold text-sm text-slate-700">View Plans</span>
              <span className="text-xs text-slate-500 mt-1">Compare pricing options</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-100">
            <button onClick={() => navigate('/support')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-clinicPrimary transition-colors cursor-pointer">
              <FaHeadset /> Contact Support
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-rose-500 transition-colors">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpired;
