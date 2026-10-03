import React, { useState } from 'react';
import { FaFilePdf, FaFileWord, FaFileUpload, FaSearch, FaFilter, FaPlus, FaTrashAlt, FaEye, FaDownload, FaBookMedical, FaShieldAlt, FaExclamationTriangle, FaMoneyBillWave, FaChevronRight, FaHistory, FaCheckCircle, FaMicroscope, FaBrain, FaLayerGroup } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const initialManuals = [
  { id: 1, title: 'Patient Check-in Protocol Alpha', category: 'SOP', type: 'PDF', size: '1.2 MB', date: 'Mar 10, 2026', icon: <FaBookMedical /> },
  { id: 2, title: 'Advanced Kinematic Rehab Node', category: 'Treatment', type: 'DOCX', size: '2.5 MB', date: 'Feb 24, 2026', icon: <FaBookMedical /> },
  { id: 3, title: 'Billing & Insurance Sync Handshake', category: 'Billing', type: 'PDF', size: '840 KB', date: 'Mar 01, 2026', icon: <FaMoneyBillWave /> },
  { id: 4, title: 'Emergency Evacuation SOP Delta', category: 'Emergency', type: 'PDF', size: '4.1 MB', date: 'Jan 15, 2026', icon: <FaExclamationTriangle className="text-rose-500" /> },
  { id: 5, title: 'HIPAA Compliance Ledger', category: 'SOP', type: 'PDF', size: '3.2 MB', date: 'Dec 12, 2025', icon: <FaShieldAlt /> },
];

