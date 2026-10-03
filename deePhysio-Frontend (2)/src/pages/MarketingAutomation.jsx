import React, { useState } from 'react';
import { FaRobot, FaPlus, FaClock, FaCheckCircle, FaExclamationCircle, FaPlay, FaPause, FaSyncAlt, FaLayerGroup, FaBolt, FaMicroscope, FaBrain, FaChartLine, FaHistory, FaUserCircle, FaExclamationTriangle, FaChevronRight, FaTimes } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const MarketingAutomation = () => {
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'Post-Assessment Nurture', trigger: 'Initial Consultation', steps: 4, active: true, throughput: '1.2k', success: '94%' },
    { id: 2, name: 'Birthday Greetings Alpha', trigger: 'Patient Birthday', steps: 1, active: true, throughput: '850', success: '99%' },
    { id: 3, name: 'Re-engagement Sequence', trigger: '90 Days Inactivity', steps: 3, active: false, throughput: '420', success: 'N/A' },
    { id: 4, name: 'Review Request Delta', trigger: 'Visit Complete', steps: 2, active: true, throughput: '2.1k', success: '86%' },
  ]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [formData, setFormData] = useState({ name: '', trigger: 'Initial Consultation', delay: '2', delayUnit: 'Days' });

  const handleAction = (action, item) => {
    showToast(`Initiating "${action}"${item ? ` for Workflow ${item.id}` : ''}. Handshake verified.`);
  };

  const toggleWorkflow = (id) => {
    setWorkflows(workflows.map(w => w.id === id ? { ...w, active: !w.active } : w));
    const wf = workflows.find(w => w.id === id);
    showToast(`Workflow "${wf.name}" ${!wf.active ? 'Activated' : 'Paused'}.`);
  };

  const openEditor = (wf = null) => {
    setSelectedWorkflow(wf);
    setFormData({
      name: wf?.name || '',
      trigger: wf?.trigger || 'Initial Consultation',
      delay: '2',
      delayUnit: 'Days'
    });
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('Protocol Label is required.', 'error');
      return;
    }
    if (selectedWorkflow) {
      setWorkflows(workflows.map(w => w.id === selectedWorkflow.id ? { ...w, name: formData.name, trigger: formData.trigger } : w));
      showToast(`Workflow "${formData.name}" updated successfully!`);
    } else {
      const newWf = { id: Date.now(), name: formData.name, trigger: formData.trigger, steps: 1, active: false, throughput: '0', success: 'N/A' };
      setWorkflows(prev => [...prev, newWf]);
      showToast(`New workflow "${formData.name}" deployed!`);
    }
    setIsEditorOpen(false);
  };

  const runEngineSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('Automation Engine Synchronized: 12,421 scheduled transmissions verified and optimized.');
    }, 2000);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Autonomous Follow-up Clusters</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Build and deploy sophisticated, automated clinical follow-up sequences.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={runEngineSync} disabled={isSyncing} leftIcon={<FaSyncAlt size={12} className={isSyncing ? 'animate-spin' : ''}/>}>
            {isSyncing ? 'Optimizing...' : 'Engine Sync'}
          </Button>
          <Button variant="accent" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => openEditor(null)} leftIcon={<FaPlus size={12}/>}>
            Deploy Logic
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Workflow Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map(wf => (
            <Card
              key={wf.id}
              onClick={() => openEditor(wf)}
              className={`p-4 border border-slate-100 bg-white hover:shadow-md transition-all group cursor-pointer relative overflow-hidden rounded-xl border-t-2 ${wf.active ? 'border-t-clinicPrimary' : 'border-t-slate-200'}`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${wf.active ? 'bg-emerald-50/40' : 'bg-slate-50/40'} rounded-bl-full -mr-10 -mt-10 pointer-events-none`}></div>

              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${wf.active ? 'bg-clinicPrimary text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
                  <FaRobot size={16}/>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction('Clone Logic', wf); }}
                    className="w-7 h-7 bg-white border border-slate-100 text-slate-300 rounded-lg hover:text-clinicPrimary hover:border-clinicPrimary transition-all flex items-center justify-center"
                    title="Clone workflow"
                  >
                    <FaSyncAlt size={10}/>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWorkflow(wf.id); }}
                    className={`w-7 h-7 bg-white border border-slate-100 rounded-lg transition-all flex items-center justify-center ${wf.active ? 'text-amber-500 hover:border-amber-200' : 'text-emerald-500 hover:border-emerald-200'}`}
                    title={wf.active ? 'Pause' : 'Activate'}
                  >
                    {wf.active ? <FaPause size={10}/> : <FaPlay size={10}/>}
                  </button>
                </div>
              </div>

              <h3 className="text-[13px] font-black text-slate-800 tracking-tight uppercase leading-tight mb-1.5 relative z-10 group-hover:text-clinicPrimary transition-colors">{wf.name}</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 inline-block mb-3 relative z-10">Trigger: {wf.trigger}</p>

              <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Success Rate</p>
                  <p className="text-[14px] font-black text-slate-800 tracking-tight">{wf.success}</p>
                </div>
                <div className={`p-2.5 bg-slate-50 rounded-xl border ${wf.active ? 'border-emerald-100' : 'border-slate-100'}`}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">State</p>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${wf.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {wf.active ? 'Synchronized' : 'Standby'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">{i}</div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">+{wf.steps - 3} Logical Fragments</span>
                </div>
                <FaChevronRight size={10} className="text-slate-200 group-hover:text-clinicPrimary group-hover:translate-x-0.5 transition-all"/>
              </div>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-slate-900 text-white border-none shadow-sm relative overflow-hidden group rounded-2xl">
            <FaClock className="absolute -right-10 -top-10 text-white/5 text-[180px] pointer-events-none"/>
            <h3 className="text-[10px] font-black text-clinicPrimary uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
              <FaBolt size={10}/> Logic Engine Status
            </h3>
            <div className="space-y-3 relative z-10">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Task Cloud</p>
                    <p className="text-2xl font-black text-white tracking-tighter">1,240</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FaChartLine size={14}/>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Throughput (24h)</p>
                  <p className="text-2xl font-black text-white tracking-tighter">8,421</p>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 border-l-2 border-l-clinicPrimary">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><FaExclamationTriangle size={9}/> Neural Logic Active</p>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest italic">
                  "Automation protocols are calibrated for maximum GMT engagement."
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 bg-white border-none shadow-sm flex flex-col items-center text-center group hover:-translate-y-0.5 hover:shadow-md transition-all rounded-2xl cursor-pointer"
            onClick={() => handleAction('Run Predictive Audit')}
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-clinicPrimary border border-slate-100 group-hover:scale-105 group-hover:rotate-3 transition-all mb-3">
              <FaBrain size={22} />
            </div>
            <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">Neural Optimizer</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-4">Optimize trigger thresholds using historical patient engagement vectors.</p>
            <Button
              variant="secondary"
              className="w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] hover:shadow-sm"
              onClick={(e) => { e.stopPropagation(); handleAction('Run Predictive Audit'); }}
            >
              Analyze Flow
            </Button>
          </Card>
        </div>
      </div>

      {/* Inline Editor Form Panel */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsEditorOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">
                {selectedWorkflow ? 'Optimize Automation Logic' : 'Deploy Logic Prototype'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-clinicPrimary hover:bg-slate-50 rounded-lg transition-all"
              >
                <FaTimes size={14}/>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Label</label>
                <div className="relative">
                  <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                  <input
                    type="text"
                    placeholder="e.g. Post-Op Stabilization Nurture Alpha"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Inbound Trigger Node</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer"
                    value={formData.trigger}
                    onChange={e => setFormData(f => ({ ...f, trigger: e.target.value }))}
                  >
                    <option>Initial Consultation</option>
                    <option>Visit Complete</option>
                    <option>90 Days Inactivity</option>
                    <option>Patient Birthday</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Delay</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.delay}
                      onChange={e => setFormData(f => ({ ...f, delay: e.target.value }))}
                      className="w-16 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 text-center outline-none focus:ring-2 focus:ring-clinicPrimary/10"
                    />
                    <select
                      className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 cursor-pointer"
                      value={formData.delayUnit}
                      onChange={e => setFormData(f => ({ ...f, delayUnit: e.target.value }))}
                    >
                      <option>Minutes</option>
                      <option>Hours</option>
                      <option>Days</option>
                      <option>Weeks</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-200">Logic Flow Visualization</p>
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[10px] font-black text-clinicPrimary shrink-0">{i}</div>
                      <div className="flex-1 p-2.5 bg-white border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Execute: {i === 1 ? 'SMS Handshake' : 'Email Protocol'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAction('Add Logic Step')}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-clinicPrimary hover:text-clinicPrimary transition-all"
                  >
                    + Inject Logic Fragment
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsEditorOpen(false)}>Abort Protocol</Button>
              <Button variant="accent" onClick={handleSave} leftIcon={<FaCheckCircle size={12}/>}>
                {selectedWorkflow ? 'Update Logic' : 'Deploy Workflow'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingAutomation;
