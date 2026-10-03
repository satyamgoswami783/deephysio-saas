import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaLock, FaExclamationTriangle, FaArrowLeft, FaHome } from 'react-icons/fa';

const AccessDenied = () => {
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem('deephysio_role') || 'Unknown Role';

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-clinicLight rounded-full -ml-12 -mb-12 opacity-50" />
          
          <div className="relative p-10 text-center">
            {/* Pulsing Shield Icon */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-rose-100 rounded-3xl animate-ping opacity-20" />
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100 relative shadow-sm">
                <FaShieldAlt className="text-rose-500 text-4xl" />
                <FaLock className="absolute bottom-4 right-4 text-rose-600 text-sm" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight uppercase">Access Denied</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-amber-100">
              <FaExclamationTriangle size={10} />
              Insufficient Permissions
            </div>

            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 px-2 font-medium">
              Your account with role <span className="text-clinicPrimary font-bold uppercase">"{userRole}"</span> does not have the required authorization to access this secure clinical module.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-clinicPrimary text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-clinicPrimary/20 hover:bg-clinicPrimary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FaHome /> Return to Dashboard
              </button>
              
              <button
                onClick={() => navigate(-1)}
                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Go Back
              </button>
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <p className="mt-8 text-center text-slate-400 text-[11px] font-medium px-8">
          If you believe this is an error, please contact your System Administrator to update your professional profile permissions.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
