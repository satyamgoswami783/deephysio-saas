import React, { useState } from 'react';
import { 
  FaFileInvoice, FaBuilding, FaCalendarAlt, 
  FaPoundSign, FaArrowLeft, FaSave, FaClipboardCheck
} from 'react-icons/fa';
import PatientIcon from '../components/ui/PatientIcon';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { getActiveCurrencySymbol } from '../utils/currency';

const NewClaimPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('Claim Node Initialized: Electronic submission dispatched to provider gateway.');
            navigate('/billing/claims');
        }, 1500);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Insurance Claim</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Claim Initialization & Reimbursement Protocol</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden flex flex-col">
                <div className="p-10 space-y-12">
                    {/* Top Grid: Patient & Provider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6 text-slate-900">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-clinicPrimary rounded-full"></div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Patient Metadata</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Principal</label>
                                    <div className="relative">
                                        <PatientIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                                        <input type="text" className="w-full pl-14 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] font-bold outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all" placeholder="Patient Master Name..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage Date (Service)</label>
                                    <div className="relative">
                                        <FaCalendarAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input type="date" className="w-full pl-14 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] font-bold outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Provider Gateway</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Insurance Carrier</label>
                                    <div className="relative">
                                        <FaBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <select className="w-full pl-14 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] font-bold outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-amber-500/5 transition-all">
                                            <option>BUPA INTERNATIONAL</option>
                                            <option>AXA HEALTHCARE</option>
                                            <option>VITALITY HEALTH</option>
                                            <option>CIGNA GLOBAL</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reimbursement Node ({getActiveCurrencySymbol()})</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">{getActiveCurrencySymbol()}</span>
                                        <input type="text" className="w-full pl-14 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[14px] font-black text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/5 transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coding Section */}
                    <div className="space-y-6 pt-8 border-t border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Diagnosis & Clinical Coding</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ICD-10 Identifier</label>
                                <input type="text" className="w-full p-5 bg-slate-50 rounded-[20px] border border-slate-100 text-sm font-bold uppercase tracking-widest placeholder:opacity-30 focus:ring-4 focus:ring-emerald-500/5 transition-all" placeholder="e.g. M54.5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Matrix Description</label>
                                <input type="text" className="w-full p-5 bg-slate-50 rounded-[20px] border border-slate-100 text-sm font-bold placeholder:opacity-30 focus:ring-4 focus:ring-emerald-500/5 transition-all" placeholder="Principal service nature..." />
                            </div>
                        </div>
                    </div>

                    {/* Status Vector */}
                    <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-premium">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-3">
                                <FaClipboardCheck className="text-clinicPrimary" size={20}/>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Validation Protocol</h4>
                            </div>
                            <p className="text-sm font-black tracking-tighter opacity-80 uppercase tracking-widest">Digital Claim Integrity: VERIFIED & SEALED</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-clinicPrimary/10 rounded-full blur-3xl group-hover:bg-clinicPrimary/20 transition-all duration-1000"></div>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insurance gateway ready</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                            onClick={() => navigate(-1)}
                        >
                            Abort
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Submitting...' : 'Dispatch Claim'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NewClaimPage;
