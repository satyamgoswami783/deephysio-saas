import React, { useState } from 'react';
import { 
  FaArrowLeft, FaPrint, FaShareAlt, FaPlus, FaCheckDouble, FaChartLine, FaClipboardCheck, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const DischargeSummary = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('Clinical File Finalized: Patient discharged with optimized outcome trajectory.');
            navigate(-1);
        }, 2000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                    <ClinicalNoteIcon className="text-amber-500" size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Discharge Summary</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Final Clinical Closure & Outcome Audit</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden flex flex-col">
                <div className="p-10 space-y-12">
                    {/* Outcome Synthesis */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Outcome Achievement</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Pain (VAS)</label>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-slate-300">8/10</span>
                                    <div className="px-3 py-1 bg-slate-200 rounded-lg text-[8px] font-black uppercase text-slate-500">Baseline</div>
                                </div>
                            </div>
                            <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 space-y-2">
                                <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest ml-1">Current Delta (VAS)</label>
                                <div className="flex items-center gap-3">
                                    <input type="text" className="bg-transparent border-none text-2xl font-black text-emerald-600 outline-none w-20" placeholder="0/10" defaultValue="1/10" />
                                    <div className="px-3 py-1 bg-emerald-500 rounded-lg text-[8px] font-black uppercase text-white shadow-sm">Discharged</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Mobility Restore', 'Work Return', 'Pain Proficiency', 'HEP Compliance'].map(goal => (
                                <div key={goal} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-google transition-all cursor-pointer flex items-center gap-2 group">
                                    <FaCheckDouble size={10} className="text-emerald-500" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{goal}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Matrix */}
                    <div className="space-y-6 pt-8 border-t border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-clinicPrimary rounded-full"></div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Clinical Narrative synthèse</h3>
                        </div>
                        <textarea className="w-full min-h-[160px] p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-[14px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 shadow-inner-soft" placeholder="Final clinical overview and response to intervention..."></textarea>
                    </div>

                    {/* Recommendations & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Future Care Vectors</h3>
                            </div>
                            <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-4 shadow-premium">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                                    <FaClipboardCheck className="text-amber-500"/> Post-Discharge Protocols
                                </label>
                                <textarea className="w-full bg-transparent border-none text-[13px] font-bold outline-none resize-none h-24 placeholder:text-slate-700" placeholder="Recommendations for patient maintenance..."></textarea>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Operational Metrics</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: 'Total Sessions', val: '12', icon: <FaFileAlt className="text-indigo-400"/> },
                                    { label: 'ROM Recovery', val: '95%', icon: <FaChartLine className="text-emerald-400"/> },
                                    { label: 'Cycle Duration', val: '42 Days', icon: <FaCheckDouble className="text-clinicPrimary"/> }
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {stat.icon}
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final clinical audit synced</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-blue-50 hover:text-blue-600" 
                            onClick={() => setEmailModalOpen(true)}
                        >
                            <FaEnvelope size={12} className="mr-2" /> Email
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all bg-emerald-500 hover:bg-emerald-600 border-none" 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Synchronizing...' : 'Final Discharge Node'}
                        </Button>
                    </div>
                </div>
            </Card>

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                type="Note"
                data={{
                    type: 'Discharge Summary',
                    id: id
                }}
            />
        </div>
    );
};

export default DischargeSummary;
