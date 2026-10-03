import React, { useState } from 'react';
import { FaChartLine, FaArrowUp, FaArrowDown, FaCalendarAlt, FaBullhorn, FaMousePointer, FaUserPlus, FaUsers, FaFilter, FaDownload, FaSync, FaMicroscope, FaBrain, FaRegCompass, FaBolt, FaLayerGroup } from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const MarketingAnalytics = () => {
  const { showToast } = useToast();
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isSyncing, setIsSyncing] = useState(false);

  const data = [
    { name: 'Jan', campaigns: 12, leads: 400, conv: 240 },
    { name: 'Feb', campaigns: 15, leads: 300, conv: 198 },
    { name: 'Mar', campaigns: 18, leads: 500, conv: 380 },
    { name: 'Apr', campaigns: 20, leads: 600, conv: 420 },
    { name: 'May', campaigns: 25, leads: 800, conv: 510 },
  ];

  const channelData = [
    { name: 'Google Ads', value: 1240, color: '#0B98A1' },
    { name: 'Facebook', value: 850, color: '#4F46E5' },
    { name: 'Direct Mail', value: 420, color: '#F59E0B' },
    { name: 'Referral', value: 310, color: '#10B981' },
  ];

  const total = channelData.reduce((sum, c) => sum + c.value, 0);

  const handleAction = (action) => {
    showToast(`Analytics: Initiating "${action}". Handshake verified.`);
  };

  const runDataSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Analytics Synchronized: Multi-channel ROI paths verified across 12,400 clinical interaction nodes.');
    }, 2000);
  };

  const handleExport = () => {
    const rows = [
      ['Month', 'Leads', 'Conversions', 'Campaigns'],
      ...data.map(d => [d.name, d.leads, d.conv, d.campaigns]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('XL Manifest exported as CSV!');
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Campaign Intelligence Ledger</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Measure longitudinal ROI and conversion velocity across global clinical outreach channels.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={runDataSync} disabled={isSyncing} leftIcon={<FaSync size={12} className={isSyncing ? 'animate-spin' : ''}/>}>
            {isSyncing ? 'Indexing...' : 'Sync Intelligence'}
          </Button>
          <Button variant="accent" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={handleExport} leftIcon={<FaDownload size={12}/>}>
            Export XL Manifest
          </Button>
        </div>
      </div>

      {/* Time Range Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'].map(r => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${timeRange === r ? 'bg-clinicPrimary text-white border-clinicPrimary' : 'bg-white text-slate-400 border-slate-100 hover:border-clinicPrimary/30 hover:text-clinicPrimary'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Cloud Leads', val: '2,421', icon: <FaUserPlus size={14}/>, color: 'blue', delta: '+12.4%' },
          { label: 'Response Velocity', val: '8.4%', icon: <FaMousePointer size={14}/>, color: 'indigo', delta: '+2.1%' },
          { label: 'Conversion Delta', val: '24.2%', icon: <FaUsers size={14}/>, color: 'emerald', delta: '+5.8%' },
          { label: 'Marketing ROI', val: '4.8x', icon: <FaChartLine size={14}/>, color: 'clinic', delta: '+0.5x' },
        ].map(stat => (
          <Card
            key={stat.label}
            onClick={() => handleAction(`View ${stat.label} Detail`)}
            className="p-4 bg-white border-none shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all rounded-xl cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
              <div className={`p-2 rounded-xl text-white group-hover:scale-110 transition-transform shadow-sm ${stat.color === 'blue' ? 'bg-blue-500' : stat.color === 'indigo' ? 'bg-indigo-500' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-clinicPrimary'}`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 leading-none relative z-10 tracking-tighter">{stat.val}</h3>
            <div className="flex items-center gap-1.5 mt-2 relative z-10">
              <FaArrowUp className="text-emerald-500" size={9}/>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{stat.delta} vs PREV PERIOD</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 p-4 border-none shadow-sm bg-white group overflow-hidden rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FaRegCompass className="text-clinicPrimary" size={12}/> Conversion Funnel Trajectory
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-clinicPrimary"></div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Leads</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Active Patients</span></div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B98A1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0B98A1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} dy={8}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}/>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '12px' }} cursor={{ stroke: '#0B98A1', strokeWidth: 1.5, strokeDasharray: '5 5' }}/>
                <Area type="monotone" dataKey="leads" stroke="#0B98A1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="conv" stroke="#CBD5E1" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-slate-900 text-white border-none shadow-sm relative overflow-hidden group rounded-2xl">
            <FaLayerGroup className="absolute -right-8 -top-8 text-white/5 text-[140px] pointer-events-none"/>
            <h3 className="text-[10px] font-black text-clinicPrimary uppercase tracking-widest mb-4 relative z-10">Interaction Channels</h3>
            <div className="space-y-3 relative z-10">
              {channelData.map(ch => (
                <div key={ch.name} className="group/ch cursor-pointer" onClick={() => handleAction(`View ${ch.name} Detail`)}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest leading-none mb-1.5">
                    <span className="text-slate-400 group-hover/ch:text-white transition-colors">{ch.name}</span>
                    <span className="text-white">{((ch.value / total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(ch.value / total) * 100}%`, backgroundColor: ch.color }}></div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              className="w-full mt-4 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-clinicPrimary hover:border-clinicPrimary transition-all font-black text-[9px] uppercase tracking-widest text-white"
              onClick={() => handleAction('Deep Node Audit')}
            >
              Deep Node Audit
            </Button>
          </Card>

          <Card
            className="p-4 bg-white border-none shadow-sm flex flex-col items-center text-center group hover:-translate-y-0.5 hover:shadow-md transition-all rounded-2xl cursor-pointer"
            onClick={() => handleAction('Neural ROI Forecasting')}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-clinicPrimary border border-slate-100 group-hover:scale-105 group-hover:rotate-3 transition-all mb-3">
              <FaBrain size={18} />
            </div>
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-1">Forecasting Engine</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-3">Predictive ROI modeling active for Q3 2026 trajectories.</p>
            <Button
              variant="secondary"
              className="w-full h-8 rounded-xl font-black text-[9px] uppercase tracking-widest"
              onClick={(e) => { e.stopPropagation(); handleAction('Launch Forecasting Engine'); }}
            >
              Run Forecast
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingAnalytics;
