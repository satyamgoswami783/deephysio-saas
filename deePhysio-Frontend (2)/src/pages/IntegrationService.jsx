import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaSyncAlt, FaCog, FaCheckCircle, FaExclamationTriangle, FaHistory, FaCheck, FaTimes, FaLink, FaDatabase, FaLock, FaSync, FaBrain, FaGoogle, FaEnvelope, FaStripe, FaPaypal, FaShieldAlt } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const IntegrationService = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const serviceSlug = location.pathname.split('/').pop();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [biDirectional, setBiDirectional] = useState(true);
  const [webhook, setWebhook] = useState(false);
  const [syncInterval, setSyncInterval] = useState('15');

  const integrations = [
    { id: 'google', name: 'Google Workspace', type: 'Scheduling', status: 'Connected', icon: <FaGoogle />, color: 'text-red-500', desc: 'Sync clinical calendars and patient availability with Google Workspace Nodes.', throughput: '421 Syncs/Day' },
    { id: 'outlook', name: 'Microsoft 365', type: 'Scheduling', status: 'Inactive', icon: <FaEnvelope />, color: 'text-blue-500', desc: 'Synchronize Microsoft 365 clinical ecosystem and administrative mail.', throughput: '0 Syncs/Day' },
    { id: 'stripe', name: 'Stripe Financial', type: 'Billing', status: 'Connected', icon: <FaStripe />, color: 'text-indigo-500', desc: 'High-fidelity credit card orchestration and payment reconciliation.', throughput: '₹12.4k Processed' },
    { id: 'paypal', name: 'PayPal Gateway', icon: <FaPaypal />, type: 'Billing', status: 'Connected', color: 'text-blue-600', desc: 'Secondary financial checkout stream with global clinical support.', throughput: '₹2.1k Processed' },
    { id: 'quickbooks', name: 'QuickBooks Sync', icon: <FaDatabase />, type: 'Accounting', status: 'Inactive', color: 'text-green-600', desc: 'Automated ledger and invoice mirroring for financial compliance.', throughput: 'N/A' },
    { id: 'xero', name: 'Xero Accounting', icon: <FaDatabase />, type: 'Accounting', status: 'Connected', color: 'text-blue-400', desc: 'Direct bookkeeping synchronization and real-time ledger auditing.', throughput: 'Sync Balanced' },
  ];

  const currentService = integrations.find(i => i.id === serviceSlug) || integrations[0];

  const handleAction = (action) => {
    showToast(`Initiating "${action}" for ${currentService.name}. Handshake verified.`);
  };

  const runServiceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast(`${currentService.name} Synchronized: All clinical nodes updated and verified.`);
    }, 2000);
  };

  const handleCommitConfig = () => {
    showToast(`${currentService.name} configuration saved. Sync interval: ${syncInterval} min, Bi-directional: ${biDirectional ? 'On' : 'Off'}, Webhooks: ${webhook ? 'On' : 'Off'}.`);
    setIsConfigOpen(false);
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 animate-fade-in font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{currentService.name} Cluster</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Synchronize clinical data and optimize external node handshakes for peak operational density.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsConfigOpen(true)} leftIcon={<FaCog size={12}/>}>
            Configure Node
          </Button>
          <Button variant="accent" className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest" onClick={runServiceSync} disabled={isSyncing} leftIcon={<FaSync size={12} className={isSyncing ? 'animate-spin' : ''}/>}>
            {isSyncing ? 'Synchronizing...' : 'Manual Handshake'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          {/* Service Info Card */}
          <Card className="p-4 bg-white border-none shadow-sm rounded-2xl relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b border-slate-50 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-all shrink-0 ${currentService.color}`}>
                {currentService.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-clinicPrimary/5 text-clinicPrimary text-[9px] font-black uppercase tracking-widest rounded-lg border border-clinicPrimary/10">
                    {currentService.type} Protocol
                  </span>
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${currentService.status === 'Connected' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {currentService.status === 'Connected' ? <FaCheckCircle size={10}/> : <FaExclamationTriangle size={10}/>}
                    {currentService.status}
                  </div>
                </div>
                <h2 className="text-[14px] font-black text-slate-900 tracking-tight uppercase mb-1">{currentService.name} Protocol</h2>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{currentService.desc}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Latency Node', val: '124ms', sub: 'Verified Handshake' },
                { label: 'Daily Throughput', val: currentService.throughput, sub: 'Real-time Flow' },
                { label: 'Security State', val: 'AES-256', sub: 'Active Encryption' },
              ].map(metric => (
                <div key={metric.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric.label}</p>
                  <p className="text-[15px] font-black text-slate-800 tracking-tighter">{metric.val}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{metric.sub}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Ledger */}
          <Card className="p-4 bg-white border-none shadow-sm rounded-2xl space-y-3">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FaHistory className="text-clinicPrimary" size={10}/> Node Activity Ledger
            </h3>
            <div className="space-y-2">
              {[
                { event: 'Bi-directional Sync', status: 'Success', statusColor: 'text-emerald-500 bg-emerald-50 border-emerald-100', time: '12m ago', nodes: '12 Nodes' },
                { event: 'OAuth Signature Renewal', status: 'Verified', statusColor: 'text-blue-500 bg-blue-50 border-blue-100', time: '2h ago', nodes: 'System' },
                { event: 'Payload Transmission', status: 'Success', statusColor: 'text-emerald-500 bg-emerald-50 border-emerald-100', time: '5h ago', nodes: '42 Fragments' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-50 group hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => handleAction(`View ${log.event} Log`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-clinicPrimary shrink-0">
                      <FaSyncAlt size={11} className="group-hover:rotate-180 transition-transform duration-700"/>
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-800 tracking-tight uppercase leading-none mb-0.5">{log.event}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.time} • {log.nodes}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${log.statusColor}`}>{log.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-slate-900 text-white border-none shadow-sm relative overflow-hidden group rounded-2xl">
            <FaShieldAlt className="absolute -right-10 -top-10 text-white/5 text-[160px] pointer-events-none"/>
            <h3 className="text-[10px] font-black text-clinicPrimary uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
              <FaLock size={10}/> Security Perimeter
            </h3>
            <div className="space-y-3 relative z-10">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sync Direction</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-white uppercase tracking-tight">Bi-Directional</span>
                    <FaSyncAlt className="text-clinicPrimary" size={12}/>
                  </div>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Sensitivity</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-white uppercase tracking-tight">HIPAA / GDPR</span>
                    <FaShieldAlt className="text-amber-400" size={12}/>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 border-l-2 border-l-clinicPrimary">
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                  "All third-party handshakes are proxied through our clinical encryption node for maximum patient data sovereignty."
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 bg-white border-none shadow-sm flex flex-col items-center text-center group hover:-translate-y-0.5 hover:shadow-md transition-all rounded-2xl cursor-pointer"
            onClick={() => handleAction('Neural Manual Review')}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-clinicPrimary border border-slate-100 group-hover:scale-105 group-hover:rotate-3 transition-all mb-3">
              <FaBrain size={18} />
            </div>
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest mb-1">Neural Manual</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-3">Optimize trigger thresholds using historical synergy vectors.</p>
            <Button
              variant="secondary"
              className="w-full h-8 rounded-xl font-black text-[9px] uppercase tracking-widest"
              onClick={(e) => { e.stopPropagation(); handleAction('Launch Neural Manual'); }}
            >
              Open Manual
            </Button>
          </Card>
        </div>
      </div>

      {/* Inline Config Form */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setIsConfigOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">Configure {currentService.name}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adjust sync settings and API credentials</p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-1.5 text-slate-400 hover:text-clinicPrimary hover:bg-slate-50 rounded-lg transition-all">
                <FaTimes size={14}/>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Toggle switches */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Enable Bi-Directional Sync</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Push and pull data from both ends</p>
                  </div>
                  <button
                    onClick={() => setBiDirectional(!biDirectional)}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-all ${biDirectional ? 'bg-clinicPrimary' : 'bg-slate-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${biDirectional ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Real-time Webhook Stream</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instant push notifications on events</p>
                  </div>
                  <button
                    onClick={() => setWebhook(!webhook)}
                    className={`w-12 h-6 rounded-full p-0.5 relative transition-all ${webhook ? 'bg-clinicPrimary' : 'bg-slate-200'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${webhook ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>

              {/* Sync Interval */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sync Interval (minutes)</label>
                <select
                  value={syncInterval}
                  onChange={e => setSyncInterval(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary cursor-pointer"
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 60 minutes</option>
                </select>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">API Authentication Node</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                  <input
                    type="password"
                    defaultValue="************************"
                    className="w-full pl-9 pr-24 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-clinicPrimary uppercase tracking-widest hover:underline"
                    onClick={() => showToast('API key regenerated and saved.')}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Security notice */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <FaShieldAlt className="text-blue-500 shrink-0" size={14}/>
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed">System is running 12-factor secure integration protocols. Audit log #220-EX verified.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsConfigOpen(false)}>Abort Change</Button>
              <Button variant="accent" onClick={handleCommitConfig} leftIcon={<FaCheck size={12}/>}>
                Commit Protocol
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationService;
