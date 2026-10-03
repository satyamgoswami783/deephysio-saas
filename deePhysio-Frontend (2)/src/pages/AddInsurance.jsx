import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaBuilding, FaPlus, FaCheckCircle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const AddInsurance = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [provider, setProvider] = useState({
        name: '',
        type: 'Private',
        code: '',
        status: 'Active'
    });

    const handleSave = () => {
        if (!provider.name || !provider.code) {
            showToast('Clinical Connectivity Error: Provider Name and Identifier Code are required.', 'error');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('deephysio_insurance') || '[]');
        const newProvider = {
            ...provider,
            id: Date.now()
        };

        const updated = [newProvider, ...saved];
        localStorage.setItem('deephysio_insurance', JSON.stringify(updated));
        
        showToast('Insurance Provider Node Linked Successfully.');
        navigate('/billing/insurance');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/billing/insurance')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Register Insurer</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Network Connectivity Protocol</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <FaBuilding className="text-clinicPrimary" /> Provider Intelligence
                        </label>
                        <input 
                            type="text" 
                            placeholder="Search or enter insurer name (e.g. AXA, Bupa)..." 
                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                            value={provider.name}
                            onChange={e => setProvider({...provider, name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaShieldAlt className="text-clinicPrimary" /> Policy Class
                            </label>
                            <select 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                                value={provider.type}
                                onChange={e => setProvider({...provider, type: e.target.value})}
                            >
                                <option value="Private">Private Health</option>
                                <option value="Public">Public / State</option>
                                <option value="Corporate">Corporate / B2B</option>
                                <option value="Travel">Travel / Short Term</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <span className="text-clinicPrimary font-black">#</span> Logic Code
                            </label>
                            <input 
                                type="text" 
                                placeholder="Insurer Code (e.g. AXA-001)" 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={provider.code}
                                onChange={e => setProvider({...provider, code: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaCheckCircle className="text-clinicPrimary" /> Status
                            </label>
                            <select 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                                value={provider.status}
                                onChange={e => setProvider({...provider, status: e.target.value})}
                            >
                                <option value="Active">Active Connection</option>
                                <option value="Inactive">Disconnected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting cloud handshake</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                            onClick={() => navigate('/billing/insurance')}
                        >
                            Abort
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                            onClick={handleSave} 
                            leftIcon={<FaPlus />}
                        >
                            Deploy Node
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddInsurance;
