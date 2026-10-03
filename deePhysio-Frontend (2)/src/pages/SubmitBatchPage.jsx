import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCloudUploadAlt, FaExclamationTriangle, FaPlus, FaFileInvoice, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const SubmitBatchPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [claims, setClaims] = useState([]);
    const [batchSelection, setBatchSelection] = useState([]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('deephysio_claims') || '[]');
        setClaims(saved);
    }, []);

    const executeBatchSubmission = () => {
        if (batchSelection.length === 0) return;
        
        const updated = claims.map(c => 
            batchSelection.includes(c.id) ? { 
                ...c, 
                status: 'Submitted', 
                notes: [...(c.notes || []), `Batch submitted on ${new Date().toLocaleDateString()}`] 
            } : c
        );
        
        localStorage.setItem('deephysio_claims', JSON.stringify(updated));
        
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            showToast(`Protocol successfully initialized. ${batchSelection.length} nodes transmitted to clearing house.`);
            navigate('/billing/claims');
        }, 2000);
    };

    const pendingClaims = claims.filter(c => c.status !== 'Submitted' && c.status !== 'Approved');

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-6 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/billing/claims')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Batch Protocol</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Initialize Global clearing house Transmission</p>
                </div>
            </div>

            <Card className="bg-white rounded-3xl shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[32px] flex items-start gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-soft shrink-0">
                            <FaExclamationTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Submission Pre-flight</p>
                            <p className="text-[11px] font-bold text-blue-700/80 uppercase tracking-tight leading-relaxed">
                                Select clinical nodes to include in the current transmission cycle. Only pending or edited claims are available for batching.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-3">
                        {pendingClaims.length > 0 ? pendingClaims.map(claim => (
                            <div 
                                key={claim.id} 
                                onClick={() => {
                                    setBatchSelection(prev => prev.includes(claim.id) ? prev.filter(id => id !== claim.id) : [...prev, claim.id]);
                                }}
                                className={`p-6 border rounded-[32px] cursor-pointer transition-all flex items-center justify-between group ${batchSelection.includes(claim.id) ? 'bg-clinicPrimary/5 border-clinicPrimary shadow-google scale-[1.01]' : 'bg-slate-50 border-slate-100 hover:border-clinicPrimary/30 hover:bg-white'}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${batchSelection.includes(claim.id) ? 'bg-clinicPrimary border-clinicPrimary' : 'border-slate-200 bg-white group-hover:border-clinicPrimary/50'}`}>
                                        {batchSelection.includes(claim.id) && <FaPlus className="text-white scale-75 rotate-45" />}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-black text-slate-800 tracking-tight leading-none">{claim.patient}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-[9px] font-black text-clinicPrimary uppercase tracking-widest bg-white border border-clinicPrimary/10 px-2 py-0.5 rounded-lg">{claim.provider}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{claim.code}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-lg font-black text-slate-900 tracking-tighter">{claim.amount}</p>
                            </div>
                        )) : (
                            <div className="py-24 text-center space-y-6">
                                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto text-slate-200">
                                    <FaCloudUploadAlt size={32} />
                                </div>
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">No pending nodes detected in current buffer</p>
                                <Button variant="secondary" className="h-12 rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest" onClick={() => navigate('/billing/claims')}>Return to Ledger</Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${batchSelection.length > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{batchSelection.length} Nodes Ready for Uplink</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                            onClick={() => navigate('/billing/claims')}
                        >
                            Abort
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                            disabled={batchSelection.length === 0} 
                            onClick={executeBatchSubmission}
                            leftIcon={<FaCloudUploadAlt />}
                        >
                            Execute Submission
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SubmitBatchPage;
