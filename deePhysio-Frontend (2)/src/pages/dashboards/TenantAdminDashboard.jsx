import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaCalendarAlt, FaFileInvoice, FaChartLine, 
  FaUserFriends, FaSync, FaCalendarCheck, FaUserPlus, FaDatabase,
  FaArrowRight, FaClock
} from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import ClinicalNoteIcon from '../../components/ui/ClinicalNoteIcon';
import UpgradePlanModal from '../../components/UpgradePlanModal';
import { formatCurrency } from '../../utils/currency';

const StatCard = ({ title, value, icon, color, trend, path, highlight, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-3 bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl flex flex-col items-start cursor-pointer transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80 relative overflow-hidden group ${highlight ? 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-slate-50' : ''}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className={`absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${color}`} />
    
    <div className="w-full flex justify-between items-start mb-2 relative z-10">
      <div className={`w-7 h-7 flex items-center justify-center rounded-lg bg-opacity-10 ${color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm border border-white/50`}>
        <span className={`text-[13px] ${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
      {trend && (
        <div className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-slate-50/80 text-slate-500 border border-slate-200 shadow-sm">
          {trend}
        </div>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 text-[9px] font-extrabold uppercase tracking-widest mb-0.5 group-hover:text-slate-800 transition-colors">{title}</p>
      <h3 className="text-[20px] font-black text-slate-800 tabular-nums tracking-tighter drop-shadow-sm group-hover:scale-105 transform origin-left transition-transform duration-300 truncate max-w-full">{value}</h3>
    </div>
    
    <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-${color.replace('bg-','')} to-transparent opacity-0 transform scale-x-0 group-hover:scale-x-100 group-hover:opacity-100 transition-all origin-center duration-500`} />
  </div>
);

const TenantAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    revenue: 0,
    pendingBills: 0,
    staff: 1
  });
  const [tenantInfo, setTenantInfo] = useState(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('deephysio_user') || '{}');
      return user?.tenant || null;
    } catch (_) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [patRes, apptRes, invRes, userRes, meRes] = await Promise.all([
          fetchApi('/patients'),
          fetchApi('/appointments'),
          fetchApi('/invoices'),
          fetchApi('/users'),
          fetchApi('/users/me')
        ]);

        const patients = patRes?.ok ? (await patRes.json()).data || [] : [];
        const allAppointments = apptRes?.ok ? (await apptRes.json()).data || [] : [];
        const invoices = invRes?.ok ? (await invRes.json()).data || [] : [];
        const users = userRes?.ok ? (await userRes.json()).data || [] : [];

        if (meRes?.ok) {
          const meData = await meRes.json();
          if (meData?.data?.tenant) {
            setTenantInfo(meData.data.tenant);
            try {
              const curUser = JSON.parse(sessionStorage.getItem('deephysio_user') || '{}');
              sessionStorage.setItem('deephysio_user', JSON.stringify({ ...curUser, tenant: meData.data.tenant }));
            } catch (_) {}
          }
        }

        // Count today's appointments
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = allAppointments.filter(a => {
          if (!a.appointment_date) return false;
          return a.appointment_date.split('T')[0] === todayStr;
        });

        let revenue = 0;
        let pending = 0;
        invoices.forEach(inv => {
          if (inv.status === 'paid') revenue += parseFloat(inv.total || 0);
          if (inv.status === 'pending' || inv.status === 'overdue') pending += parseFloat(inv.balance_due || inv.total || 0);
        });

        setStats({
          patients: patients.length,
          appointments: todayAppts.length,
          revenue,
          pendingBills: pending,
          staff: Math.max(1, users.length)
        });
      } catch (e) {
        console.error("Error fetching admin dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Compute plan details & free trial remaining days
  const planName = tenantInfo?.plan || 'Free Trial';
  const isTrial = 
    tenantInfo?.subscription_status === 'trial' || 
    planName.toLowerCase().includes('trial') ||
    planName === 'Free Trial';

  const calculateTrialDays = () => {
    if (!isTrial) return null;
    const createdAtStr = tenantInfo?.created_at || tenantInfo?.createdAt;
    if (!createdAtStr) return 7;
    const createdAt = new Date(createdAtStr);
    const now = new Date();
    
    // Calendar days difference:
    // Registration day (Day 0 elapsed) = 7 days remaining
    // Next day (Day 1 elapsed) = 6 days remaining, etc.
    const startOfCreated = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = startOfNow.getTime() - startOfCreated.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    const TRIAL_DAYS = 7;
    return Math.max(0, TRIAL_DAYS - diffDays);
  };

  const trialDaysRemaining = calculateTrialDays();

  return (
    <div className="space-y-6 animate-fade-in custom-scrollbar p-2 sm:p-4 md:p-4 relative min-h-[calc(100vh-80px)]">
      {/* Decorative Page Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-3xl">
        <div className="absolute top-0 -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-400/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-multiply"></div>
      </div>

      {/* Free Trial Active Notice Banner */}
      {isTrial && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
              <FaCalendarCheck />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-950 text-sm">
                  7-Day Free Trial Active
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Day' : 'Days'} Remaining
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-0.5">
                {trialDaysRemaining > 0 
                  ? `Your free trial is active. You have ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left to explore all platform features.`
                  : 'Your free trial has ended. Please upgrade your subscription to continue uninterrupted access.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Upgrade Plan</span>
            <FaArrowRight size={10} />
          </button>
        </div>
      )}

      {/* SaaS Admin Stats Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        <StatCard title="Total Patients" value={loading ? "..." : stats.patients} icon={<FaUsers />} color="bg-blue-500" onClick={() => navigate('/patients')} highlight />
        <StatCard title="Today's Appointments" value={loading ? "..." : stats.appointments} icon={<FaCalendarAlt />} color="bg-indigo-500" onClick={() => navigate('/appointments')} />
        <StatCard title="Pending Bills" value={loading ? "..." : formatCurrency(stats.pendingBills)} icon={<FaFileInvoice />} color="bg-rose-500" onClick={() => navigate('/billing')} />
        <StatCard title="Revenue" value={loading ? "..." : formatCurrency(stats.revenue)} icon={<FaChartLine />} color="bg-emerald-500" onClick={() => navigate('/billing')} />
        <StatCard title="Staff Count" value={loading ? "..." : stats.staff} icon={<FaUserFriends />} color="bg-purple-500" onClick={() => navigate('/settings')} />
        <StatCard 
          title="Current Plan" 
          value={planName} 
          trend={isTrial ? "Trial" : "Paid"} 
          icon={<FaSync />} 
          color="bg-sky-500" 
          onClick={() => setIsPlanModalOpen(true)} 
        />
        <StatCard 
          title="Trial Remaining" 
          value={isTrial ? (trialDaysRemaining <= 0 ? "Expired" : `${trialDaysRemaining} Days`) : "Active"} 
          trend={isTrial ? (trialDaysRemaining <= 0 ? "0 Left" : `${trialDaysRemaining} Left`) : "Unlimited"} 
          icon={<FaCalendarCheck />} 
          color={isTrial ? "bg-amber-500" : "bg-emerald-500"} 
          onClick={() => setIsPlanModalOpen(true)} 
        />
        <StatCard 
          title="Patient Limit" 
          value={`${loading ? "..." : stats.patients} / 1000`} 
          icon={<FaUsers />} 
          color="bg-blue-400" 
          onClick={() => navigate('/settings')} 
        />
        <StatCard 
          title="Staff Limit" 
          value={`${loading ? "..." : stats.staff} / 15`} 
          icon={<FaUserPlus />} 
          color="bg-sky-500" 
          onClick={() => navigate('/settings')} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative z-10">
        <div className="p-5 md:p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
            <Button variant="outline" className="justify-start text-xs font-bold hover:shadow-lg hover:-translate-y-1 transition-all bg-white/80 border-slate-200/60" onClick={() => navigate('/appointments/book')}><FaCalendarAlt className="mr-2 text-blue-500" /> Book Appointment</Button>
            <Button variant="outline" className="justify-start text-xs font-bold hover:shadow-lg hover:-translate-y-1 transition-all bg-white/80 border-slate-200/60" onClick={() => navigate('/patients/add')}><FaUserPlus className="mr-2 text-indigo-500" /> Add Patient</Button>
            <Button variant="outline" className="justify-start text-xs font-bold hover:shadow-lg hover:-translate-y-1 transition-all bg-white/80 border-slate-200/60" onClick={() => navigate('/notes/new')}><ClinicalNoteIcon className="mr-2 w-3 h-3 text-emerald-500" /> New Note</Button>
            <Button variant="outline" className="justify-start text-xs font-bold hover:shadow-lg hover:-translate-y-1 transition-all bg-white/80 border-slate-200/60" onClick={() => navigate('/billing')}><FaFileInvoice className="mr-2 text-rose-500" /> Generate Invoice</Button>
            <Button variant="outline" className="justify-start text-xs font-bold hover:shadow-lg hover:-translate-y-1 transition-all bg-white/80 border-slate-200/60 text-cyan-700 hover:bg-cyan-50" onClick={() => navigate('/settings/backup')}><FaDatabase className="mr-2 text-cyan-500" /> Data Backup</Button>
          </div>
        </div>

        
        <div className="p-5 md:p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
          <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-5 flex justify-between items-center relative z-10">
            <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
               Today's Schedule
            </span>
            <span className="text-indigo-600 cursor-pointer text-[10px] font-bold hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 hover:shadow-sm" onClick={() => navigate('/appointments')}>VIEW CALENDAR</span>
          </h3>
          <div className="space-y-3 relative z-10">
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              No appointments scheduled for the remainder of the day.
            </div>
          </div>
        </div>
      </div>

      {/* Choose / Upgrade Plan Modal */}
      <UpgradePlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
        currentPlan={planName}
        onPlanUpdated={(updatedTenant) => {
          setTenantInfo(updatedTenant);
        }}
      />
    </div>
  );
};

export default TenantAdminDashboard;
