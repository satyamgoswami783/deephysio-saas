import React, { useState } from 'react';
import { FaMoneyBillWave, FaChartPie, FaDownload, FaArrowUp, FaArrowDown, FaCalendarAlt, FaFileContract, FaHistory, FaArrowRight, FaFilter, FaPrint, FaSearch, FaChartBar, FaCalendarCheck } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { formatCurrency } from '../utils/currency';

const data = [
  { month: 'Oct', revenue: 45000, profit: 32000 },
  { month: 'Nov', revenue: 52000, profit: 38000 },
  { month: 'Dec', revenue: 48000, profit: 35000 },
  { month: 'Jan', revenue: 61000, profit: 45000 },
  { month: 'Feb', revenue: 55000, profit: 41000 },
  { month: 'Mar', revenue: 67000, profit: 51000 },
];

const RevenueReports = () => {
  const [reportType, setReportType] = useState('quarterly');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAction = (action) => {
    alert(`Financial Protocol: Initiating "${action}" for Revenue Node Cluster. Authentication verified.`);
  };

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsExportModalOpen(false);
      alert('Financial Audit Complete: Operational yield report generated and synchronized with terminal archive.');
    }, 2500);
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Financial Diagnostics</h1>
          <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[11px] opacity-80">Audit longitudinal revenue trajectories and net yield performance benchmarks.</p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <Button variant="secondary" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 border-none shadow-premium hover:shadow-google hover:-translate-y-1 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => handleAction('Timeline History Audit')} leftIcon={<FaHistory />}>Audit Trail</Button>
           <Button variant="accent" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 shadow-google active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => setIsExportModalOpen(true)} leftIcon={<FaDownload />}>Generate PDF Audit</Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { label: 'Gross Revenue (MTD)', value: formatCurrency(67240), trend: '+18.2% Δ', icon: <FaMoneyBillWave />, color: 'emerald', status: 'Optimal Yield' },
          { label: 'Avg Invoice Yield', value: formatCurrency(185), trend: 'Stable Node', icon: <FaFileContract />, color: 'blue', status: 'Across 4 Protocols' },
          { label: 'Outstanding Balance', value: formatCurrency(4120), trend: '-2.4% Recovery', icon: <FaArrowRight />, color: 'rose', status: '5d Collection Target' }
        ].map((stat, i) => (
          <Card key={i} className="p-10 border-none shadow-premium bg-white group hover:-translate-y-1 transition-all rounded-[32px] cursor-pointer" onClick={() => handleAction('Detailed Metric Analysis')}>
             <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500 flex items-center justify-center shadow-soft group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                   {React.cloneElement(stat.icon, { size: 24 })}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-slate-600 transition-colors`}>{stat.trend}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">{stat.label}</p>
             <div className="flex items-baseline gap-2">
                <h3 className={`text-4xl font-black tracking-tighter ${stat.color === 'rose' ? 'text-rose-500' : 'text-slate-900'}`}>{stat.value}</h3>
             </div>
             <p className={`text-[9px] font-black uppercase tracking-[0.25em] mt-5 ${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'rose' ? 'text-rose-400' : 'text-blue-500'}`}>{stat.status}</p>
          </Card>
        ))}
      </div>

      <Card className="p-10 border-none shadow-premium bg-white group overflow-hidden relative rounded-[40px]">
         <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-12 gap-8 relative z-10">
            <div>
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-4">
                  <FaChartPie className="text-clinicPrimary" /> Longitudinal Revenue-Profit Modeling
               </h3>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-80">Cross-sectional analysis of gross yield vs. net operational profit nodes.</p>
            </div>
            <div className="flex items-center gap-8 bg-slate-50/50 p-5 rounded-[32px] border border-slate-100 shadow-inner-soft">
               <div className="flex items-center gap-4 cursor-pointer group/node" onClick={() => handleAction('Filter by Gross Revenue')}>
                  <div className="w-4 h-4 rounded-lg bg-clinicPrimary shadow-lg  group-hover/node:scale-125 transition-transform"></div>
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">Gross Revenue</span>
               </div>
               <div className="flex items-center gap-4 cursor-pointer group/node" onClick={() => handleAction('Filter by Net Profit')}>
                  <div className="w-4 h-4 rounded-lg bg-amber-400 shadow-lg  group-hover/node:scale-125 transition-transform shadow-amber-400/20"></div>
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none">Net Profit</span>
               </div>
            </div>
         </div>

         <div className="h-[500px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis 
                     dataKey="month" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} 
                     dy={25}
                  />
                  <YAxis 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} 
                     dx={-25}
                  />
                  <Tooltip 
                     cursor={{ fill: '#F8FAFC', opacity: 0.5 }}
                     contentStyle={{ 
                        borderRadius: '32px', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', 
                        background: 'rgba(255, 255, 255, 0.98)', 
                        backdropFilter: 'blur(10px)', 
                        padding: '24px' 
                     }}
                     formatter={(value) => [formatCurrency(value), "Amount"]}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[12, 12, 12, 12]} barSize={28} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(data) => handleAction(`Month Detail: ${data.month} Revenue`)} />
                  <Bar dataKey="profit" fill="#F59E0B" radius={[12, 12, 12, 12]} barSize={28} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={(data) => handleAction(`Month Detail: ${data.month} Profit`)} />
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-clinicPrimary/5 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <Modal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        title="Institutional Financial Audit"
        footer={
          <div className="flex gap-4 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>Abort Sequence</Button>
            <Button variant="accent" onClick={generateReport} disabled={isGenerating} leftIcon={isGenerating ? null : <FaPrint />}>
              {isGenerating ? 'Generating Audit...' : 'Compile Audit Report'}
            </Button>
          </div>
        }
      >
        <div className="space-y-8 p-4 text-left font-sans">
           <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner-soft">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-premium border border-slate-200 flex items-center justify-center text-clinicPrimary">
                 <FaChartPie size={32} className={isGenerating ? 'animate-spin-slow' : ''} />
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Revenue Cluster Alpha-9</h4>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Verified Period: Oct 2025 - Mar 2026</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Report Granularity</label>
                 <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all">
                    <option>Standard Financial Summary</option>
                    <option>Detailed Transaction Ledger</option>
                    <option>Practitioner Yield Audit</option>
                    <option>Insurance Claim Diagnostics</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Output Resolution</label>
                 <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all">
                    <option>Professional PDF Node</option>
                    <option>XLS Raw Asset Grid</option>
                    <option>Cloud Archive Secure Link</option>
                 </select>
              </div>
           </div>
           <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[12px] font-bold text-white uppercase tracking-tight mb-2">Authenticated Export Protocol</p>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">System will automatically encrypt financial documentation with 256-bit institutional logic.</p>
              </div>
              <FaHistory className="absolute -right-6 -bottom-6 text-white/5 text-[100px] rotate-12 group-hover:rotate-6 transition-transform duration-700" />
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default RevenueReports;
