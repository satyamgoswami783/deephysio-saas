import React, { useState } from 'react';
import { FaUserMd, FaArrowUp, FaArrowDown, FaStar, FaClock, FaCheckCircle, FaCalendarAlt, FaChartPie, FaHistory, FaChevronRight, FaMicroscope, FaBrain, FaFilter, FaDownload, FaSync, FaChartLine, FaUsers, FaBolt } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const StaffPerformance = () => {
  const { showToast } = useToast();
  const [activePractitioner, setActivePractitioner] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const staff = [
    { id: 'PRAC-001', name: 'Dr. Gregory House', role: 'Head of Clinical Ops', rating: 4.9, appointments: 124, revenue: '₹14.2k', load: '85%', status: 'Optimal', retention: '98%', efficiency: '94%' },
    { id: 'PRAC-002', name: 'Sarah Miller, PT', role: 'Senior Physiotherapist', rating: 4.7, appointments: 98, revenue: '₹9.4k', load: '72%', status: 'Stable', retention: '92%', efficiency: '88%' },
    { id: 'PRAC-003', name: 'Dr. James Wilson', role: 'Sports Bio-Specialist', rating: 4.8, appointments: 110, revenue: '₹12.1k', load: '78%', status: 'Audited', retention: '95%', efficiency: '91%' },
  ];

  const radarData = [
    { subject: 'Retention', A: 120, B: 110, fullMark: 150 },
    { subject: 'Clinic Speed', A: 98, B: 130, fullMark: 150 },
    { subject: 'Feedback', A: 86, B: 130, fullMark: 150 },
    { subject: 'Efficiency', A: 99, B: 100, fullMark: 150 },
    { subject: 'Billing Sync', A: 85, B: 90, fullMark: 150 },
  ];

  const handleAction = (action, item) => {
    showToast(`Human Capital Logic: Initiating "${action}" for Practitioner Node ${item ? item.id : 'Cluster'}. Authentication verified.`);
  };

  const runPerformanceAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      showToast('Institutional Audit Complete: All practitioner professional nodes are synchronized with the clinical excellence baseline.');
    }, 2000);
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Human Capital Intelligence</h1>
          <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[11px] opacity-80">Audit clinical productivity trajectories and optimize practitioner competency nodes.</p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <Button variant="secondary" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 border-none shadow-premium hover:shadow-google hover:-translate-y-1 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => setIsAuditModalOpen(true)} leftIcon={<FaHistory />}>History Audit</Button>
           <Button variant="accent" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 shadow-google active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest" onClick={runPerformanceAudit} disabled={isAuditing} leftIcon={isAuditing ? null : <FaSync />}>
             {isAuditing ? 'Auditing Nodes...' : 'Temporal Window Audit'}
           </Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-8 p-0 overflow-hidden border-none shadow-premium bg-white rounded-[40px]">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/20">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-4">
               <FaUserMd className="text-clinicPrimary" /> Professional Performance Matrix
            </h3>
            <span className="text-[10px] font-black text-clinicPrimary uppercase tracking-[0.3em] bg-blue-50 px-5 py-2 rounded-xl border border-blue-100 shadow-soft">Live Diagnostic Rankings</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] border-b border-slate-50">
                <tr>
                  <th className="px-10 py-6">Practitioner Node</th>
                  <th className="px-10 py-6 text-center">Protocol Rating</th>
                  <th className="px-10 py-6 text-center">Care Cycles</th>
                  <th className="px-10 py-6 text-center">Neural Load</th>
                  <th className="px-10 py-6 text-right">Yield Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-clinicPrimary" onClick={() => setActivePractitioner(s)}>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-clinicPrimary group-hover:text-white transition-all duration-500 shadow-soft group-hover:rotate-6 group-hover:scale-110">
                             <FaUserMd size={20}/>
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none group-hover:text-clinicPrimary transition-colors uppercase">{s.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 opacity-80">{s.role}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-amber-500 font-black text-xl tracking-tighter">
                             <FaStar size={16} className="text-amber-400" /> {s.rating}
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Global Percentile</span>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-center text-[16px] font-black text-slate-700 tracking-tighter">{s.appointments}</td>
                    <td className="px-10 py-8">
                       <div className="flex flex-col items-center gap-3">
                          <span className="text-[14px] font-black text-slate-900 leading-none tracking-tighter">{s.load}</span>
                          <div className="w-24 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner-soft">
                             <div className="bg-clinicPrimary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(46,167,184,0.3)]" style={{ width: s.load }}></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8 text-right font-black text-slate-900 text-[16px] tracking-tighter">{s.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="lg:col-span-4 space-y-8">
          <Card className="p-10 border-none shadow-premium bg-white group overflow-hidden rounded-[40px]">
             <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] mb-12 flex items-center gap-4">
                <FaMicroscope className="text-clinicPrimary" /> Competency Distribution
             </h3>
             <div className="h-[350px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#F1F5F9" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }} />
                      <Radar name="Institutional Baseline" dataKey="B" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={4} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', padding: '24px' }}
                      />
                   </RadarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-12 space-y-4">
                {[
                  { label: 'Retention Optimized', value: '+12%', icon: <FaCheckCircle />, color: 'emerald' },
                  { label: 'Billing Efficiency', value: '94.2%', icon: <FaCheckCircle />, color: 'blue' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between p-6 bg-slate-50 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-google transition-all cursor-pointer group/stat active:scale-95" onClick={() => handleAction('Review Aggregated Metric')}>
                     <div className="flex items-center gap-4">
                        <span className={`text-${stat.color}-500 group-hover/stat:scale-125 transition-transform`}>{stat.icon}</span>
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                     </div>
                     <span className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                  </div>
                ))}
             </div>
          </Card>

          <Card className="p-8 bg-slate-900 text-white border-none shadow-premium flex items-center gap-8 group hover:translate-x-3 transition-all rounded-[40px] cursor-pointer" onClick={() => handleAction('View Active Protocols')}>
             <div className="w-16 h-16 rounded-[28px] bg-white/5 flex items-center justify-center text-clinicPrimary font-black text-2xl border border-white/5 group-hover:scale-110 group-hover:bg-white/10 transition-all shadow-2xl">
                03
             </div>
             <div>
                <p className="text-[15px] font-black text-white uppercase tracking-tight leading-none mb-2">Active Protocols</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Verification Cycle Alpha-7</p>
             </div>
          </Card>
        </div>
      </div>

      {activePractitioner && (
        <Modal 
          isOpen={!!activePractitioner} 
          onClose={() => setActivePractitioner(null)}
          title="Professional Node Dossier"
          footer={
            <div className="flex gap-4 justify-end w-full px-2">
              <Button variant="secondary" onClick={() => setActivePractitioner(null)}>Close Dossier</Button>
              <Button variant="accent" onClick={() => handleAction('Generate Performance PDF', activePractitioner)} leftIcon={<FaDownload />}>Export Performance Audit</Button>
            </div>
          }
        >
          <div className="space-y-8 p-4 text-left font-sans">
             <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner-soft">
                <div className="w-24 h-24 bg-white rounded-[32px] shadow-premium flex items-center justify-center text-clinicPrimary border border-slate-50 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                   <FaUserMd size={40}/>
                </div>
                <div>
                   <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">{activePractitioner.name}</h4>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{activePractitioner.id} • {activePractitioner.role}</p>
                </div>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Yield Result', value: activePractitioner.revenue, icon: <FaChartLine />, color: 'emerald' },
                  { label: 'Retention', value: activePractitioner.retention, icon: <FaUsers />, color: 'blue' },
                  { label: 'Efficiency', value: activePractitioner.efficiency, icon: <FaBolt />, color: 'amber' },
                  { label: 'Status', value: activePractitioner.status, icon: <FaCheckCircle />, color: 'indigo' }
                ].map(item => (
                  <div key={item.label} className="p-6 bg-white border border-slate-50 rounded-[28px] shadow-soft group/card hover:shadow-google transition-all cursor-pointer">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-3">
                       <span className={`text-${item.color}-500 opacity-60`}>{item.icon}</span> 
                       {item.label}
                     </p>
                     <p className={`text-[15px] font-black text-slate-800 uppercase tracking-tight`}>{item.value}</p>
                  </div>
                ))}
             </div>
             <div className="p-8 bg-slate-900 rounded-[32px] border border-white/5 group cursor-pointer relative overflow-hidden" onClick={() => handleAction('Neural Competency Sync', activePractitioner)}>
                <div className="relative z-10">
                   <p className="text-[13px] font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3">
                     <FaBrain className="text-clinicPrimary" /> Neural Competency Tracking
                   </p>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] leading-relaxed">System is auditing practitioner decision paths against institutional clinical logic.</p>
                </div>
                <FaSync className="absolute -right-6 -bottom-6 text-white/5 text-[100px] rotate-12 group-hover:rotate-180 transition-all duration-1000" />
             </div>
          </div>
        </Modal>
      )}

      <Modal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)}
        title="Institutional Performance History"
        footer={
          <div className="flex gap-4 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)}>Close Registry</Button>
            <Button variant="accent" onClick={() => handleAction('Global Performance Export')} leftIcon={<FaDownload />}>Export Longitudinal Data</Button>
          </div>
        }
      >
        <div className="space-y-8 p-4 text-left">
           <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 shadow-inner-soft">
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-premium flex items-center justify-center text-clinicPrimary">
                 <FaHistory size={28}/>
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">Professional Audit History</h4>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Historical synchronization across 12 Diagnostic Cycles</p>
              </div>
           </div>
           <div className="space-y-4">
              {[
                { label: 'Institutional Peak', value: '98.2%', delta: '+2.4%' },
                { label: 'Professional Density', value: '84.8%', delta: 'Stable' },
                { label: 'Retention Baseline', value: '91.4%', delta: '+4.1%' }
              ].map(stat => (
                <div key={stat.label} className="p-6 bg-white border border-slate-50 rounded-[28px] flex items-center justify-between group cursor-pointer hover:shadow-google transition-all">
                  <span className="text-[13px] font-black text-slate-600 uppercase tracking-tight">{stat.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                    <span className="text-[10px] font-black text-clinicPrimary bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">{stat.delta}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffPerformance;
