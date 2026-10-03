import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { 
  FaRupeeSign, FaChartBar, FaUserTie, FaUserCheck, FaUserClock, 
  FaUserTimes, FaBullseye, FaArrowUp, FaArrowDown, FaClock, FaBan
} from 'react-icons/fa';

const StatCard = ({ title, value, icon, iconBg, iconColor, gradFrom, borderGrad, trendIcon, trendValue, trendText, trendColor, trendBg }) => (
  <div className="p-5 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full relative overflow-hidden group">
    {/* Decorative Background Blob */}
    <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${gradFrom} to-transparent opacity-40 rounded-bl-[100px] transition-transform duration-500 group-hover:scale-125 group-hover:opacity-60`} />
    
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
    
    {trendValue && (
      <div className="flex items-center gap-2 mt-4 text-[10px] font-semibold relative z-10">
        <span className={`flex items-center gap-1 ${trendColor} ${trendBg} px-2 py-1 rounded-md border border-white/50`}>
          {trendIcon} {trendValue}
        </span>
        <span className="text-slate-400 font-medium">{trendText}</span>
      </div>
    )}
    
    {/* Bottom animated border */}
    <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${borderGrad} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500`} />
  </div>
);

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [revRes, tenRes] = await Promise.all([
          fetchApi('/saas/revenue'),
          fetchApi('/saas/tenants')
        ]);
        const revResult = await revRes.json();
        const tenResult = await tenRes.json();
        
        if (revResult.success) setStats(revResult.data);
        if (tenResult.success) setTenants(tenResult.data);
      } catch (error) {
        showToast('Error loading dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAdmins = tenants.length;
  const activePaidAdmins = tenants.filter(t => t.subscription_status === 'active').length;
  const trialAdmins = tenants.filter(t => t.subscription_status === 'trial').length;
  const expiredAdmins = tenants.filter(t => t.subscription_status === 'canceled' || t.subscription_status === 'expired').length;

  const totalRevenue = stats?.mrr || 0;

  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen font-sans animate-fade-in custom-scrollbar bg-slate-50/50">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Super Admin · Business Overview
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard 
          title="TOTAL REVENUE" 
          value={loading ? "..." : `₹${totalRevenue}`} 
          icon={<FaRupeeSign className="text-lg" />} 
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          gradFrom="from-blue-500"
          borderGrad="from-blue-400 to-blue-600"
        />
        <StatCard 
          title="MONTHLY REVENUE" 
          value={loading ? "..." : `₹${totalRevenue}`} 
          icon={<FaChartBar className="text-lg" />} 
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          gradFrom="from-emerald-500"
          borderGrad="from-emerald-400 to-emerald-600"
        />
        <StatCard 
          title="TOTAL ADMINS" 
          value={loading ? "..." : totalAdmins} 
          icon={<FaUserTie className="text-lg" />} 
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          gradFrom="from-indigo-500"
          borderGrad="from-indigo-400 to-indigo-600"
        />
        <StatCard 
          title="ACTIVE PAID ADMINS" 
          value={loading ? "..." : activePaidAdmins} 
          icon={<FaUserCheck className="text-lg" />} 
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          gradFrom="from-teal-500"
          borderGrad="from-teal-400 to-teal-600"
        />
        <StatCard 
          title="FREE TRIAL ADMINS" 
          value={loading ? "..." : trialAdmins} 
          icon={<FaUserClock className="text-lg" />} 
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          gradFrom="from-amber-500"
          borderGrad="from-amber-400 to-amber-600"
        />
        <StatCard 
          title="EXPIRED / BLOCKED" 
          value={loading ? "..." : expiredAdmins} 
          icon={<FaUserTimes className="text-lg" />} 
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
          gradFrom="from-rose-500"
          borderGrad="from-rose-400 to-rose-600"
        />
        <StatCard 
          title="OPEN TICKETS" 
          value={loading ? "..." : 0} 
          icon={<FaBullseye className="text-lg" />} 
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
          gradFrom="from-sky-500"
          borderGrad="from-sky-400 to-sky-600"
        />
      </div>

      {/* Mid Section Banner */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 flex flex-col md:flex-row justify-between items-center text-white border border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-[shimmer_2s_infinite]"></div>

        <div className="flex flex-col items-center flex-1 py-2 md:py-0 relative z-10">
          <span className="text-3xl font-black mb-1 drop-shadow-md">{loading ? "..." : `₹${totalRevenue}`}</span>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Total Revenue</span>
        </div>
        <div className="hidden md:block w-px h-16 bg-white/20 relative z-10"></div>
        <div className="flex flex-col items-center flex-1 py-4 md:py-0 relative z-10">
          <span className="text-3xl font-black mb-1 drop-shadow-md">{loading ? "..." : `₹${totalRevenue}`}</span>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Monthly Run Rate</span>
        </div>
        <div className="hidden md:block w-px h-16 bg-white/20 relative z-10"></div>
        <div className="flex flex-col items-center flex-1 py-2 md:py-0 relative z-10">
          <span className="text-3xl font-black mb-1 drop-shadow-md">{loading ? "..." : totalAdmins}</span>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Total Admins</span>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><FaBan /></div>
              Subscription Alerts
            </h2>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button className="bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 flex items-center gap-2">
                <span>🚀</span> Bulk Send Reminders
              </button>
              <button className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:shadow hover:bg-slate-50 transition-all active:scale-95">
                Export ▾
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">Clinic Name</th>
                  <th className="p-4 text-center">Owner Details</th>
                  <th className="p-4 text-center">Date</th>
                  <th className="p-4 text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-600 divide-y divide-slate-50">
                {loading ? (
                   <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading records...</td></tr>
                ) : tenants.filter(t => ['trial', 'canceled', 'expired'].includes(t.subscription_status)).length > 0 ? (
                  tenants.filter(t => ['trial', 'canceled', 'expired'].includes(t.subscription_status)).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 pl-6 font-bold text-slate-700 group-hover:text-rose-600 transition-colors">{t.name}</td>
                      <td className="p-4 text-center">
                        <div className="text-slate-800 font-bold">{t.admin?.name || 'Owner'}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{t.admin?.phone || 'No Phone'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-rose-500 font-black">{new Date(t.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <span className={`px-3 py-1 rounded-md border font-bold inline-flex items-center gap-1 ${
                          t.subscription_status === 'trial' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            t.subscription_status === 'trial' ? 'bg-blue-500' : 'bg-rose-500'
                          }`}></div>
                          {t.current_plan || (t.subscription_status === 'trial' ? 'Trial' : 'Expired')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 font-medium text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FaUserCheck className="text-3xl text-slate-200" />
                        All subscriptions are active and healthy!
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
