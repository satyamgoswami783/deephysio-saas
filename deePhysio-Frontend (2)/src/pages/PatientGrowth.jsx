import React, { useState } from 'react';
import { FaChartBar, FaCalendarCheck, FaUserPlus, FaUsers, FaArrowUp, FaArrowDown, FaCalendarAlt, FaBullseye, FaLayerGroup, FaHistory, FaFilter, FaDownload, FaMicroscope, FaBrain, FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

const data = [
  { name: 'Jan', organic: 400, referral: 240, repeat: 240 },
  { name: 'Feb', organic: 300, referral: 139, repeat: 221 },
  { name: 'Mar', organic: 200, referral: 980, repeat: 229 },
  { name: 'Apr', organic: 278, referral: 390, repeat: 200 },
  { name: 'May', organic: 189, referral: 480, repeat: 218 },
  { name: 'Jun', organic: 239, referral: 380, repeat: 250 },
];

const PatientGrowth = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' });
  const [activeFilters, setActiveFilters] = useState({ organic: true, referral: true, repeat: true });
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, visible: true, type });
    setTimeout(() => setToast({ message: '', visible: false, type: 'success' }), 3000);
  };

  const handleAction = (action) => {
    showToast(`Initiating "${action}" for Patient Acquisition Node.`);
  };

  const runDiagnosticSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Growth Synchronized: 1,204 new patient nodes verified against clinical acquisition logic.');
    }, 2000);
  };

  const toggleFilter = (key) => {
    setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAuthorize = () => {
    setIsAuthorizing(true);
    setTimeout(() => {
      setIsAuthorizing(false);
      showToast('Re-engagement logic authorized for 24 high-risk nodes.');
    }, 1500);
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[20px] shadow-2xl border border-white/10 flex items-center gap-4">
            <FaCheckCircle className="text-clinicPrimary shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Growth & Retention Lab</h1>
          <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[11px] opacity-80">Audit longitudinal acquisition channels and optimize retention performance benchmarks.</p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <Button variant="secondary" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 border-none shadow-premium hover:shadow-google hover:-translate-y-1 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => setIsAuditModalOpen(true)} leftIcon={<FaHistory />}>History Audit</Button>
           <Button variant="accent" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 shadow-google active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest" onClick={runDiagnosticSync} disabled={isSyncing} leftIcon={isSyncing ? null : <FaSync className={isSyncing ? 'animate-spin' : ''} />}>
             {isSyncing ? 'Syncing Nodes...' : 'Temporal Window Sync'}
           </Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'New Nodes', value: '1,204', delta: '+14% Δ', icon: <FaUserPlus />, color: 'emerald', sub: 'Validated Files' },
          { label: 'Active Density', value: '842', delta: 'Nominal', icon: <FaUsers />, color: 'blue', sub: 'Current Care Cycle' },
          { label: 'Retention Rate', value: '72%', delta: 'Target 80%', icon: <FaBullseye />, color: 'indigo', p: 72 },
          { label: 'Avg Life Value', value: '₹1,850', delta: '+4% Δ', icon: <FaLayerGroup />, color: 'amber', sub: 'Aggregated Yield' }
        ].map((stat, i) => (
          <Card key={i} className="p-8 border-none shadow-premium bg-white group hover:-translate-y-1 transition-all rounded-[32px] cursor-pointer" onClick={() => handleAction(`${stat.label} Metric Audit`)}>
             <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-500 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform`}>
                   {React.cloneElement(stat.icon, { size: 20 })}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-slate-500 transition-colors">{stat.delta}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">{stat.label}</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
             {stat.p ? (
                <div className="w-full h-2 bg-slate-50 rounded-full mt-6 overflow-hidden border border-slate-100 shadow-inner-soft">
                   <div className="bg-clinicPrimary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(46,167,184,0.3)]" style={{ width: `${stat.p}%` }}></div>
                </div>
             ) : (
                <p className="text-[9px] font-black uppercase tracking-[0.25em] mt-5 text-slate-300 group-hover:text-slate-500 transition-colors uppercase">{stat.sub}</p>
             )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-8 p-10 border-none shadow-premium bg-white group overflow-hidden rounded-[40px]">
           <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-12 gap-8 relative z-10">
              <div>
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-4">
                    <FaLayerGroup className="text-clinicPrimary" /> Acquisition Dynamic Modeling
                 </h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-80">Stochastic analysis of patient entry points and conversion nodes.</p>
              </div>
              <div className="flex items-center gap-6 bg-slate-50/50 p-5 rounded-[32px] border border-slate-100 shadow-inner-soft">
                 {[
                   { id: 'organic', label: 'Organic', color: '#3B82F6' },
                   { id: 'referral', label: 'Referral', color: '#F59E0B' },
                   { id: 'repeat', label: 'Repeat', color: '#8B5CF6' }
                 ].map(source => (
                   <div key={source.id} className={`flex items-center gap-3 cursor-pointer group/node transition-opacity ${activeFilters[source.id] ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`} onClick={() => toggleFilter(source.id)}>
                      <div className="w-3 h-3 rounded-full group-hover/node:scale-150 transition-transform shadow-lg" style={{ backgroundColor: source.color }}></div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{source.label}</span>
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="h-[430px] w-full relative z-10 transition-all duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} dy={25} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 900}} dx={-25} />
                  <Tooltip 
                    cursor={{ stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', padding: '24px' }}
                  />
                  {activeFilters.organic && <Area type="monotone" dataKey="organic" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.08} strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0 }} className="cursor-pointer" onClick={(data) => handleAction(`Organic Point: ${data.organic}`)} />}
                  {activeFilters.referral && <Area type="monotone" dataKey="referral" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.08} strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0 }} className="cursor-pointer" onClick={(data) => handleAction(`Referral Point: ${data.referral}`)} />}
                  {activeFilters.repeat && <Area type="monotone" dataKey="repeat" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.08} strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0 }} className="cursor-pointer" onClick={(data) => handleAction(`Repeat Point: ${data.repeat}`)} />}
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </Card>

        <Card className="lg:col-span-4 p-10 bg-slate-900 text-white border-none shadow-premium relative overflow-hidden group rounded-[40px]">
           <FaBullseye className="absolute -right-16 -bottom-16 text-white/5 text-[260px] rotate-12 transition-transform group-hover:rotate-6 duration-1000 pointer-events-none"/>
           <h3 className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.25em] mb-12 relative z-10 flex items-center gap-4">
              <FaBullseye /> Churn Risk Diagnostics
           </h3>
           <div className="space-y-10 relative z-10">
              {[
                { label: 'Low Risk Profile', value: 85, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
                { label: 'Moderate Engagement', value: 12, color: 'bg-amber-400', shadow: 'shadow-amber-400/20' },
                { label: 'Neural Attrition (High)', value: 3, color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
              ].map(risk => (
                <div key={risk.label} className="space-y-5 rounded-[24px] p-2 hover:bg-white/5 transition-all cursor-pointer group/row" onClick={() => handleAction(`Deep Diagnostic: ${risk.label}`)}>
                   <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/row:text-white transition-colors">{risk.label}</span>
                      <span className="text-xl font-black text-white tracking-tighter">{risk.value}%</span>
                   </div>
                   <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner-soft">
                      <div className={`${risk.color} h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.1)] ${risk.shadow}`} style={{ width: `${risk.value}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-14 p-8 bg-white/5 rounded-[32px] border border-white/5 relative z-10 group-hover:bg-white/10 transition-all border-l-4 border-l-clinicPrimary shadow-soft">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Autonomous Intervention Status</p>
              <p className="text-[14px] font-bold text-slate-300 leading-relaxed italic opacity-80">
                 "Automated re-engagement protocols are currently targeting 24 high-risk patient nodes."
              </p>
              <Button variant="accent" isLoading={isAuthorizing} className="w-full mt-6 h-12 rounded-2xl opacity-0 group-hover:opacity-100 transition-all font-black uppercase tracking-widest text-[10px]" onClick={handleAuthorize}>{isAuthorizing ? 'Authorizing...' : 'Authorize Protocol'}</Button>
           </div>
           <div className="absolute -top-20 -left-20 w-40 h-40 bg-clinicPrimary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-clinicPrimary/20 transition-all duration-1000"></div>
        </Card>
      </div>

      <Modal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)}
        title="Historical Growth Registry"
        footer={
          <div className="flex gap-4 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)}>Close Registry</Button>
            <Button variant="accent" onClick={() => handleAction('Historical Data Download Export')} leftIcon={<FaDownload />}>Export Historical Ledger</Button>
          </div>
        }
      >
        <div className="space-y-8 p-4 text-left font-sans">
           <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner-soft">
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-premium flex items-center justify-center text-clinicPrimary">
                 <FaHistory size={28}/>
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Institutional Growth Index</h4>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Data Synchronized across 24 Month Cycles</p>
              </div>
           </div>
           <div className="space-y-4">
              {[
                { label: 'Organic Baseline', value: '42.8%', trend: '+8.4%' },
                { label: 'Referral Velocity', value: '18.2%', trend: '+12.1%' },
                { label: 'Lifetime Retention', value: '94.2%', trend: 'Optimized' }
              ].map(row => (
                <div key={row.label} className="p-6 bg-white border border-slate-100 rounded-[28px] flex items-center justify-between group cursor-pointer hover:shadow-google transition-all">
                  <span className="text-[13px] font-black text-slate-600 uppercase tracking-tight">{row.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">{row.value}</span>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">{row.trend}</span>
                  </div>
                </div>
              ))}
           </div>
           <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[12px] font-black text-white uppercase tracking-tight mb-3 flex items-center gap-3">
                   <FaBrain className="text-clinicPrimary" /> Neural Acquisition Analysis
                 </p>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">System is calculating cross-sectional acquisition cost vs life-time clinical value.</p>
              </div>
              <FaMicroscope className="absolute -right-6 -bottom-6 text-white/5 text-[100px] rotate-12" />
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientGrowth;
