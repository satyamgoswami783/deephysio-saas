import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { usePermissions } from '../context/PermissionContext';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { FaChartLine, FaCalendarCheck, FaPoundSign, FaUserPlus, FaUserTimes, FaUsers } from 'react-icons/fa';

const Analytics = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [filter, setFilter] = useState('4m');
  const [data, setData] = useState({ monthlyData: [], weeklyData: [] });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!can('analytics.view')) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetchApi('/analytics/overview');
        if (response && response.status === 403) {
          setAccessDenied(true);
          return;
        }
        if (response && response.ok) {
          const resData = await response.json();
          if (resData.success) {
            setData(resData.data);
          }
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const monthlySeries = Array.isArray(data.monthlyData) && data.monthlyData.length
    ? data.monthlyData
    : (Array.isArray(data.weeklyData) ? data.weeklyData : []);

  const rangeByFilter = {
    '4m': 4,
    '8m': 8,
    '1y': 12
  };

  const range = rangeByFilter[filter] || 4;
  const chartData = monthlySeries.slice(-range);

  const summary = {
    appointments: chartData.reduce((acc, val) => acc + val.appointments, 0),
    revenue: "₹" + chartData.reduce((acc, val) => acc + val.revenue, 0).toLocaleString(),
    noShows: chartData.reduce((acc, val) => acc + val.noShows, 0),
    newPatients: chartData.reduce((acc, val) => acc + val.newPatients, 0),
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in custom-scrollbar">
        <PageHeader title="Clinical & Financial Reports" subtitle="Loading analytics data..." icon={<FaChartLine />} />
        <div className="flex justify-center mt-20">
          <div className="w-10 h-10 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 animate-fade-in custom-scrollbar">
        <PageHeader
          title="Clinical & Financial Reports"
          subtitle="You do not have permission to view analytics."
          icon={<FaChartLine />}
        />
        <Card className="mt-6 p-6 border border-amber-200 bg-amber-50">
          <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider">No Access</h3>
          <p className="mt-2 text-sm font-medium text-amber-800">
            You don&apos;t have permission to view analytics reports. Ask admin to enable <strong>Analytics View</strong> for your account.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 animate-fade-in custom-scrollbar">
      <PageHeader 
        title="Clinical & Financial Reports"
        subtitle="Centralized analytics highlighting clinic performance trends."
        icon={<FaChartLine />}
        actions={
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <button
               onClick={() => navigate('/analytics/staff')}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold text-clinicPrimary border border-clinicPrimary/20 bg-clinicPrimary/5 hover:bg-clinicPrimary/10 transition-all shadow-sm h-10 whitespace-nowrap"
            >
               <FaUsers size={14} /> Staff Activity
            </button>
            <button
               onClick={() => navigate('/analytics/rooms')}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold text-emerald-600 border border-emerald-600/20 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm h-10 whitespace-nowrap"
            >
               <FaPoundSign size={14} /> Room Income
            </button>
            <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
              <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-sm h-10 w-fit sm:w-auto">
               {[
                 { id: '4m', label: '4 Months' },
                 { id: '8m', label: '8 Months' },
                 { id: '1y', label: '1 Year' }
               ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 sm:px-4 h-full rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${filter === tab.id ? 'bg-white shadow-sm text-clinicPrimary' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   {tab.label}
                 </button>
               ))}
              </div>
            </div>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8 mb-6 sm:mb-8">
        <Card className="p-5 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors">
           <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <FaCalendarCheck size={16} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Total</p>
                 <p className="text-[12px] font-bold text-slate-700 leading-tight">Appointments</p>
              </div>
           </div>
           <h3 className="text-3xl font-black text-slate-800">{summary.appointments}</h3>
        </Card>

        <Card className="p-5 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors">
           <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                 <FaPoundSign size={16} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Gross</p>
                 <p className="text-[12px] font-bold text-slate-700 leading-tight">Revenue</p>
              </div>
           </div>
           <h3 className="text-3xl font-black text-slate-800">{summary.revenue}</h3>
        </Card>

        <Card className="p-5 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors">
           <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                 <FaUserTimes size={16} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Missed</p>
                 <p className="text-[12px] font-bold text-slate-700 leading-tight">No-Show Rate</p>
              </div>
           </div>
           <h3 className="text-3xl font-black text-slate-800">{summary.noShows} <span className="text-base text-slate-400 font-semibold">%</span></h3>
        </Card>

        <Card className="p-5 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors">
           <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                 <FaUserPlus size={16} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Acquired</p>
                 <p className="text-[12px] font-bold text-slate-700 leading-tight">Patient Growth</p>
              </div>
           </div>
           <h3 className="text-3xl font-black text-slate-800">+{summary.newPatients}</h3>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        
        {/* Appointments Trend Chart */}
        <Card className="p-4 sm:p-6 border border-slate-200 shadow-sm bg-white">
          <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6">Appointment Trends</h3>
          <div className="h-[240px] sm:h-[280px] w-full mt-3 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: '600'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: '600'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="appointments" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAppts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-4 sm:p-6 border border-slate-200 shadow-sm bg-white">
          <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6">Revenue Growth</h3>
          <div className="h-[240px] sm:h-[280px] w-full mt-3 sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: '600'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, fontWeight: '600'}} dx={-10} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Analytics;