const ClinicManual = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [manualsList, setManualsList] = useState(initialManuals);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedManual, setSelectedManual] = useState(null);
  const [newSOPData, setNewSOPData] = useState({ title: '', category: 'SOP', type: 'PDF' });

  const categories = ['All', 'SOP', 'Treatment', 'Billing', 'Emergency'];

  const filteredManuals = manualsList.filter(m => 
    (activeCategory === 'All' || m.category === activeCategory) &&
    (m.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAction = (action, item) => {
    showToast(`Intelligence Logic: Initiating "${action}" for ${item ? `Protocol ${item.id}` : 'Manual Hub'}. Protocol verified.`);
  };

  const handleInjectSOP = () => {
    if (!newSOPData.title.trim()) {
      showToast('Please provide a protocol title.', 'error');
      return;
    }
    const newManual = {
      id: Date.now(),
      title: newSOPData.title,
      category: newSOPData.category,
      type: newSOPData.type,
      size: (Math.random() * 5 + 1).toFixed(1) + ' MB',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      icon: newSOPData.category === 'Emergency' ? <FaExclamationTriangle className="text-rose-500" /> : 
            newSOPData.category === 'Billing' ? <FaMoneyBillWave /> : <FaBookMedical />
    };
    setManualsList([newManual, ...manualsList]);
    showToast(`${newManual.title} injected into ledger successfully.`, 'success');
    setIsUploadOpen(false);
    setNewSOPData({ title: '', category: 'SOP', type: 'PDF' });
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in font-sans">
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Clinical Standards Ledger</h1>
          <p className="text-slate-500 font-bold mt-3 uppercase tracking-widest text-[11px] opacity-80">Centralized intelligence hub for high-fidelity clinical protocols and operational SOP nodes.</p>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
           <Button variant="secondary" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 border-none shadow-premium hover:shadow-google hover:-translate-y-1 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => handleAction('Sync Manuals')} leftIcon={<FaHistory />}>History</Button>
           <Button variant="accent" size="lg" className="flex-1 lg:flex-none rounded-[24px] h-14 px-8 shadow-google active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest" onClick={() => setIsUploadOpen(true)} leftIcon={<FaFileUpload />}>Inject SOP</Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="flex flex-col lg:flex-row items-center gap-8 px-6">
        <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto custom-scrollbar pb-3 lg:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-none ${activeCategory === cat ? 'bg-clinicPrimary text-white shadow-google scale-105' : 'bg-white text-slate-400 hover:text-slate-600 hover:shadow-soft shadow-premium'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full lg:ml-auto relative group/search lg:max-w-md">
          <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/search:text-clinicPrimary transition-colors" size={14}/>
          <input
            type="text"
            placeholder="Query manual nodes..."
            className="block w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[24px] text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all shadow-premium placeholder:text-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredManuals.map((manual) => (
          <Card key={manual.id} className="p-6 lg:p-7 border border-slate-100 shadow-sm bg-white group hover:shadow-soft hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden rounded-3xl min-h-[300px]">
            <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 text-slate-400 group-hover:bg-clinicPrimary group-hover:text-white transition-all duration-300 group-hover:scale-105 group-hover:rotate-3`}>
              {React.cloneElement(manual.icon, { size: 22 })}
            </div>
            <span className="text-[10px] font-bold text-clinicPrimary uppercase tracking-widest bg-clinicPrimary/5 px-3 py-1 rounded-md border border-clinicPrimary/10 mb-4">{manual.category} Fragment</span>
            <h3 className="text-[16px] font-bold text-slate-800 mb-2 group-hover:text-clinicPrimary transition-colors tracking-tight leading-snug line-clamp-2 px-2">{manual.title}</h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-6">{manual.type} • {manual.size} • {manual.date}</p>
            
            <div className="w-full grid grid-cols-2 gap-3 mt-auto relative z-10">
              <Button variant="secondary" className="rounded-xl h-10 border border-slate-200 bg-slate-50 hover:bg-white transition-all font-bold text-[11px] uppercase tracking-wider" onClick={(e) => { e.stopPropagation(); setSelectedManual(manual); setInspectModalOpen(true); }} leftIcon={<FaEye size={12}/>}>Inspect</Button>
              <Button variant="secondary" className="rounded-xl h-10 border border-slate-200 bg-slate-50 hover:bg-white transition-all font-bold text-[11px] uppercase tracking-wider" onClick={(e) => { e.stopPropagation(); handleAction('Download Node', manual); }} leftIcon={<FaDownload size={12}/>}>Stream</Button>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setManualsList(manualsList.filter(m => m.id !== manual.id)); showToast('Protocol purged from ledger.'); }}
                className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
              >
                <FaTrashAlt size={12} />
              </button>
            </div>
            
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-clinicPrimary/5 rounded-full blur-2xl group-hover:bg-clinicPrimary/10 transition-all duration-500 pointer-events-none"></div>
          </Card>
        ))}

        <Card 
          onClick={() => setIsUploadOpen(true)}
          className="p-6 lg:p-7 border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all rounded-3xl min-h-[300px]"
        >
           <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-5 group-hover:border-clinicPrimary group-hover:bg-clinicPrimary/5 transition-all duration-300 group-hover:scale-105">
              <FaPlus className="text-slate-300 group-hover:text-clinicPrimary transition-colors" size={22}/>
           </div>
           <h3 className="text-[16px] font-bold text-slate-500 group-hover:text-clinicPrimary transition-colors tracking-tight">Append Logic</h3>
           <p className="text-[11px] font-medium text-slate-400 mt-2">Upload PDF/DOCX protocols.</p>
        </Card>
      </div>

      {filteredManuals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[40px] shadow-premium border border-slate-50 animate-fade-in">
           <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-100 mb-8 border border-slate-100 shadow-soft">
              <FaMicroscope size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-300 tracking-tighter uppercase leading-none px-10 text-center">No knowledge fragments correlated for this query</h3>
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mt-6 opacity-60">Adjust your neural filters to find the manual node.</p>
        </div>
      )}

      <Modal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        title="Inject Clinical SOP Node"
        footer={
          <div className="flex gap-4 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>Abort Upload</Button>
            <Button variant="accent" onClick={handleInjectSOP} leftIcon={<FaCheckCircle />}>Push to Cloud</Button>
          </div>
        }
      >
        <div className="space-y-8 p-4 font-sans text-left">
           <div className="p-10 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center bg-slate-50 group hover:border-clinicPrimary/30 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 shadow-soft flex items-center justify-center text-clinicPrimary mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                 <FaFileUpload size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">Drop SOP Fragment</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Max Payload: 25.0 MB • Supports PDF, DOCX, XLSX</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 col-span-1 md:col-span-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Protocol Title <span className="text-rose-500">*</span></label>
                 <input 
                   type="text" 
                   value={newSOPData.title}
                   onChange={(e) => setNewSOPData({...newSOPData, title: e.target.value})}
                   placeholder="Enter document title..."
                   className="block w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all cursor-text placeholder:text-slate-300"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Protocol Category</label>
                 <select 
                    value={newSOPData.category}
                    onChange={(e) => setNewSOPData({...newSOPData, category: e.target.value.replace(' Protocol', '')})}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all cursor-pointer appearance-none"
                 >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c} Protocol</option>)}
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Access Permissions</label>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-[24px] flex items-center gap-4 h-[58px]">
                    <FaShieldAlt className="text-clinicPrimary" />
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Practitioners Only</span>
                 </div>
              </div>
           </div>

           <Card className="p-8 bg-slate-900 border border-white/5 rounded-[32px] relative overflow-hidden group">
              <div className="relative z-10 flex items-center gap-8">
                 <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-clinicPrimary shadow-glass shrink-0">
                    <FaBrain size={24} />
                 </div>
                 <div>
                    <h5 className="text-lg font-black text-white uppercase tracking-tighter mb-2 leading-none">Knowledge Cataloging</h5>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Neural engine will automatically index fragment metadata for global query optimization.</p>
                 </div>
              </div>
              <FaLayerGroup className="absolute right-0 bottom-0 text-white/5 text-[150px] rotate-12 pointer-events-none" />
           </Card>
        </div>
      </Modal>

      <Modal 
        isOpen={inspectModalOpen} 
        onClose={() => setInspectModalOpen(false)}
        title={selectedManual?.title || "Inspect Document"}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => setInspectModalOpen(false)}>Close Inspector</Button>
            <Button variant="accent" leftIcon={<FaDownload />}>Stream Source</Button>
          </div>
        }
      >
        <div className="w-full min-h-[400px] p-10 bg-slate-50/50 rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
           {selectedManual?.icon && React.cloneElement(selectedManual.icon, { size: 64, className: 'mb-8 text-slate-300 relative z-10' })}
           <h2 className="text-xl md:text-2xl font-black text-slate-500 uppercase tracking-widest leading-tight mb-3 text-center relative z-10">{selectedManual?.title}</h2>
           <p className="text-xs font-bold opacity-70 uppercase tracking-widest relative z-10">{selectedManual?.type} • {selectedManual?.size} • Verified secure</p>
           
           <div className="mt-12 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-sm text-center relative z-10 hover:shadow-md transition-shadow">
              <FaShieldAlt className="mx-auto text-emerald-400 mb-3" size={24} />
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">Document securely encrypted. In a live environment, the integrated PDF/DOCX renderer would mount within this frame.</p>
           </div>

           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-clinicPrimary/5 rounded-full blur-[60px] pointer-events-none"></div>
        </div>
      </Modal>

    </div>
  );
};

export default ClinicManual;
