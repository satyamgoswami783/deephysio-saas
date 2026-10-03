import React, { useState } from 'react';
import { FaChartPie, FaArrowRight, FaStar, FaHistory, FaCheckCircle, FaFilter, FaDownload, FaMicroscope, FaBullseye, FaBolt, FaLayerGroup, FaFire, FaSync } from 'react-icons/fa';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const data = [
  { name: 'Physiotherapy', value: 4500, color: '#3B82F6', growth: '+12%' },
  { name: 'Massage Therapy', value: 3200, color: '#F59E0B', growth: '+8%' },
  { name: 'Sports Recovery', value: 2800, color: '#8B5CF6', growth: '+24%' },
  { name: 'Acupuncture', value: 1800, color: '#10B981', growth: '-2%' },
  { name: 'Occupational Therapy', value: 1200, color: '#6366F1', growth: '+15%' },
];

const ServicePopularity = () => {
  const [activeSegment, setActiveSegment] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAction = (action) => {
    showToast(`Service Intelligence: Initiating "${action}" for Clinical Value Node cluster. Synchronized.`);
  };

  const runDemandForecast = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Demand Forecast Synchronized: Service load optimization logic deployed across all practitioners.');
    }, 2000);
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Service Intelligence Hub</h1>
          <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[11px] opacity-80">Audit clinical service demand trajectories and optimize practitioner professional load nodes.</p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <Button variant="secondary" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 border-none shadow-premium hover:shadow-google hover:-translate-y-1 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => setIsAuditModalOpen(true)} leftIcon={<FaHistory />}>Audit Trail</Button>
           <Button variant="accent" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 shadow-google active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest" onClick={runDemandForecast} disabled={isSyncing} leftIcon={isSyncing ? null : <FaBolt />}>
             {isSyncing ? 'Forecasting...' : 'Optimize Load'}
           </Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-8 p-10 border-none shadow-premium bg-white group overflow-hidden rounded-[40px]">
           <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-12 gap-8 relative z-10">
              <div>
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-4">
                    <FaChartPie className="text-clinicPrimary" /> Professional Service Distribution
                 </h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-80">Volumetric analysis of clinical service utilization across all operational nodes.</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 rounded-[28px] p-2 border border-slate-100 shadow-inner-soft">
                 <button className="px-6 py-2.5 rounded-[20px] bg-white shadow-premium text-[11px] font-black text-slate-900 uppercase tracking-widest transition-all">Current Yield</button>
                 <button className="px-6 py-2.5 rounded-[20px] text-[11px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest" onClick={() => handleAction('Switch to Forecasting View')}>Forecast Node</button>
              </div>
           </div>

           <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="h-[430px] w-full lg:w-3/5 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={data}
                         cx="50%"
                         cy="50%"
                         innerRadius={110}
                         outerRadius={160}
                         paddingAngle={8}
                         dataKey="value"
                         stroke="none"
                         className="cursor-pointer"
                         onClick={(data) => setActiveSegment(data)}
                      >
                         {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                         ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', padding: '24px' }}
                      />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none group-hover:scale-110 transition-transform duration-700">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">Total Value</p>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">₹142.8k</h2>
                </div>
              </div>

              <div className="w-full lg:w-2/5 space-y-5">
                 {data.map((item, idx) => (
                    <div 
                      key={item.name} 
                      onClick={() => setActiveSegment(item)}
                      className={`p-6 bg-slate-50 border rounded-[28px] flex items-center justify-between group/item cursor-pointer hover:shadow-google hover:-translate-x-2 transition-all duration-500 ${activeSegment?.name === item.name ? 'border-clinicPrimary ring-4 ring-clinicPrimary/5' : 'border-slate-50'}`}
                    >
                       <div className="flex items-center gap-5">
                          <div className="w-4 h-4 rounded-lg shadow-lg" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[13px] font-black text-slate-900 tracking-tight uppercase group-hover/item:text-clinicPrimary transition-colors">{item.name}</span>
                       </div>
                       <div className="text-right">
                          <p className="text-[14px] font-black text-slate-900 tracking-tighter">₹{item.value}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${item.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{item.growth}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </Card>

        <div className="lg:col-span-4 space-y-8">
           <Card className="p-10 bg-slate-900 text-white border-none shadow-premium relative overflow-hidden group rounded-[40px]">
              <FaFire className="absolute -right-20 -bottom-20 text-white/5 text-[280px] rotate-12 transition-transform group-hover:rotate-0 duration-1000 pointer-events-none"/>
              <h3 className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.25em] mb-12 relative z-10 flex items-center gap-4">
                 <FaFire /> High Velocity Services
              </h3>
              <div className="space-y-6 relative z-10">
                 {[
                   { label: 'Shockwave Protocol', demand: 'Critical High', icon: <FaBolt />, color: 'emerald', p: 94 },
                   { label: 'Dry Needling Hub', demand: 'Stable Rising', icon: <FaStar />, color: 'blue', p: 72 },
                   { label: 'Virtual Rehab Node', demand: 'Expanding', icon: <FaCheckCircle />, color: 'indigo', p: 45 },
                 ].map(risk => (
                   <div key={risk.label} className="p-6 bg-white/5 rounded-[32px] border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/row active:scale-95" onClick={() => handleAction(`Deep Load Sync: ${risk.label}`)}>
                      <div className="flex justify-between items-start mb-5">
                         <div className="flex items-center gap-4">
                            <span className="text-clinicPrimary group-hover/row:scale-125 transition-transform">{risk.icon}</span>
                            <span className="text-[15px] font-black text-white tracking-tighter uppercase leading-none">{risk.label}</span>
                         </div>
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/row:text-white transition-colors uppercase pt-1">{risk.demand}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner-soft">
                        <div className={`bg-clinicPrimary h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(46,167,184,0.3)]`} style={{ width: `${risk.p}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-clinicPrimary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-clinicPrimary/20 transition-all duration-1000"></div>
           </Card>

           <Card className="p-10 bg-white border-none shadow-premium flex flex-col items-center text-center group hover:-translate-y-1 transition-all rounded-[40px] cursor-pointer" onClick={() => handleAction('Strategic Planning Session')}>
              <div className="w-20 h-20 rounded-[32px] bg-blue-50 flex items-center justify-center text-clinicPrimary font-black text-3xl border border-blue-50 shadow-soft group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 mb-8">
                 <FaMicroscope />
              </div>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Service Optimization</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed opacity-60">Aggregate clinical expertise nodes to maximize institutional Net Yield.</p>
              <Button variant="secondary" className="w-full mt-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-soft border-none hover:shadow-google transition-all">Launch Strategic Planner</Button>
           </Card>
        </div>
      </div>

      <Modal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)}
        title="Historical Service Audit"
        footer={
          <div className="flex gap-4 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)}>Close Registry</Button>
            <Button variant="accent" onClick={() => handleAction('Historical Data Download')} leftIcon={<FaDownload />}>Export Service Ledger</Button>
          </div>
        }
      >
        <div className="space-y-8 p-4 text-left font-sans">
           <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner-soft">
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-premium flex items-center justify-center text-clinicPrimary">
                 <FaHistory size={28}/>
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Service Value Lifecycle</h4>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Historical synchronization across 18 operational nodes</p>
              </div>
           </div>
           <p className="text-[12px] font-medium text-slate-500 leading-relaxed px-2">Institutional service history indicates a 22% shift towards sports-specific recovery protocols over the legacy physiotherapy baseline.</p>
           <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-center">
                 <div>
                    <p className="text-[13px] font-black text-white uppercase tracking-tighter mb-1 leading-none">Net Satisfaction Logic</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Verification Sync</p>
                 </div>
                 <div className="text-4xl font-black text-clinicPrimary tracking-tighter">4.9/5</div>
              </div>
              <FaStar className="absolute -right-6 -bottom-6 text-white/5 text-[100px] rotate-12" />
           </div>
        </div>
      </Modal>

      {activeSegment && (
        <Modal 
          isOpen={!!activeSegment} 
          onClose={() => setActiveSegment(null)}
          title="Service Node Intelligence"
          footer={
            <div className="flex gap-4 justify-end w-full px-2">
              <Button variant="secondary" onClick={() => setActiveSegment(null)}>Acknowledge</Button>
              <Button variant="accent" onClick={() => handleAction('Request Peer Review', activeSegment)} leftIcon={<FaSync />}>Calibrate Demand</Button>
            </div>
          }
        >
          <div className="space-y-8 p-4 text-left">
             <div className="flex items-center gap-8 p-8 border rounded-[32px] shadow-inner-soft" style={{ backgroundColor: `${activeSegment.color}10`, borderColor: `${activeSegment.color}20` }}>
                <div className="w-20 h-20 bg-white rounded-[28px] shadow-premium flex items-center justify-center text-3xl font-black" style={{ color: activeSegment.color }}>
                   {activeSegment.name[0]}
                </div>
                <div>
                   <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">{activeSegment.name}</h4>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeSegment.growth} Longitudinal Growth Node</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Current Volume', value: activeSegment.value, color: 'blue' },
                  { label: 'Yield Potential', value: 'High', color: 'emerald' },
                  { label: 'Practitioner Load', value: 'Optimal', color: 'indigo' },
                  { label: 'Market Bench', value: '+4.2%', color: 'amber' }
                ].map(item => (
                  <div key={item.label} className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] group hover:bg-white hover:border-clinicPrimary/20 hover:shadow-google transition-all cursor-pointer">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.label}</p>
                     <p className={`text-[15px] font-black text-slate-800 uppercase tracking-tight`}>{item.value}</p>
                  </div>
                ))}
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ServicePopularity;
