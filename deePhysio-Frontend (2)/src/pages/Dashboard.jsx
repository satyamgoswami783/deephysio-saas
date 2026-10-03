import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '../config/api';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { FaUserPlus, FaCalendarCheck, FaUsers, FaCalendarAlt, FaFileInvoice, FaUserFriends, FaChevronRight, FaChartLine, FaSync } from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import Button, { cn } from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';


const StatCard = ({ title, value, icon, color, trend, path, highlight }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => path && navigate(path)}
      className={cn(
        "p-4 bg-white border border-slate-200 rounded-lg flex flex-col items-start transition-all duration-200 relative",
        path ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
        highlight ? "ring-2 ring-rose-500 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse" : ""
      )}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`w-8 h-8 flex items-center justify-center rounded bg-opacity-10 ${color}`}>
          <span className={`text-sm ${color.replace('bg-', 'text-')}`}>{icon}</span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${trend.startsWith('+') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('All');
  const role = sessionStorage.getItem('deephysio_role');


  const isTherapist = role === 'therapist';
  const isReceptionist = role === 'receptionist';
  const isBilling = role === 'billing';

  // State for Real Backend API Data
  const [stats, setStats] = useState({
    appointments: 0,
    patients: 0,
    noShows: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalRevenue: 0,
    staffActive: 0,
    totalStaff: 0,
    recentBookings: [],
    todaysPaymentsTotal: 0,
    pendingPaymentsTotal: 0,
    completedPaymentsCount: 0,
    overdueTotal: 0,
    recentTransactions: [],
    chartData: [],
    activityFeed: [],
    loading: true
  });
  const location = useLocation();
  const fetchedRef = useRef(null);

  // Fetch real data to prove DB connection and show in Network Tab
  useEffect(() => {
    const triggerKey = location.key;
    if (fetchedRef.current === triggerKey) return;
    fetchedRef.current = triggerKey;

    const fetchDashboardData = async () => {
      const token = sessionStorage.getItem('token');
      const currentRole = sessionStorage.getItem('deephysio_role');
      if (!token || !currentRole) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Role-based guards to prevent unauthorized API calls (403 errors)
        const canAccessPatients = ['admin', 'therapist', 'receptionist'].includes(currentRole);
        const canAccessAppointments = ['admin', 'therapist', 'receptionist'].includes(currentRole);
        const canAccessAnalytics = currentRole === 'admin';
        const canAccessBilling = currentRole === 'admin' || currentRole === 'billing';

        const [patientsResult, apptResult, analyticsResult, staffResult, invoicesResult, paymentsResult] = await Promise.allSettled([
          canAccessPatients ? fetchApi('/patients').then(r => r?.ok ? r.json() : { success: false, data: [] }) : Promise.resolve({ success: false, data: [] }),
          canAccessAppointments ? fetchApi('/appointments').then(r => r?.ok ? r.json() : { success: false, data: [] }) : Promise.resolve({ success: false, data: [] }),
          canAccessAnalytics ? fetchApi('/analytics/overview').then(r => r?.ok ? r.json() : { success: false }) : Promise.resolve({ success: false }),
          canAccessAnalytics ? fetchApi('/analytics/staff').then(r => r?.ok ? r.json() : { success: false }) : Promise.resolve({ success: false }),
          canAccessBilling ? fetchApi('/invoices').then(r => r?.ok ? r.json() : { success: false, data: [] }) : Promise.resolve({ success: false, data: [] }),
          canAccessBilling ? fetchApi('/payments').then(r => r?.ok ? r.json() : { success: false, data: [] }) : Promise.resolve({ success: false, data: [] })
        ]);

        // Safely extract results (allSettled never rejects — each result has status + value/reason)
        const patientsData = patientsResult.status === 'fulfilled' ? patientsResult.value : { success: false, data: [] };
        const apptData = apptResult.status === 'fulfilled' ? apptResult.value : { success: false, data: [] };

        let chartDataOut = [];
        let analyticsSummary = {};
        let activityItems = [];
        if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.success) {
          chartDataOut = analyticsResult.value.data?.weeklyData || [];
          analyticsSummary = analyticsResult.value.data?.summary || {};
          activityItems = analyticsResult.value.data?.systemFeed || [];
        }

        let staffSummary = { staffActive: 0, totalStaff: 0 };
        if (staffResult.status === 'fulfilled' && staffResult.value?.success) {
          const staffRows = staffResult.value?.data?.staff || [];
          staffSummary = {
            staffActive: staffRows.filter((s) => s.isActive).length,
            totalStaff: staffResult.value?.data?.summary?.totalStaff || staffRows.length
          };
        }

        // Compute derived stats from appointments
        const allAppts = apptData.success ? apptData.data : [];
        const noShowCount = allAppts.filter(a => a.status === 'no_show').length;
        const completedCount = allAppts.filter(a => a.status === 'completed').length;
        const upcomingCount = allAppts.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length;

        // Compute Billing Stats
        const invoicesData = invoicesResult.status === 'fulfilled' ? invoicesResult.value : { success: false, data: [] };
        const paymentsData = paymentsResult.status === 'fulfilled' ? paymentsResult.value : { success: false, data: [] };
        const allInvoices = invoicesData.success ? invoicesData.data : [];
        const allPayments = paymentsData.success ? paymentsData.data : [];

        const todayStr = new Date().toISOString().split('T')[0];
        const todaysPayments = allPayments.filter(p => p.date && p.date.startsWith(todayStr));
        const todaysPaymentsTotal = todaysPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        const pendingInvoices = allInvoices.filter(inv => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
          const isFullyPaid = String(inv.status || '').toUpperCase() === 'PAID' || totalPaid >= Number(inv.total || 0) - 0.01;
          const remainingAmount = Number(inv.total || 0) - totalPaid;
          return !isFullyPaid && remainingAmount > 0.01;
        });
        
        const pendingPaymentsTotal = pendingInvoices.reduce((sum, inv) => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((s, p) => s + Number(p.amount || 0), 0) : 0;
          return sum + Math.max(0, Number(inv.total || 0) - totalPaid);
        }, 0);
        
        const overdueInvoices = pendingInvoices.filter(inv => inv.date && new Date(inv.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const overdueTotal = overdueInvoices.reduce((sum, inv) => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((s, p) => s + Number(p.amount || 0), 0) : 0;
          return sum + Math.max(0, Number(inv.total || 0) - totalPaid);
        }, 0);

        const recentTransactionsList = allPayments.slice(0, 5).map(p => ({
          patientId: p.patientId || p.patient?.id,
          name: p.patient ? `${p.patient.firstName || ''} ${p.patient.lastName || ''}`.trim() : 'Unknown',
          amount: `₹${Number(p.amount || 0).toFixed(2)}`,
          status: p.status || 'Completed',
          method: p.method || 'Cash'
        }));

        setStats({
          patients: patientsData.success ? patientsData.data.length : 0,
          appointments: apptData.success ? apptData.data.length : 0,
          noShows: noShowCount,
          completedSessions: completedCount,
          upcomingSessions: upcomingCount,
          totalRevenue: analyticsSummary.totalRevenue || 0,
          staffActive: staffSummary.staffActive,
          totalStaff: staffSummary.totalStaff,
          recentBookings: apptData.success ? apptData.data.slice(0, 5).map(appt => ({
            id: appt.id,
            name: `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.trim() || 'Unknown',
            patientId: appt.patientId || appt.patient?.id,
            time: appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            dr: appt.therapist?.name || 'N/A',
            status: appt.status ? (appt.status.charAt(0).toUpperCase() + appt.status.slice(1).replace('_', ' ')) : 'Scheduled',
            therapistId: appt.therapistId || appt.therapist?.id,
            appointmentId: appt.id,
            isEmergency: appt.patient?.patient_type === 'Emergency'
          })) : [],
          todaysPaymentsTotal,
          pendingPaymentsTotal,
          completedPaymentsCount: todaysPayments.length,
          overdueTotal,
          recentTransactions: recentTransactionsList,
          chartData: Array.isArray(chartDataOut) ? chartDataOut : (chartDataOut.weeklyData || []),
          activityFeed: activityItems,
          loading: false
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchDashboardData();
  }, [location.key]);

  const storedUser = sessionStorage.getItem('deephysio_user');

  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

  if (!role || !loggedInUser) return null; // Safety guard


  const hideRevenue = isTherapist || isReceptionist;

  let recentBookings = isTherapist
    ? stats.recentBookings.filter(row => row.therapistId === loggedInUser.id)
    : [...stats.recentBookings];

  // Keep nextAppt unaffected by the UI filter
  const nextAppt = isTherapist
    ? recentBookings.find(a => ['Confirmed', 'Arrived', 'Pending', 'Scheduled'].includes(a.status))
    : null;

  if (bookingFilter !== 'All') {
    recentBookings = recentBookings.filter(row => row.status === bookingFilter);
  }

  return (
    <div className="space-y-5 animate-fade-in custom-scrollbar p-1 sm:p-2 md:p-1">
      <PageHeader
        title={isTherapist ? "My Dashboard" : isReceptionist ? "Receptionist Dashboard" : isBilling ? "Accounting Overview" : "Clinic Overview"}
        subtitle={isBilling ? "Monitor transactions, manage pending payments, and track fiscal health." : `Welcome back, ${role.charAt(0).toUpperCase() + role.slice(1)} 👋 Here's what's happening today.`}
        actions={
          <>
            {(!isTherapist && !isReceptionist && !isBilling) && (
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs"
                leftIcon={<FaChartLine size={10} />}
                onClick={() => navigate('/analytics')}
              >
                Analytics
              </Button>
            )}
            {isTherapist && (
              <Button
                variant="secondary"
                className={`flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs ${nextAppt ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'}`}
                leftIcon={<ClinicalNoteIcon size={18} />}
                onClick={() => {
                  if (nextAppt) {
                    navigate(`/notes/new?appointmentId=${nextAppt.appointmentId}&patientId=${nextAppt.id}`);
                  }
                }}
                disabled={!nextAppt}
              >
                {nextAppt ? 'Write Clinical Note' : 'No Patients Arrived'}
              </Button>
            )}
            {!isBilling ? (
              <Button
                variant="accent"
                className="flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs"
                leftIcon={<FaCalendarCheck size={10} />}
                onClick={() => navigate('/appointments/book')}
              >
                New Booking
              </Button>
            ) : (
              <Button
                variant="accent"
                className="flex-1 sm:flex-none h-9 px-3 rounded-lg text-xs"
                leftIcon={<FaFileInvoice size={10} />}
                onClick={() => navigate('/billing/new')}
              >
                Create Invoice
              </Button>
            )}
          </>
        }
      />

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isBilling ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-6'} gap-3`}>
        {!isBilling && (
          <StatCard
            title="Total Appointments"
            value={stats.loading ? "..." : stats.appointments}
            icon={<FaCalendarAlt />}
            color="bg-clinicPrimary"
            trend={stats.loading ? "Loading" : "Active"}
            path="/appointments"
          />
        )}
        {isBilling && (
          <>
            <StatCard
              title="Today's Payments"
              value={`₹${stats.todaysPaymentsTotal.toFixed(2)}`}
              icon={<FaFileInvoice />}
              color="bg-emerald-500"
              trend="Today"
              path="/billing/payments"
            />
            <StatCard
              title="Pending Payments"
              value={`₹${stats.pendingPaymentsTotal.toFixed(2)}`}
              icon={<FaFileInvoice />}
              color="bg-rose-500"
              trend="Unpaid"
              path="/billing"
            />
            <StatCard
              title="Completed Payments"
              value={stats.completedPaymentsCount}
              icon={<FaCalendarCheck />}
              color="bg-clinicPrimary"
              trend="Today"
              path="/billing/payments"
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${stats.overdueTotal.toFixed(2)}`}
              icon={<FaFileInvoice />}
              color="bg-slate-900"
              trend="Past Due"
              path="/billing"
              highlight={stats.overdueTotal > 0}
            />
          </>
        )}
        {isTherapist && (
          <>
            <StatCard
              title="Upcoming Sessions"
              value={stats.loading ? "..." : stats.upcomingSessions}
              icon={<FaCalendarAlt />}
              color="bg-sky-500"
              trend="This Week"
              path="/appointments"
            />
            <StatCard
              title="Pending Notes"
              value={stats.loading ? "..." : Math.max(0, stats.completedSessions - (stats.appointments - stats.upcomingSessions - stats.noShows))}
              icon={<ClinicalNoteIcon size={28} />}
              color="bg-rose-500"
              trend="Action Req"
              path="/notes"
              highlight={true}
            />
            <StatCard
              title="Completed Sessions"
              value={stats.loading ? "..." : stats.completedSessions}
              icon={<FaCalendarCheck />}
              color="bg-emerald-500"
              trend="This Week"
              path="/appointments"
            />
          </>
        )}
        {(!hideRevenue && !isBilling) && (
          <StatCard
            title="Total Revenue"
            value={stats.loading ? "..." : `₹${stats.totalRevenue.toLocaleString()}`}
            icon={<FaFileInvoice />}
            color="bg-amber-500"
            trend={stats.totalRevenue > 0 ? "Active" : "No invoices"}
            path="/billing"
          />
        )}
        {(!isBilling && !isTherapist && !isReceptionist) && (
          <StatCard
            title="Completed Sessions"
            value={stats.loading ? "..." : stats.completedSessions}
            icon={<FaCalendarCheck />}
            color="bg-indigo-500"
            trend={stats.completedSessions > 0 ? "Active" : "None"}
            path="/appointments"
          />
        )}
        {(!isBilling && !isTherapist && !isReceptionist) && (
          <StatCard
            title="Total Patients"
            value={stats.loading ? "..." : stats.patients}
            icon={<FaUserPlus />}
            color="bg-emerald-500"
            trend={stats.loading ? "Loading" : "Active"}
            path="/patients"
          />
        )}
        {(!isBilling && !isTherapist && !isReceptionist) && (
          <StatCard
            title="Staff Activity"
            value={stats.loading ? "..." : `${stats.staffActive}/${stats.totalStaff || 0}`}
            icon={<FaUsers />}
            color="bg-violet-500"
            trend={stats.loading ? "Loading" : "On Duty"}
            path="/analytics/staff"
          />
        )}
        {(!isBilling && !isTherapist && !isReceptionist) && (
          <StatCard
            title="DNA"
            value={stats.loading ? "..." : stats.noShows}
            icon={<FaCalendarAlt />}
            color="bg-slate-500"
            trend="Follow-up"
            path="/appointments?status=no_show"
          />
        )}
      </div>

      {(!isTherapist && !isReceptionist && !isBilling) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Appointment Trends</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                <span className="w-1 h-1 rounded-full bg-clinicPrimary"></span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#fff', padding: '8px' }}
                  />
                  <Area type="monotone" dataKey="appointments" stroke="#2EA7B8" strokeWidth={2} fill="#2EA7B8" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue Analysis</h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#fff', padding: '8px' }}
                    formatter={(value) => ["₹" + value, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isBilling ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-4 pb-4`}>
        <div className={`${isBilling ? 'col-span-full' : 'lg:col-span-2'} bg-white border border-slate-200 rounded-lg overflow-hidden`}>
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isBilling ? "Recent Transactions" : "Recent Bookings"}
              </h3>
              {!isBilling && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {['All', 'Confirmed', 'Pending', 'Arrived'].map(status => (
                    <button
                      key={status}
                      onClick={() => setBookingFilter(status)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${bookingFilter === status
                          ? status === 'Confirmed' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : status === 'Pending' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : status === 'Arrived' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                : 'bg-slate-700 text-white shadow-md shadow-slate-700/20'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(isBilling ? '/billing' : '/appointments')}
              className="text-clinicPrimary text-[9px] font-bold hover:underline uppercase tracking-wider shrink-0"
            >
              {isBilling ? "View All Ledger" : "Full Schedule"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 font-bold text-[8px] uppercase tracking-widest border-b border-slate-50">
                  {isBilling ? (
                    <>
                      <th className="px-4 py-2">Patient Name</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Payment Status</th>
                      <th className="px-4 py-2">Method</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2">Patient</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Practitioner</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right"></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {!isBilling ? (
                  recentBookings.length > 0 ? recentBookings.map((row) => (
                    <tr
                      key={row.appointmentId}
                      className={`hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group ${row.isEmergency ? 'border-l-2 border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/40 relative' : ''}`}
                      onClick={() => navigate(`/patients/profile/${row.patientId}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {row.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`text-xs font-bold transition-colors truncate ${row.isEmergency ? 'text-rose-600 group-hover:text-rose-700' : 'text-slate-700 group-hover:text-clinicPrimary'}`}>{row.name}</p>
                              {row.isEmergency && (
                                <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-rose-500 text-white uppercase tracking-wider shadow-sm animate-pulse shrink-0">
                                  Emergency
                                </span>
                              )}
                            </div>
                            <p className={`text-[9px] uppercase tracking-widest leading-none mt-0.5 ${row.isEmergency ? 'text-rose-400' : 'text-slate-400'}`}>{row.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-bold">{row.time}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-medium">{row.dr}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm ${row.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            row.status === 'Arrived' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isTherapist ? (
                          <span className="text-[10px] font-bold text-clinicPrimary uppercase tracking-widest px-2 py-1 bg-clinicPrimary/10 rounded group-hover:bg-clinicPrimary group-hover:text-white transition-all">
                            Open Session
                          </span>
                        ) : (
                          <FaChevronRight size={10} className="text-slate-300 group-hover:text-clinicPrimary transition-colors" />
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/30">
                        No bookings match the selected filter.
                      </td>
                    </tr>
                  )
                ) : (
                  stats.recentTransactions.length > 0 ? stats.recentTransactions.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer group"
                      onClick={() => row.patientId && navigate(`/billing/patient/${row.patientId}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] border border-emerald-100 shadow-sm transition-all group-hover:scale-110">
                            {row.name.split(' ').map(n => n[0] || '').join('').substring(0, 2)}
                          </div>
                          <p className="text-[13px] font-black text-slate-700 group-hover:text-clinicPrimary transition-colors tracking-tight">{row.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-900 font-black">{row.amount}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm ${String(row.status).toLowerCase() === 'completed' || String(row.status).toLowerCase() === 'recorded' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">{row.method}</td>
                      <td className="px-4 py-3 text-right">
                        <FaChevronRight size={10} className="text-slate-300 group-hover:text-clinicPrimary transition-colors ml-auto" />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs font-medium bg-slate-50/30">
                        No recent transactions found.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isBilling && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Activity</h3>
            </div>
            <div className="p-4 space-y-4">
              {(stats.activityFeed.length > 0 ? stats.activityFeed.slice(0, 5) : [
                { type: 'No recent activity', patient: '—', time: 'now' }
              ]).map((activity, i) => (
                <div key={i} className="flex gap-3 items-start group cursor-pointer" onClick={() => navigate(activity.type.includes('Ledger') ? '/billing' : '/patients')}>
                  <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-none">{activity.type}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{activity.patient}</p>
                    <p className="text-[8px] font-bold text-clinicPrimary mt-1 uppercase tracking-widest">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-slate-50/30 border-t border-slate-50 text-center">
              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="text-[9px] font-bold text-slate-400 hover:text-clinicPrimary uppercase tracking-widest"
              >
                See History
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity History Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Full Clinic Activity Log"
      >
        <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar p-2">
          {(stats.activityFeed.length > 0 ? stats.activityFeed : [
            { type: 'No recent activity', patient: '—', time: 'now' }
          ]).map((activity, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-slate-50 last:border-none items-start">
              <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-clinicPrimary"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700">{activity.type}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{activity.patient}</p>
              </div>
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pt-1">{activity.time}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
